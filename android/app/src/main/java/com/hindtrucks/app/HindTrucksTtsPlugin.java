package com.hindtrucks.app;

import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.json.JSONException;

@CapacitorPlugin(name = "HindTrucksTts")
public class HindTrucksTtsPlugin extends Plugin {

    private static final Set<String> CONFIGURED_LANGUAGES = new LinkedHashSet<>(
        Arrays.asList("en", "bn", "hi", "pa", "te", "ta", "mr", "gu", "kn", "ml", "or", "as")
    );
    private final List<Runnable> pendingEngineActions = new ArrayList<>();
    private TextToSpeech tts;
    private boolean engineInitializing = false;
    private boolean engineReady = false;
    private String engineError = null;

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String lang = normalizeLanguage(call.getString("lang", "en"));

        if (text == null || text.trim().isEmpty()) {
            JSObject result = new JSObject();
            result.put("status", "empty");
            result.put("lang", lang);
            call.resolve(result);
            return;
        }

        if (!CONFIGURED_LANGUAGES.contains(lang)) {
            JSObject result = new JSObject();
            result.put("status", "missing-language");
            result.put("lang", lang);
            result.put("reason", "Unsupported HindTrucks language code");
            call.resolve(result);
            return;
        }

        runWhenEngineReady(call, () -> speakWithEngine(call, text.trim(), lang));
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) {
            tts.stop();
        }
        call.resolve();
    }

    @PluginMethod
    public void isLanguageAvailable(PluginCall call) {
        String lang = normalizeLanguage(call.getString("lang", "en"));
        if (!CONFIGURED_LANGUAGES.contains(lang)) {
            JSObject result = new JSObject();
            result.put("available", false);
            result.put("lang", lang);
            result.put("reason", "Unsupported HindTrucks language code");
            call.resolve(result);
            return;
        }

        runWhenEngineReady(call, () -> {
            JSObject result = new JSObject();
            result.put("available", isLocaleAvailable(toLocale(lang)));
            result.put("lang", lang);
            result.put("engine", "android-text-to-speech");
            call.resolve(result);
        });
    }

    @PluginMethod
    public void getAvailableLanguages(PluginCall call) {
        runWhenEngineReady(call, () -> {
            List<String> available = new ArrayList<>();
            for (String lang : CONFIGURED_LANGUAGES) {
                if (isLocaleAvailable(toLocale(lang))) {
                    available.add(lang);
                }
            }

            try {
                JSObject result = new JSObject();
                result.put("languages", new JSArray(available.toArray()));
                result.put("configuredLanguages", new JSArray(CONFIGURED_LANGUAGES.toArray()));
                result.put("engine", "android-text-to-speech");
                result.put("ready", engineReady);
                call.resolve(result);
            } catch (JSONException ex) {
                call.reject("Unable to read TTS languages", "TTS_LANGUAGES_ERROR", ex);
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }

    private void runWhenEngineReady(PluginCall call, Runnable action) {
        if (engineReady && tts != null) {
            action.run();
            return;
        }

        if (engineError != null) {
            JSObject result = new JSObject();
            result.put("status", "failed");
            result.put("reason", engineError);
            call.resolve(result);
            return;
        }

        pendingEngineActions.add(action);
        if (engineInitializing) {
            return;
        }

        engineInitializing = true;
        tts = new TextToSpeech(getContext(), status -> {
            engineInitializing = false;
            if (status == TextToSpeech.SUCCESS) {
                engineReady = true;
            } else {
                engineError = "Android TextToSpeech engine failed to initialize";
            }

            List<Runnable> actions = new ArrayList<>(pendingEngineActions);
            pendingEngineActions.clear();
            for (Runnable pendingAction : actions) {
                pendingAction.run();
            }
        });
    }

    private void speakWithEngine(PluginCall call, String text, String lang) {
        if (engineError != null || tts == null) {
            JSObject result = new JSObject();
            result.put("status", "failed");
            result.put("lang", lang);
            result.put("reason", engineError != null ? engineError : "Android TextToSpeech engine is unavailable");
            call.resolve(result);
            return;
        }

        Locale locale = toLocale(lang);
        if (!isLocaleAvailable(locale)) {
            JSObject result = new JSObject();
            result.put("status", "missing-language");
            result.put("lang", lang);
            result.put("reason", "This device cannot speak the selected app language");
            call.resolve(result);
            return;
        }

        int languageResult = tts.setLanguage(locale);
        if (languageResult == TextToSpeech.LANG_MISSING_DATA || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            JSObject result = new JSObject();
            result.put("status", "missing-language");
            result.put("lang", lang);
            result.put("reason", "This device cannot speak the selected app language");
            call.resolve(result);
            return;
        }

        tts.setSpeechRate(0.9f);
        int speakResult = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "hindtrucks-chatbot-" + System.currentTimeMillis());

        JSObject result = new JSObject();
        result.put("status", speakResult == TextToSpeech.SUCCESS ? "spoken" : "failed");
        result.put("lang", lang);
        result.put("engine", "android-text-to-speech");
        if (speakResult != TextToSpeech.SUCCESS) {
            result.put("reason", "Android TextToSpeech failed to queue speech");
        }
        call.resolve(result);
    }

    private boolean isLocaleAvailable(Locale locale) {
        if (tts == null) {
            return false;
        }

        int result = tts.isLanguageAvailable(locale);
        return result == TextToSpeech.LANG_AVAILABLE
            || result == TextToSpeech.LANG_COUNTRY_AVAILABLE
            || result == TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE;
    }

    private Locale toLocale(String lang) {
        switch (lang) {
            case "en":
                return new Locale("en", "IN");
            case "bn":
                return new Locale("bn", "IN");
            case "hi":
                return new Locale("hi", "IN");
            case "pa":
                return new Locale("pa", "IN");
            case "te":
                return new Locale("te", "IN");
            case "ta":
                return new Locale("ta", "IN");
            case "mr":
                return new Locale("mr", "IN");
            case "gu":
                return new Locale("gu", "IN");
            case "kn":
                return new Locale("kn", "IN");
            case "ml":
                return new Locale("ml", "IN");
            case "or":
                return new Locale("or", "IN");
            case "as":
                return new Locale("as", "IN");
            default:
                return new Locale("en", "IN");
        }
    }

    private String normalizeLanguage(String lang) {
        if (lang == null || lang.trim().isEmpty()) {
            return "en";
        }
        return lang.toLowerCase().replace('_', '-').split("-")[0];
    }
}
