package com.coolplay.voicecontrol

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class VoiceModuleAndroid(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), RecognitionListener {

    // Constants for event names
    private val EVENT_RESULT = "onSpeechResult"
    private val EVENT_ERROR = "onSpeechError"
    private val EVENT_STATUS = "onSpeechStatus"

    // Helper function to send events to JavaScript
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Helper function to send simple status events
    private fun sendStatusEvent(status: String) {
        val map: WritableMap = Arguments.createMap()
        map.putString("status", status)
        sendEvent(EVENT_STATUS, map)
    }

    // Helper function to send error events
    private fun sendErrorEvent(code: String, message: String) {
        val map: WritableMap = Arguments.createMap()
        map.putString("code", code)
        map.putString("message", message)
        sendEvent(EVENT_ERROR, map)
    }

    private val TAG = "VoiceModuleAndroid"
    private var speechRecognizer: SpeechRecognizer? = null
    private var recognizerIntent: Intent? = null

    override fun getName(): String {
        return "VoiceModuleAndroid"
    }

    @ReactMethod
    fun startListening(localeIdentifier: String) {
        if (speechRecognizer == null) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
            speechRecognizer?.setRecognitionListener(this)
        }

        recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeIdentifier)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactApplicationContext.packageName)
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true) // Prefer offline recognition if available
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true) // Get partial results
        }

        reactApplicationContext.currentActivity?.runOnUiThread {
            speechRecognizer?.startListening(recognizerIntent)
            sendStatusEvent("LISTENING_STARTED")
            Log.d(TAG, "Starting listening for locale: $localeIdentifier")
        }
    }

    @ReactMethod
    fun stopListening() {
        reactApplicationContext.currentActivity?.runOnUiThread {
            speechRecognizer?.stopListening()
            sendStatusEvent("LISTENING_STOPPED")
            Log.d(TAG, "Stopping listening")
        }
    }

    // RecognitionListener implementation
    override fun onReadyForSpeech(params: Bundle?) {
        sendStatusEvent("READY_FOR_SPEECH")
    }

    override fun onBeginningOfSpeech() {
        sendStatusEvent("BEGINNING_OF_SPEECH")
    }

    override fun onRmsChanged(rmsdB: Float) {}

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        sendStatusEvent("END_OF_SPEECH")
        // Auto-restart logic should be here or in onError for continuous listening
    }

    override fun onError(error: Int) {
        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No recognition result matched"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service is busy"
            SpeechRecognizer.ERROR_SERVER -> "Server side error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
            else -> "Unknown error: $error"
        }
        
        sendErrorEvent("ERROR_$error", errorMessage)
        Log.e(TAG, "Speech recognition error: $error - $errorMessage")
        
        // TODO: Implement auto-restart loop here based on error type (e.g., ERROR_SPEECH_TIMEOUT, ERROR_NO_MATCH)
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val confidenceScores = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)

        if (!matches.isNullOrEmpty()) {
            val resultText = matches[0]
            val confidence = confidenceScores?.get(0) ?: 0.0f
            
            val map: WritableMap = Arguments.createMap()
            map.putString("text", resultText)
            map.putDouble("confidence", confidence.toDouble())
            map.putBoolean("isFinal", true)
            
            sendEvent(EVENT_RESULT, map)
            Log.d(TAG, "Final Result: $resultText, Confidence: $confidence")
        }
        // TODO: Implement auto-restart loop here
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val resultText = matches[0]
            
            val map: WritableMap = Arguments.createMap()
            map.putString("text", resultText)
            map.putDouble("confidence", 0.0) // Partial results often don't have reliable confidence
            map.putBoolean("isFinal", false)
            
            sendEvent(EVENT_RESULT, map)
            Log.d(TAG, "Partial Result: $resultText")
        }
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}