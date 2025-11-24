import AVFoundation
import Speech

class VoiceManager: NSObject {
  let audioEngine = AVAudioEngine()
  let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-TW"))
  var recognitionTask: SFSpeechRecognitionTask?

  func setupAudioSession() throws {
    let audioSession = AVAudioSession.sharedInstance()
    audioSession.requestRecordPermission { granted in
      if !granted {
        self.logEvent(event: "microphone_permission_denied")
      }
    }
    try audioSession.setCategory(.playAndRecord, mode: .spokenAudio, options: [.mixWithOthers, .allowBluetooth, .defaultToSpeaker])
    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    logEvent(event: "audioSession_initialized")
  }

  func startListening(emitter: ((String) -> Void)?) throws {
    audioEngine.stop()
    audioEngine.reset()

    SFSpeechRecognizer.requestAuthorization { authStatus in
      switch authStatus {
      case .authorized:
        self.logEvent(event: "speech_authorized")
      case .denied:
        self.logEvent(event: "speech_denied")
      case .restricted:
        self.logEvent(event: "speech_restricted")
      case .notDetermined:
        self.logEvent(event: "speech_not_determined")
      @unknown default:
        break
      }
    }

    let inputNode = audioEngine.inputNode
    let audioFormat = inputNode.outputFormat(forBus: 0)
    inputNode.removeTap(onBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: audioFormat) { buffer, _ in }

    audioEngine.prepare()
    try audioEngine.start()
    logEvent(event: "audioEngine_started")

    let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    recognitionRequest.shouldReportPartialResults = true

    self.recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
      if let result = result {
        let transcript = result.bestTranscription.formattedString
        if result.isFinal {
          self.logEvent(event: "final_result", detail: transcript)
          emitter?(transcript)
        } else {
          self.logEvent(event: "partial_result", detail: transcript)
        }
      }
      if let error = error {
        self.logEvent(event: "recognition_error", detail: error.localizedDescription)
      }
    }
    logEvent(event: "recognitionTask_started")
  }

  func stopListening() {
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionTask?.cancel()
    recognitionTask = nil
    logEvent(event: "listening_stopped")
  }

  private func logEvent(event: String, detail: String = "") {
    let log: [String: Any] = [
      "ts": ISO8601DateFormatter().string(from: Date()),
      "level": "info",
      "platform": "iOS",
      "module": "VoiceManager",
      "event": event,
      "detail": detail
    ]
    if let data = try? JSONSerialization.data(withJSONObject: log), let str = String(data: data, encoding: .utf8) {
      NSLog(str)
    }
  }
}

