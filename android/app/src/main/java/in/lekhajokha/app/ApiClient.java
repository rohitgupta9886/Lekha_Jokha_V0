package in.lekhajokha.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class ApiClient {

    private static final String PREF_NAME = "lekhajokha_api_prefs";
    private static final String KEY_BASE_URL = "api_base_url";
    private static final String KEY_SYNC_QUEUE = "offline_sync_queue";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    private static final String KEY_ACTIVE_BUSINESS_ID = "active_business_id";
    private static final String KEY_USER_DATA = "user_data";

    public static final String PRODUCTION_URL = "https://lekhajokha-app.onrender.com";

    public static final String[] CANDIDATE_URLS = {
        PRODUCTION_URL,
        "http://10.0.2.2:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3000"
    };

    private static ApiClient instance;
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private String baseUrl = CANDIDATE_URLS[0];
    private String token = null;
    private String activeBusinessId = null;
    private Context appContext = null;
    private AuthListener authListener = null;

    public interface Callback {
        void onSuccess(JSONObject response);
        void onError(Exception e);
    }

    public interface LatencyCallback {
        void onSuccess(long latencyMs, JSONObject response);
        void onError(Exception e);
    }

    public interface SyncCallback {
        void onComplete(int syncedCount, int failedCount);
    }

    public interface AuthListener {
        void onSessionExpired();
    }

    public static synchronized ApiClient getInstance() {
        if (instance == null) {
            instance = new ApiClient();
        }
        return instance;
    }

    public void setAuthListener(AuthListener listener) {
        this.authListener = listener;
    }

    public void init(Context context) {
        if (context == null) return;
        this.appContext = context.getApplicationContext();
        SharedPreferences prefs = this.appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String saved = prefs.getString(KEY_BASE_URL, null);
        if (saved != null && !saved.trim().isEmpty() && !saved.contains("192.168.1.6")) {
            this.baseUrl = saved.trim().replaceAll("/+$", "");
        } else {
            this.baseUrl = CANDIDATE_URLS[0];
        }

        this.token = prefs.getString(KEY_AUTH_TOKEN, null);
        this.activeBusinessId = prefs.getString(KEY_ACTIVE_BUSINESS_ID, null);
    }

    public void setBaseUrl(String url) {
        if (url != null && !url.trim().isEmpty()) {
            this.baseUrl = url.trim().replaceAll("/+$", "");
            if (appContext != null) {
                appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                    .edit()
                    .putString(KEY_BASE_URL, this.baseUrl)
                    .apply();
            }
        }
    }

    public String getBaseUrl() {
        return this.baseUrl;
    }

    public void setToken(String token) {
        this.token = token;
        if (appContext != null) {
            appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_AUTH_TOKEN, token)
                .apply();
        }
    }

    public String getToken() {
        return this.token;
    }

    public void setActiveBusinessId(String businessId) {
        this.activeBusinessId = businessId;
        if (appContext != null) {
            appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_ACTIVE_BUSINESS_ID, businessId)
                .apply();
        }
    }

    public String getActiveBusinessId() {
        return this.activeBusinessId;
    }

    public boolean isAuthenticated() {
        return this.token != null && !this.token.trim().isEmpty();
    }

    public void clearAuth() {
        this.token = null;
        this.activeBusinessId = null;
        if (appContext != null) {
            appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .edit()
                .remove(KEY_AUTH_TOKEN)
                .remove(KEY_ACTIVE_BUSINESS_ID)
                .remove(KEY_USER_DATA)
                .apply();
        }
    }

    public JSONObject getUserData() {
        if (appContext == null) return null;
        String raw = appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            .getString(KEY_USER_DATA, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }

    // Fast probe to detect the best reachable candidate URL
    public void probeCandidates(Runnable onComplete) {
        executor.execute(() -> {
            AtomicBoolean found = new AtomicBoolean(false);
            List<String> list = new ArrayList<>();
            list.add(baseUrl);
            for (String c : CANDIDATE_URLS) {
                if (!c.equals(baseUrl)) list.add(c);
            }

            for (String c : list) {
                if (found.get()) break;
                try {
                    URL u = new URL(c + "/api/v1/health");
                    HttpURLConnection conn = (HttpURLConnection) u.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(1000);
                    conn.setReadTimeout(1500);
                    conn.setRequestProperty("Accept", "application/json");
                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 400) {
                        setBaseUrl(c);
                        found.set(true);
                        conn.disconnect();
                        break;
                    }
                    conn.disconnect();
                } catch (Exception ignored) {}
            }

            if (onComplete != null) {
                mainHandler.post(onComplete);
            }
        });
    }

    // Ping test with roundtrip latency measurement
    public void testConnection(String candidateUrl, LatencyCallback callback) {
        executor.execute(() -> {
            long start = System.currentTimeMillis();
            try {
                String target = (candidateUrl != null && !candidateUrl.trim().isEmpty()) ? candidateUrl.trim().replaceAll("/+$", "") : baseUrl;
                URL url = new URL(target + "/api/v1/health");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(2000);
                conn.setReadTimeout(3000);
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("X-Client-Platform", "Android");

                int code = conn.getResponseCode();
                long latency = System.currentTimeMillis() - start;

                BufferedReader reader = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                ));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();

                JSONObject json = new JSONObject(sb.toString());
                if (code >= 200 && code < 300) {
                    setBaseUrl(target);
                    mainHandler.post(() -> callback.onSuccess(latency, json));
                } else {
                    mainHandler.post(() -> callback.onError(new Exception("HTTP " + code + ": " + json.optString("error", "Error"))));
                }
            } catch (Exception e) {
                mainHandler.post(() -> callback.onError(e));
            }
        });
    }

    public void get(String endpoint, Callback callback) {
        executor.execute(() -> {
            Exception lastException = null;
            List<String> toTry = new ArrayList<>();
            toTry.add(baseUrl);
            for (String c : CANDIDATE_URLS) {
                if (!c.equals(baseUrl)) toTry.add(c);
            }

            for (String candidate : toTry) {
                try {
                    String fullUrl = candidate + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
                    URL url = new URL(fullUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(1800);
                    conn.setReadTimeout(4000);
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setRequestProperty("X-Client-Platform", "Android");

                    if (token != null && !token.trim().isEmpty()) {
                        conn.setRequestProperty("Authorization", "Bearer " + token);
                    }
                    if (activeBusinessId != null && !activeBusinessId.trim().isEmpty()) {
                        conn.setRequestProperty("X-Business-Id", activeBusinessId);
                    }

                    int code = conn.getResponseCode();
                    if (code == 401) {
                        clearAuth();
                        if (authListener != null) {
                            mainHandler.post(() -> authListener.onSessionExpired());
                        }
                    }

                    BufferedReader reader = new BufferedReader(new InputStreamReader(
                            code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                            StandardCharsets.UTF_8
                    ));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    setBaseUrl(candidate);
                    if (code >= 200 && code < 300) {
                        mainHandler.post(() -> callback.onSuccess(json));
                    } else {
                        mainHandler.post(() -> callback.onError(new Exception("HTTP " + code + ": " + json.optString("error", "Error"))));
                    }
                    return;
                } catch (Exception e) {
                    lastException = e;
                }
            }
            final Exception finalEx = lastException != null ? lastException : new Exception("Connection timeout");
            mainHandler.post(() -> callback.onError(finalEx));
        });
    }

    public void post(String endpoint, JSONObject payload, Callback callback) {
        executor.execute(() -> {
            Exception lastException = null;
            List<String> toTry = new ArrayList<>();
            toTry.add(baseUrl);
            for (String c : CANDIDATE_URLS) {
                if (!c.equals(baseUrl)) toTry.add(c);
            }

            for (String candidate : toTry) {
                try {
                    String fullUrl = candidate + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
                    URL url = new URL(fullUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(2000);
                    conn.setReadTimeout(4000);
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setRequestProperty("X-Client-Platform", "Android");
                    conn.setDoOutput(true);

                    if (token != null && !token.trim().isEmpty()) {
                        conn.setRequestProperty("Authorization", "Bearer " + token);
                    }
                    if (activeBusinessId != null && !activeBusinessId.trim().isEmpty()) {
                        conn.setRequestProperty("X-Business-Id", activeBusinessId);
                    }

                    if (payload != null) {
                        byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(bytes);
                        }
                    }

                    int code = conn.getResponseCode();
                    if (code == 401 && !endpoint.contains("/auth/login")) {
                        clearAuth();
                        if (authListener != null) {
                            mainHandler.post(() -> authListener.onSessionExpired());
                        }
                    }

                    BufferedReader reader = new BufferedReader(new InputStreamReader(
                            code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                            StandardCharsets.UTF_8
                    ));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    setBaseUrl(candidate);
                    if (code >= 200 && code < 300) {
                        mainHandler.post(() -> callback.onSuccess(json));
                    } else {
                        mainHandler.post(() -> callback.onError(new Exception("HTTP " + code + ": " + json.optString("error", "Error"))));
                    }
                    return;
                } catch (Exception e) {
                    lastException = e;
                }
            }
            final Exception finalEx = lastException != null ? lastException : new Exception("Connection timeout");
            mainHandler.post(() -> callback.onError(finalEx));
        });
    }

    public void delete(String endpoint, Callback callback) {
        executor.execute(() -> {
            Exception lastException = null;
            try {
                String fullUrl = baseUrl + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
                URL url = new URL(fullUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("DELETE");
                conn.setConnectTimeout(2000);
                conn.setReadTimeout(4000);
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("X-Client-Platform", "Android");

                if (token != null && !token.trim().isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token);
                }
                if (activeBusinessId != null && !activeBusinessId.trim().isEmpty()) {
                    conn.setRequestProperty("X-Business-Id", activeBusinessId);
                }

                int code = conn.getResponseCode();
                if (code == 401) {
                    clearAuth();
                    if (authListener != null) {
                        mainHandler.post(() -> authListener.onSessionExpired());
                    }
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                ));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject json = new JSONObject(sb.toString());
                if (code >= 200 && code < 300) {
                    mainHandler.post(() -> callback.onSuccess(json));
                } else {
                    mainHandler.post(() -> callback.onError(new Exception("HTTP " + code + ": " + json.optString("error", "Error"))));
                }
            } catch (Exception e) {
                lastException = e;
                final Exception finalEx = lastException;
                mainHandler.post(() -> callback.onError(finalEx));
            }
        });
    }

    // --- Unified Identity & Session Authentication Operations ---

    public void login(String identifier, String passwordOrPin, Callback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("identifier", identifier);
            body.put("password", passwordOrPin);

            JSONObject dev = new JSONObject();
            dev.put("platform", "Android");
            dev.put("deviceName", "Android Client (Native)");
            body.put("deviceInfo", dev);

            post("/api/v1/auth/login", body, new Callback() {
                @Override
                public void onSuccess(JSONObject response) {
                    String t = response.optString("token", null);
                    if (t != null && !t.isEmpty()) {
                        setToken(t);
                    }
                    JSONObject biz = response.optJSONObject("business");
                    if (biz != null && biz.has("id")) {
                        setActiveBusinessId(biz.optString("id"));
                    }
                    if (response.has("user") && appContext != null) {
                        appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                            .edit()
                            .putString(KEY_USER_DATA, response.optJSONObject("user").toString())
                            .apply();
                    }
                    if (callback != null) callback.onSuccess(response);
                }

                @Override
                public void onError(Exception e) {
                    if (callback != null) callback.onError(e);
                }
            });
        } catch (Exception e) {
            if (callback != null) callback.onError(e);
        }
    }

    public void register(String name, String identifier, String password, String businessName, Callback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("name", name);
            body.put("identifier", identifier);
            if (identifier.contains("@")) {
                body.put("email", identifier);
            } else {
                body.put("phone", identifier);
            }
            body.put("password", password);
            if (businessName != null && !businessName.trim().isEmpty()) {
                body.put("businessName", businessName.trim());
            }

            JSONObject dev = new JSONObject();
            dev.put("platform", "Android");
            dev.put("deviceName", "Android Client (Native)");
            body.put("deviceInfo", dev);

            post("/api/v1/auth/register", body, new Callback() {
                @Override
                public void onSuccess(JSONObject response) {
                    String t = response.optString("token", null);
                    if (t != null && !t.isEmpty()) {
                        setToken(t);
                    }
                    JSONObject biz = response.optJSONObject("business");
                    if (biz != null && biz.has("id")) {
                        setActiveBusinessId(biz.optString("id"));
                    }
                    if (response.has("user") && appContext != null) {
                        appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                            .edit()
                            .putString(KEY_USER_DATA, response.optJSONObject("user").toString())
                            .apply();
                    }
                    if (callback != null) callback.onSuccess(response);
                }

                @Override
                public void onError(Exception e) {
                    if (callback != null) callback.onError(e);
                }
            });
        } catch (Exception e) {
            if (callback != null) callback.onError(e);
        }
    }

    public void logout(Callback callback) {
        post("/api/v1/auth/logout", new JSONObject(), new Callback() {
            @Override
            public void onSuccess(JSONObject response) {
                clearAuth();
                if (callback != null) callback.onSuccess(response);
            }
            @Override
            public void onError(Exception e) {
                clearAuth();
                if (callback != null) callback.onSuccess(new JSONObject());
            }
        });
    }

    public void logoutAll(Callback callback) {
        post("/api/v1/auth/logout-all", new JSONObject(), new Callback() {
            @Override
            public void onSuccess(JSONObject response) {
                clearAuth();
                if (callback != null) callback.onSuccess(response);
            }
            @Override
            public void onError(Exception e) {
                clearAuth();
                if (callback != null) callback.onError(e);
            }
        });
    }

    public void getSessions(Callback callback) {
        get("/api/v1/auth/sessions", callback);
    }

    public void revokeSession(String sessionId, Callback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("sessionId", sessionId);
            post("/api/v1/auth/sessions/revoke", body, callback);
        } catch (Exception e) {
            if (callback != null) callback.onError(e);
        }
    }

    // --- Offline Resilience Sync Queue ---

    public synchronized void addToSyncQueue(Context ctx, String endpoint, JSONObject payload) {
        if (ctx == null) return;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_SYNC_QUEUE, "[]");
            JSONArray arr = new JSONArray(raw);
            JSONObject item = new JSONObject();
            item.put("endpoint", endpoint);
            item.put("payload", payload);
            item.put("createdAt", System.currentTimeMillis());
            arr.put(item);
            prefs.edit().putString(KEY_SYNC_QUEUE, arr.toString()).apply();
        } catch (Exception ignored) {}
    }

    public synchronized int getPendingCount(Context ctx) {
        if (ctx == null) return 0;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_SYNC_QUEUE, "[]");
            return new JSONArray(raw).length();
        } catch (Exception e) {
            return 0;
        }
    }

    public void drainSyncQueue(Context ctx, SyncCallback callback) {
        if (ctx == null) {
            if (callback != null) callback.onComplete(0, 0);
            return;
        }

        executor.execute(() -> {
            SharedPreferences prefs = ctx.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_SYNC_QUEUE, "[]");
            JSONArray arr;
            try {
                arr = new JSONArray(raw);
            } catch (Exception e) {
                arr = new JSONArray();
            }

            if (arr.length() == 0) {
                if (callback != null) mainHandler.post(() -> callback.onComplete(0, 0));
                return;
            }

            JSONArray remaining = new JSONArray();
            int synced = 0;
            int failed = 0;

            for (int i = 0; i < arr.length(); i++) {
                try {
                    JSONObject item = arr.getJSONObject(i);
                    String endpoint = item.getString("endpoint");
                    JSONObject payload = item.getJSONObject("payload");

                    // Synchronous single-post on worker thread
                    boolean ok = syncSingle(endpoint, payload);
                    if (ok) {
                        synced++;
                    } else {
                        failed++;
                        remaining.put(item);
                    }
                } catch (Exception e) {
                    failed++;
                }
            }

            prefs.edit().putString(KEY_SYNC_QUEUE, remaining.toString()).apply();
            final int fSynced = synced;
            final int fFailed = failed;
            if (callback != null) {
                mainHandler.post(() -> callback.onComplete(fSynced, fFailed));
            }
        });
    }

    private boolean syncSingle(String endpoint, JSONObject payload) {
        try {
            String fullUrl = baseUrl + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
            URL url = new URL(fullUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(2500);
            conn.setReadTimeout(4000);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("X-Client-Platform", "Android");
            conn.setDoOutput(true);

            if (token != null && !token.trim().isEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }
            if (activeBusinessId != null && !activeBusinessId.trim().isEmpty()) {
                conn.setRequestProperty("X-Business-Id", activeBusinessId);
            }

            if (payload != null) {
                byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(bytes);
                }
            }

            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            return false;
        }
    }
}
