(() => {
    if (!window.AndroidNative || window.__TAURI_INTERNALS__) return;

    const pending = new Map();
    let requestId = 0;

    const invoke = (command, args = {}) => new Promise((resolve, reject) => {
        const id = `android-${++requestId}`;
        pending.set(id, { resolve, reject });
        window.AndroidNative.invoke(id, command, JSON.stringify(args));
    });

    window.__androidNativeResult = (id, payload, failed) => {
        const callbacks = pending.get(id);
        if (!callbacks) return;
        pending.delete(id);
        let value;
        try {
            value = JSON.parse(payload);
        } catch {
            value = payload;
        }
        if (failed) callbacks.reject(value);
        else callbacks.resolve(value);
    };

    window.__TAURI_INTERNALS__ = { invoke };
    window.__TAURI__ = window.__TAURI__ || {};
    window.__TAURI__.core = { invoke };
})();
