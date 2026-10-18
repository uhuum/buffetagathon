package br.com.buffetagathon.agenda;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.google.firebase.messaging.FirebaseMessaging;
import org.json.JSONObject;

/**
 * WebView restrito ao Agathon HTTPS com push via Firebase Android.
 * Nao expoe JavaScriptInterface para paginas externas.
 */
public class MainActivity extends Activity {
    private static final String APP_URL = "https://agathonapp.netlify.app/";
    private static final String APP_HOST = "agathonapp.netlify.app";
    private static final int REQUEST_NOTIFICATIONS = 101;
    private static final int REQUEST_FILES = 102;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String nativeToken;

    private boolean isAppUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            return "https".equalsIgnoreCase(uri.getScheme())
                && APP_HOST.equalsIgnoreCase(uri.getHost());
        } catch (Exception ignored) {
            return false;
        }
    }

    private void openExternal(String url) {
        try {
            Uri uri = Uri.parse(url);
            String scheme = uri.getScheme();
            if (!"https".equalsIgnoreCase(scheme)
                && !"http".equalsIgnoreCase(scheme)
                && !"tel".equalsIgnoreCase(scheme)
                && !"mailto".equalsIgnoreCase(scheme)) return;
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) { }
    }

    private void transmitToken() {
        if (webView == null || nativeToken == null || !isAppUrl(webView.getUrl())) return;
        // A propria pagina autenticada salva o token, usando seus cookies.
        String script = "(function(){"
            + "window.__AGATHON_NATIVE_TOKEN=" + JSONObject.quote(nativeToken) + ";"
            + "window.dispatchEvent(new CustomEvent('agathon:native-token'));"
            + "})();";
        webView.evaluateJavascript(script, null);
    }

    private void refreshToken() {
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(value -> {
            if (value == null || value.isEmpty()) return;
            nativeToken = value;
            getSharedPreferences("agathon", MODE_PRIVATE).edit()
                .putString("fcm_token", value).apply();
            transmitToken();
        });
    }

    @Override
    @SuppressWarnings("SetJavaScriptEnabled")
    public void onCreate(Bundle state) {
        super.onCreate(state);
        AgathonMessagingService.createAlertChannel(this);
        if (Build.VERSION.SDK_INT >= 33
            && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                REQUEST_NOTIFICATIONS);
        }

        webView = new WebView(this);
        webView.setBackgroundColor(0xff1a0a2e);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(settings.getUserAgentString() + " AgathonAndroid/1.0");
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                String url = request.getUrl().toString();
                if (isAppUrl(url)) return false;
                openExternal(url);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (isAppUrl(url)) transmitToken();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), REQUEST_FILES);
                    return true;
                } catch (ActivityNotFoundException ex) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message,
                    JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton("OK", (dialog, which) -> result.confirm())
                    .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message,
                    JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton("OK", (dialog, which) -> result.confirm())
                    .setOnCancelListener(dialog -> result.confirm()).show();
                return true;
            }
        });

        webView.setDownloadListener((url, ua, disposition, mime, size) -> {
            if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) {
                openExternal(url);
            }
        });

        setContentView(webView);
        nativeToken = getSharedPreferences("agathon", MODE_PRIVATE)
            .getString("fcm_token", null);
        webView.loadUrl(APP_URL);
        refreshToken();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) refreshToken();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILES && fileCallback != null) {
            fileCallback.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
