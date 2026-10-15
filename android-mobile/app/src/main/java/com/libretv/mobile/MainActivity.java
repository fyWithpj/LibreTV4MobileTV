package com.libretv.mobile;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExecutorService networkExecutor = Executors.newFixedThreadPool(6);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(12, 12, 12));
        getWindow().setNavigationBarColor(Color.BLACK);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(12, 12, 12));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.addJavascriptInterface(new AndroidNativeBridge(), "AndroidNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);
        webView.loadUrl("file:///android_asset/public/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidNative");
            webView.destroy();
            webView = null;
        }
        networkExecutor.shutdownNow();
        super.onDestroy();
    }

    private final class AndroidNativeBridge {
        @JavascriptInterface
        public void invoke(String requestId, String command, String argsJson) {
            networkExecutor.execute(() -> {
                boolean failed = false;
                String result;
                try {
                    if (!"make_http_request".equals(command)) {
                        throw new IllegalArgumentException("Android bridge does not support command: " + command);
                    }
                    JSONObject args = new JSONObject(argsJson == null ? "{}" : argsJson);
                    JSONObject options = args.optJSONObject("options");
                    if (options == null) throw new IllegalArgumentException("Missing request options");
                    result = makeHttpRequest(options).toString();
                } catch (Exception ex) {
                    failed = true;
                    try {
                        JSONObject error = new JSONObject();
                        error.put("error", "Network request failed");
                        error.put("details", ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage());
                        result = error.toString();
                    } catch (Exception ignored) {
                        result = "{\"error\":\"Network request failed\"}";
                    }
                }

                final boolean hasFailed = failed;
                final String payload = result;
                mainHandler.post(() -> {
                    if (webView == null) return;
                    String script = "window.__androidNativeResult(" + JSONObject.quote(requestId) + ","
                            + JSONObject.quote(payload) + "," + hasFailed + ");";
                    webView.evaluateJavascript(script, null);
                });
            });
        }
    }

    private JSONObject makeHttpRequest(JSONObject options) throws Exception {
        String requestUrl = options.optString("url", "");
        URL url = new URL(requestUrl);
        String protocol = url.getProtocol();
        if (!"http".equalsIgnoreCase(protocol) && !"https".equalsIgnoreCase(protocol)) {
            throw new IllegalArgumentException("Only HTTP and HTTPS source URLs are supported");
        }

        int timeoutSeconds = options.optInt("timeout_secs", 20);
        int timeoutMs = Math.max(3000, Math.min(timeoutSeconds, 60) * 1000);
        String method = options.optString("method", "GET").toUpperCase();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(timeoutMs);
        connection.setReadTimeout(timeoutMs);
        connection.setRequestMethod(method);
        connection.setRequestProperty("User-Agent", "LibreTV-Android/1.0");

        JSONObject requestHeaders = options.optJSONObject("headers");
        if (requestHeaders != null) {
            Iterator<String> names = requestHeaders.keys();
            while (names.hasNext()) {
                String name = names.next();
                String value = requestHeaders.optString(name, "");
                if (!name.isEmpty() && !"host".equalsIgnoreCase(name) && !"content-length".equalsIgnoreCase(name)) {
                    connection.setRequestProperty(name, value);
                }
            }
        }

        Object requestBody = options.opt("body");
        if (requestBody != null && !JSONObject.NULL.equals(requestBody)
                && ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method))) {
            connection.setDoOutput(true);
            byte[] bodyBytes = requestBody instanceof String
                    ? ((String) requestBody).getBytes(StandardCharsets.UTF_8)
                    : requestBody.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(bodyBytes);
            }
        }

        int status = connection.getResponseCode();
        JSONObject responseHeaders = new JSONObject();
        for (String key : connection.getHeaderFields().keySet()) {
            if (key == null) continue;
            String value = connection.getHeaderField(key);
            if (value != null) responseHeaders.put(key.toLowerCase(), value);
        }

        InputStream responseStream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
        String body = responseStream == null ? "" : readUtf8(responseStream);
        connection.disconnect();

        JSONObject response = new JSONObject();
        response.put("status", status);
        response.put("headers", responseHeaders);
        response.put("body", body);
        return response;
    }

    private String readUtf8(InputStream input) throws Exception {
        try (InputStream stream = input; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = stream.read(buffer)) != -1) output.write(buffer, 0, count);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        }
    }
}
