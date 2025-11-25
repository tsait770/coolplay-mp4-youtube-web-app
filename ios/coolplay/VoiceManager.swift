import AVFoundation
import Speech

// 錯誤碼定義
enum VoiceManagerError: Error {
    case microphonePermissionDenied
    case speechRecognitionPermissionDenied
    case audioSessionActivationFailed(String)
    case audioEngineStartFailed(String)
}

// 狀態定義
enum ListeningState {
    case idle
    case requestingPermissions
    case initializing
    case listening
    case interrupted
    case failed(String)
}

class VoiceManager: NSObject {
    // MARK: - Properties
    let audioEngine = AVAudioEngine()
    // 預設使用 zh-TW，但應從 RN 傳入
    let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-TW"))
    var recognitionTask: SFSpeechRecognitionTask?
    var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    
    // 狀態追蹤
    private var currentState: ListeningState = .idle
    private var isContinuousListening: Bool = false
    private var finalEmitter: ((String) -> Void)?
    private var interimEmitter: ((String) -> Void)?
    private var errorEmitter: ((String, String) -> Void)?
    private var statusEmitter: ((String) -> Void)?
    
    // 健康檢查相關
    private var healthCheckTimer: Timer?
    private let maxRestartAttempts = 3
    private var restartAttempts = 0
    
    // MARK: - Initialization & Setup
    
    override init() {
        super.init()
        // 註冊中斷和路由變更通知
        NotificationCenter.default.addObserver(self, selector: #selector(handleInterruption), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleRouteChange), name: AVAudioSession.routeChangeNotification, object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        stopHealthCheckTimer()
    }
    
    // MARK: - Public API (Called from RN Bridge)
    
    func startContinuousListening(finalEmitter: ((String) -> Void)?, interimEmitter: ((String) -> Void)?, errorEmitter: ((String, String) -> Void)?, statusEmitter: ((String) -> Void)?) {
        self.finalEmitter = finalEmitter
        self.interimEmitter = interimEmitter
        self.errorEmitter = errorEmitter
        self.statusEmitter = statusEmitter
        self.isContinuousListening = true
        self.restartAttempts = 0
        
        logEvent(event: "start_continuous_listening_requested")
        
        // 確保先停止，再開始
        stopListening(shouldDeactivateSession: false)
        
        // 啟動初始化流程
        Task {
            await initializeAndStartRecognition()
        }
    }
    
    func stopListening(shouldDeactivateSession: Bool = true) {
        logEvent(event: "stop_listening_requested", detail: "Deactivate Session: \(shouldDeactivateSession)")
        
        stopHealthCheckTimer()
        
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
            logEvent(event: "audioEngine_stopped")
        }
        
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        
        if shouldDeactivateSession {
            do {
                try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
                logEvent(event: "audioSession_deactivated")
            } catch {
                logEvent(event: "audioSession_deactivation_failed", detail: error.localizedDescription)
            }
        }
        
        updateState(.idle)
    }
    
    // MARK: - Core Logic
    
    private func initializeAndStartRecognition() async {
        updateState(.requestingPermissions)
        
        do {
            // Step 1: 請求麥克風權限
            let micGranted = await requestMicrophonePermission()
            if !micGranted {
                throw VoiceManagerError.microphonePermissionDenied
            }
            
            // Step 2: 請求語音辨識權限
            let speechStatus = await requestSpeechRecognitionPermission()
            if speechStatus != .authorized {
                throw VoiceManagerError.speechRecognitionPermissionDenied
            }
            
            // Step 3: 設定並啟用 AVAudioSession
            try setupAndActivateAudioSession()
            
            // Step 4: 啟動語音辨識
            try startRecognition()
            
            // Step 5: 啟動健康檢查
            startHealthCheckTimer()
            
            updateState(.listening)
            
        } catch let error as VoiceManagerError {
            handleError(error)
        } catch {
            handleError(VoiceManagerError.audioEngineStartFailed(error.localizedDescription))
        }
    }
    
    // MARK: - Permission Handling
    
    private func requestMicrophonePermission() async -> Bool {
        return await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                self.logEvent(event: "microphone_permission_result", detail: granted ? "granted" : "denied")
                continuation.resume(returning: granted)
            }
        }
    }
    
    private func requestSpeechRecognitionPermission() async -> SFSpeechRecognizerAuthorizationStatus {
        return await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { authStatus in
                self.logEvent(event: "speech_permission_result", detail: "\(authStatus.rawValue)")
                continuation.resume(returning: authStatus)
            }
        }
    }
    
    // MARK: - AVAudioSession Setup (Issue #2)
    
    private func setupAndActivateAudioSession() throws {
        updateState(.initializing)
        let audioSession = AVAudioSession.sharedInstance()
        
        // 修正 setCategory 和 setMode (使用 .measurement 或 .voiceChat)
        // 使用 .measurement 模式，適合長時間的音訊輸入處理
        try audioSession.setCategory(.playAndRecord, mode: .measurement, options: [.mixWithOthers, .allowBluetooth, .defaultToSpeaker])
        logEvent(event: "audioSession_category_set", detail: "Category: playAndRecord, Mode: measurement")
        
        // 啟用 Session
        do {
            // 使用 .notifyOthersOnDeactivation 確保系統知道我們何時釋放
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            logEvent(event: "audioSession_activated")
        } catch {
            throw VoiceManagerError.audioSessionActivationFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Recognition Start
    
    private func startRecognition() throws {
        if let recognitionTask = recognitionTask {
            recognitionTask.cancel()
            self.recognitionTask = nil
        }
        
        let inputNode = audioEngine.inputNode
        let audioFormat = inputNode.outputFormat(forBus: 0)
        
        // 移除舊的 Tap
        inputNode.removeTap(onBus: 0)
        
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        // 關鍵：設置為 false，防止 SFSpeechRecognizer 在偵測到長時間靜音時自動停止
        // 雖然 SFSpeechRecognizer 仍然有內建的超時機制，但這能最大程度延長
        // 真正的持續監聽需要依賴外部的健康檢查和重啟機制
        request.requiresOnDeviceRecognition = false // 允許使用伺服器端辨識，可能更穩定
        self.recognitionRequest = request
        
        // 重新安裝 Tap
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: audioFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        logEvent(event: "audioEngine_started")
        
        self.recognitionTask = speechRecognizer?.recognitionTask(with: request) { result, error in
            if let result = result {
                let transcript = result.bestTranscription.formattedString
                if result.isFinal {
                    self.logEvent(event: "final_result", detail: transcript)
                    self.finalEmitter?(transcript)
                    
                    // 關鍵：如果任務結束，且我們處於連續監聽模式，則嘗試重啟
                    if self.isContinuousListening {
                        self.logEvent(event: "recognition_task_finished_restarting")
                        Task {
                            try await Task.sleep(nanoseconds: 500_000_000) // 0.5s 延遲重啟
                            try self.startRecognition()
                        }
                    } else {
                        self.stopListening()
                    }
                } else {
                    self.logEvent(event: "partial_result", detail: transcript)
                    self.interimEmitter?(transcript)
                }
            }
            
            if let error = error {
                self.logEvent(event: "recognition_error", detail: error.localizedDescription)
                self.errorEmitter?("recognition_error", error.localizedDescription)
                
                // 錯誤發生，如果處於連續監聽模式，嘗試重啟
                if self.isContinuousListening {
                    self.logEvent(event: "recognition_task_error_restarting")
                    Task {
                        try await Task.sleep(nanoseconds: 1_000_000_000) // 1s 延遲重啟
                        try self.startRecognition()
                    }
                } else {
                    self.stopListening()
                }
            }
        }
        logEvent(event: "recognitionTask_started")
    }
    
    // MARK: - Interruption Handling (Issue #5)
    
    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }
        
        switch type {
        case .began:
            logEvent(event: "audioSession_interruption_began")
            updateState(.interrupted)
            // 中斷開始，停止錄音，但不釋放 Session
            if audioEngine.isRunning {
                audioEngine.stop()
                audioEngine.inputNode.removeTap(onBus: 0)
            }
            recognitionTask?.cancel()
            recognitionTask = nil
            stopHealthCheckTimer()
            
        case .ended:
            logEvent(event: "audioSession_interruption_ended")
            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            
            if options.contains(.shouldResume) {
                logEvent(event: "audioSession_should_resume", detail: "Attempting to re-activate and restart listening")
                
                // 嘗試重新啟用 Session
                do {
                    try AVAudioSession.sharedInstance().setActive(true)
                    logEvent(event: "audioSession_re_activated")
                    
                    // 重新啟動語音辨識
                    if isContinuousListening {
                        Task {
                            try await Task.sleep(nanoseconds: 500_000_000) // 0.5s 延遲重啟
                            try startRecognition()
                            startHealthCheckTimer()
                            updateState(.listening)
                        }
                    }
                } catch {
                    logEvent(event: "audioSession_re_activation_failed", detail: error.localizedDescription)
                    errorEmitter?("interruption_resume_failed", error.localizedDescription)
                    stopListening()
                }
            } else {
                logEvent(event: "audioSession_no_resume_option", detail: "Stopping listening")
                stopListening()
            }
        @unknown default:
            break
        }
    }
    
    @objc private func handleRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        logEvent(event: "audioSession_route_change", detail: "Reason: \(reason.rawValue)")
        
        // 路由變更可能導致錄音中斷，特別是從耳機切換到內建麥克風等
        // 簡單處理：如果正在監聽，則停止並重新啟動
        if currentState == .listening {
            logEvent(event: "route_change_restarting_listening")
            stopListening(shouldDeactivateSession: false)
            Task {
                try await Task.sleep(nanoseconds: 1_000_000_000) // 1s 延遲重啟
                await initializeAndStartRecognition()
            }
        }
    }
    
    // MARK: - Health Check (Issue #4)
    
    private func startHealthCheckTimer() {
        stopHealthCheckTimer()
        // 任務書要求每 10s 檢查
        healthCheckTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            self?.performHealthCheck()
        }
        logEvent(event: "health_check_timer_started")
    }
    
    private func stopHealthCheckTimer() {
        healthCheckTimer?.invalidate()
        healthCheckTimer = nil
        logEvent(event: "health_check_timer_stopped")
    }
    
    private func performHealthCheck() {
        guard isContinuousListening else {
            stopHealthCheckTimer()
            return
        }
        
        let sessionActive = AVAudioSession.sharedInstance().isInputAvailable
        let engineRunning = audioEngine.isRunning
        
        logEvent(event: "health_check", detail: "Session Active: \(sessionActive), Engine Running: \(engineRunning), State: \(currentState)")
        
        // 檢查 Session 和 Engine 是否都處於非活動狀態
        if !sessionActive || !engineRunning || currentState != .listening {
            logEvent(event: "health_check_failed", detail: "Attempting restart. Attempts: \(restartAttempts)/\(maxRestartAttempts)")
            
            if restartAttempts < maxRestartAttempts {
                restartAttempts += 1
                stopListening(shouldDeactivateSession: false)
                Task {
                    try await Task.sleep(nanoseconds: 500_000_000) // 0.5s 延遲重啟
                    await initializeAndStartRecognition()
                }
            } else {
                logEvent(event: "health_check_max_attempts_reached", detail: "Stopping continuous listening.")
                errorEmitter?("max_restart_attempts", "Continuous listening failed to maintain active state after \(maxRestartAttempts) attempts.")
                stopListening()
            }
        } else {
            // 健康，重置嘗試次數
            restartAttempts = 0
        }
    }
    
    // MARK: - State & Error Handling
    
    private func updateState(_ newState: ListeningState) {
        self.currentState = newState
        logEvent(event: "state_changed", detail: "\(newState)")
        statusEmitter?("\(newState)")
    }
    
    private func handleError(_ error: VoiceManagerError) {
        logEvent(event: "fatal_error", detail: "\(error)")
        
        let (code, message) = {
            switch error {
            case .microphonePermissionDenied:
                return ("mic_denied", "Microphone permission denied.")
            case .speechRecognitionPermissionDenied:
                return ("speech_denied", "Speech recognition permission denied.")
            case .audioSessionActivationFailed(let msg):
                return ("session_activation_failed", msg)
            case .audioEngineStartFailed(let msg):
                return ("engine_start_failed", msg)
            }
        }()
        
        errorEmitter?(code, message)
        updateState(.failed(message))
        stopListening()
    }
    
    // MARK: - Logging (Issue #6)
    
    private func logEvent(event: String, detail: String = "") {
        let log: [String: Any] = [
            "ts": ISO8601DateFormatter().string(from: Date()),
            "level": "info",
            "platform": "iOS",
            "module": "VoiceManager",
            "event": event,
            "detail": detail,
            "state": "\(currentState)",
            "isContinuous": isContinuousListening
        ]
        if let data = try? JSONSerialization.data(withJSONObject: log), let str = String(data: data, encoding: .utf8) {
            // 使用 NSLog 輸出結構化日誌
            NSLog("VOICE_LOG: \(str)")
        }
    }
}
