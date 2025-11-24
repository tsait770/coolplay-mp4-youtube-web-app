import Flutter
import UIKit
import AVFoundation
import MediaPlayer
import Speech

public class UniversalPlayerPlugin: NSObject, FlutterPlugin {
  private var methodChannel: FlutterMethodChannel?
  private var stateChannel: FlutterEventChannel?
  private var positionChannel: FlutterEventChannel?
  private var speechResultChannel: FlutterEventChannel?
  private var backend: AVBackend?
  private var speechManager: SpeechRecognitionManager?

  public static func register(with registrar: FlutterPluginRegistrar) {
    let instance = UniversalPlayerPlugin()
    instance.methodChannel = FlutterMethodChannel(name: "universal_player/methods", binaryMessenger: registrar.messenger())
    registrar.addMethodCallDelegate(instance, channel: instance.methodChannel!)
    instance.stateChannel = FlutterEventChannel(name: "universal_player/state", binaryMessenger: registrar.messenger())
    instance.positionChannel = FlutterEventChannel(name: "universal_player/position", binaryMessenger: registrar.messenger())
    instance.speechResultChannel = FlutterEventChannel(name: "universal_player/speech_results", binaryMessenger: registrar.messenger())
    instance.backend = AVBackend(stateChannel: instance.stateChannel!, positionChannel: instance.positionChannel!)
    instance.speechManager = SpeechRecognitionManager()
    instance.speechManager?.registerForAudioSessionNotifications()
    instance.speechResultChannel?.setStreamHandler(SpeechResultStreamHandler(assign: { sink in
        instance.speechManager?.resultUpdateHandler = { text, isFinal in
            sink?(["text": text, "final": isFinal])
        }
        instance.speechManager?.stateUpdateHandler = { state in
            // 可以根據需要發送狀態更新，例如錯誤
            if case .error(let error) = state {
                sink?(FlutterError(code: "SPEECH_ERROR", message: error.localizedDescription, details: nil))
            }
        }
    }))
  }

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "initialize": backend?.initialize(args: call.arguments); result(nil)
    case "play": backend?.play(); result(nil)
    case "pause": backend?.pause(); result(nil)
    case "stop": backend?.stop(); result(nil)
    case "seek": if let ms = call.arguments as? Int { backend?.seek(ms: ms) }; result(nil)
    case "setVolume": if let vol = call.arguments as? Double { backend?.setVolume(vol: vol) }; result(nil)
    case "setPreferredPeakBitRate": if let bps = call.arguments as? Double { backend?.setPreferredPeakBitRate(bps: bps) }; result(nil)
    case "dispose": backend?.dispose(); result(nil)
    case "startListening":
        // 檢查是否已設置 resultUpdateHandler，避免重複設置
        if speechManager?.resultUpdateHandler == nil {
            // 如果沒有設置，則使用一個空的處理器，避免 crash
            speechManager?.resultUpdateHandler = { _, _ in }
        }
        guard let args = call.arguments as? [String: Any], let continuous = args["continuous"] as? Bool else {
            result(FlutterError(code: "INVALID_ARGUMENT", message: "Missing 'continuous' argument", details: nil))
            return
        }
        speechManager?.requestPermissions { granted in
            if granted {
                self.speechManager?.startListening(continuous: continuous)
                result(nil)
            } else {
                result(FlutterError(code: "PERMISSION_DENIED", message: "Microphone or speech recognition permission denied", details: nil))
            }
        }
    case "stopListening":
        speechManager?.stopListening()
        result(nil)
    default: result(FlutterMethodNotImplemented)
    }
  }
}

class AVBackend: NSObject, FlutterStreamHandler {
  private var player: AVPlayer?
  private var timeObserver: Any?
  private var stateSink: FlutterEventSink?
  private var positionSink: FlutterEventSink?

  init(stateChannel: FlutterEventChannel, positionChannel: FlutterEventChannel) {
    super.init()
    stateChannel.setStreamHandler(self)
    positionChannel.setStreamHandler(AVPositionStreamHandler(assign: { sink in
      self.positionSink = sink
    }))
    setupRemoteCommands()
  }

  func initialize(args: Any?) {
    dispose()
    emitState(status: 1, positionMs: 0, durationMs: nil, volume: 1.0)

    guard let dict = args as? [String: Any] else { return }
    let urlString = (dict["url"] as? String) ?? ((dict["variants"] as? [[String: Any]])?.first? ["url"] as? String)
    guard let urlString = urlString, let url = URL(string: urlString) else { return }

    var asset: AVURLAsset
    if let headers = dict["headers"] as? [String: String], !headers.isEmpty {
      let options = ["AVURLAssetHTTPHeaderFieldsKey": headers]
      asset = AVURLAsset(url: url, options: options)
    } else {
      asset = AVURLAsset(url: url)
    }

    let item = AVPlayerItem(asset: asset)
    let p = AVPlayer(playerItem: item)
    player = p

    NotificationCenter.default.addObserver(self, selector: #selector(onEnded), name: .AVPlayerItemDidPlayToEndTime, object: item)

    addObservers(player: p, item: item)
    startPositionUpdates()

    // Prefer ABR defaults; allow peak bitrate hint via variants if provided later.
  }

  private func addObservers(player: AVPlayer, item: AVPlayerItem) {
    item.addObserver(self, forKeyPath: "status", options: [.new, .initial], context: nil)
    item.addObserver(self, forKeyPath: "playbackLikelyToKeepUp", options: [.new, .initial], context: nil)
  }

  override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
    guard let player = self.player, let item = player.currentItem else { return }
    switch keyPath {
    case "status":
      switch item.status {
      case .readyToPlay:
        emitState(status: player.timeControlStatus == .playing ? 3 : 2, positionMs: currentPositionMs(), durationMs: durationMs(), volume: currentVolume())
      case .failed:
        emitError(domain: "backend.avplayer", code: "E_PLAY", message: item.error?.localizedDescription)
      default: break
      }
    case "playbackLikelyToKeepUp":
      if item.isPlaybackLikelyToKeepUp {
        emitState(status: player.timeControlStatus == .playing ? 3 : 2, positionMs: currentPositionMs(), durationMs: durationMs(), volume: currentVolume())
      } else {
        emitState(status: 5, positionMs: currentPositionMs(), durationMs: durationMs(), volume: currentVolume())
      }
    default: break
    }
  }

  @objc private func onEnded() {
    emitState(status: 6, positionMs: currentPositionMs(), durationMs: durationMs(), volume: currentVolume())
  }

  func play() { player?.play(); emitState(status: 3, positionMs: currentPositionMs(), durationMs: durationMs(), volume: currentVolume()) }
  func pause() { player?.pause(); emitState(status: 4, positionMs: currentPositionMs(), durationMs: durationMs(), volume: currentVolume()) }
  func stop() { player?.pause(); player?.seek(to: .zero); emitState(status: 2, positionMs: 0, durationMs: durationMs(), volume: currentVolume()) }
  func seek(ms: Int) { let t = CMTime(milliseconds: ms); player?.seek(to: t) }
  func setVolume(vol: Double) { player?.volume = Float(vol) }

  // Optionally allow ABR peak bitrate hint
  func setPreferredPeakBitRate(bps: Double) {
    player?.currentItem?.preferredPeakBitRate = bps
  }

  func dispose() {
    stopPositionUpdates()
    NotificationCenter.default.removeObserver(self)
    if let item = player?.currentItem {
      item.removeObserver(self, forKeyPath: "status")
      item.removeObserver(self, forKeyPath: "playbackLikelyToKeepUp")
    }
    player = nil
  }

  private func setupRemoteCommands() {
    let center = MPRemoteCommandCenter.shared()
    center.playCommand.addTarget { [weak self] _ in self?.play(); return .success }
    center.pauseCommand.addTarget { [weak self] _ in self?.pause(); return .success }
    center.togglePlayPauseCommand.addTarget { [weak self] _ in
      if let player = self?.player { player.rate == 0 ? self?.play() : self?.pause() }
      return .success
    }
  }

  private func startPositionUpdates() {
    guard let player = self.player else { return }
    let interval = CMTime(milliseconds: 250)
    timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] _ in
      guard let self = self else { return }
      self.positionSink?(self.currentPositionMs())
    }
  }

  private func stopPositionUpdates() {
    if let obs = timeObserver, let player = self.player {
      player.removeTimeObserver(obs)
    }
    timeObserver = nil
  }

  private func emitState(status: Int, positionMs: Int, durationMs: Int?, volume: Double) {
    stateSink?(["status": status, "isLive": false, "positionMs": positionMs, "durationMs": durationMs as Any?, "volume": volume])
  }

  private func emitError(domain: String, code: String, message: String?) {
    stateSink?(["status": 7, "isLive": false, "positionMs": currentPositionMs(), "durationMs": durationMs() as Any?, "volume": currentVolume(), "errorDomain": domain, "errorCode": code, "errorMessage": message ?? ""]) 
  }

  private func currentPositionMs() -> Int { Int(CMTimeGetSeconds(player?.currentTime() ?? .zero) * 1000.0) }
  private func durationMs() -> Int? {
    guard let d = player?.currentItem?.duration, d.isNumeric && d.seconds.isFinite && d.seconds > 0 else { return nil }
    return Int(d.seconds * 1000.0)
  }
  private func currentVolume() -> Double { Double(player?.volume ?? 1.0) }

  // FlutterStreamHandler for state channel
  public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? { stateSink = events; return nil }
  public func onCancel(withArguments arguments: Any?) -> FlutterError? { stateSink = nil; return nil }
}

// Separate handler to route position events sink
class AVPositionStreamHandler: NSObject, FlutterStreamHandler {
  private let assign: (FlutterEventSink?) -> Void
  init(assign: @escaping (FlutterEventSink?) -> Void) { self.assign = assign }
  func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? { assign(events); return nil }
  func onCancel(withArguments arguments: Any?) -> FlutterError? { assign(nil); return nil }
}

extension CMTime {
  init(milliseconds: Int) { self = CMTime(value: CMTimeValue(milliseconds), timescale: 1000) }
}

// Separate handler to route speech result events sink
class SpeechResultStreamHandler: NSObject, FlutterStreamHandler {
  private let assign: (FlutterEventSink?) -> Void
  init(assign: @escaping (FlutterEventSink?) -> Void) { self.assign = assign }
  func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? { assign(events); return nil }
  func onCancel(withArguments arguments: Any?) -> FlutterError? { assign(nil); return nil }
}
