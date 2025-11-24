import Foundation
import React

@objc(VoiceNative)
class VoiceNative: RCTEventEmitter {
  private let manager = VoiceManager()

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onInterim", "onFinal", "onError"]
  }

  @objc
  func startListening() {
    do {
      try manager.setupAudioSession()
      try manager.startListening(emitter: { text in
        self.sendEvent(withName: "onFinal", body: ["text": text, "confidence": 0.85])
      })
    } catch {
      self.sendEvent(withName: "onError", body: ["code": "audio-error", "message": "failed to start"])
    }
  }

  @objc
  func stopListening() {
    manager.stopListening()
  }
}

