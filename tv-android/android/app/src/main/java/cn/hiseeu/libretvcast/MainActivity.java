package cn.hiseeu.libretvcast;

import com.getcapacitor.BridgeActivity;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.webkit.WebView;
import android.widget.Toast;

public class MainActivity extends BridgeActivity {
    private long lastExitPress = 0;
    private Toast exitToast;

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN && event.getKeyCode() != KeyEvent.KEYCODE_BACK) {
            lastExitPress = 0;
            if (exitToast != null) exitToast.cancel();
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (webView == null) { confirmExit(); return; }
        String script = "(() => {"
            + "const target=document.activeElement || document.body;"
            + "const dialog=Array.from(document.querySelectorAll('[role=dialog]')).some(e=>e.getClientRects().length);"
            + "const event=new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});"
            + "if(!target.dispatchEvent(event) || dialog) return 'handled';"
            + "if(target!==document.body && target!==document.documentElement){target.blur();return 'handled';}"
            + "if(location.pathname!=='/' && location.pathname!=='/index.html'){"
            + "if(history.length>1) history.back(); else location.assign('/');return 'handled';}"
            + "return 'exit';})()";
        webView.evaluateJavascript(script, result -> runOnUiThread(() -> {
            if ("\"exit\"".equals(result)) confirmExit();
            else { lastExitPress = 0; if (exitToast != null) exitToast.cancel(); }
        }));
    }

    private void confirmExit() {
        long now = SystemClock.elapsedRealtime();
        if (lastExitPress > 0 && now - lastExitPress <= 3000) {
            if (exitToast != null) exitToast.cancel();
            finish();
            return;
        }
        lastExitPress = now;
        if (exitToast != null) exitToast.cancel();
        exitToast = Toast.makeText(this, "再按一次返回退出（3秒内）", Toast.LENGTH_SHORT);
        exitToast.show();
    }
}
