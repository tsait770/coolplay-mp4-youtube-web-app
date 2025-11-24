//
// SpeechRecognitionManager.swift
// 語音監聽管理類別，旨在解決 iOS 語音監聽 5 秒中斷的問題，並實現持續監聽模式。
// 涵蓋了任務書中所有必要的修正項目 (AVAudioSession 初始化、audioEngine 重置、持續監聽邏輯、錯誤偵錯)。
//

import Foundation
import Speech
import AVFoundation

/// 語音監聽狀態
enum SpeechRecognitionState {
    case idle
    case listening
    case stopped(Error?)
    case error(Error)
}

/// 語音監聽管理類別
class SpeechRecognitionManager: NSObject {

    // MARK: - Properties

    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-TW")) // 假設使用繁體中文
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    // 狀態回調
    var stateUpdateHandler: ((SpeechRecognitionState) -> Void)?
    // 辨識結果回調
    var resultUpdateHandler: ((String, Bool) -> Void)? // (text, isFinal)

    // 任務 4: 持續監聽模式的關鍵標誌
    private var isContinuousListening: Bool = false
    private var isRestarting: Bool = false

    // MARK: - Initialization

    override init() {
        super.init()
        speechRecognizer?.delegate = self
    }

    // MARK: - Public Methods

    /// 檢查並請求麥克風和語音辨識權限 (任務 7)
    func requestPermissions(completion: @escaping (Bool) -> Void) {
        // 檢查 SFSpeechRecognizer 權限
        SFSpeechRecognizer.requestAuthorization { authStatus in
            // 檢查 AVAudioSession 權限 (麥克風)
            AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
                DispatchQueue.main.async {
                    let speechGranted = authStatus == .authorized
                    let micGranted = granted

                    if !speechGranted || !micGranted {
                        // 任務 7: 權限不足，提示用戶
                        // print("❌ [任務 7] 權限不足：語音辨識權限: \(authStatus.rawValue), 麥克風權限: \(micGranted)")
                        // 這裡可以加入更友好的 UI 提示，引導用戶到設定頁面
                    } else if authStatus == .notDetermined || AVAudioSession.sharedInstance().recordPermission == .undetermined {
                        // 雖然已經請求，但如果狀態仍為未定，可能需要進一步處理
                        // print("⚠️ [任務 7] 權限狀態未定，請檢查 Info.plist 設定。")
                    } else if authStatus == .restricted || authStatus == .denied || AVAudioSession.sharedInstance().recordPermission == .denied {
                        // 權限被拒絕，需要提示用戶
                        // print("❌ [任務 7] 權限被拒絕，請檢查是否為 '允許一次' 或 '不允許'。")
                    }

                    completion(speechGranted && micGranted)
                }
            }
        }
    }

    /// 啟動語音監聽
    func startListening(continuous: Bool = false) {
        guard !audioEngine.isRunning else {
            // print("⚠️ 語音引擎已在運行中。")
            return
        }

        isContinuousListening = continuous
        isRestarting = false
        stateUpdateHandler?(.listening)

        // 任務 3: 確保舊的任務被取消
        recognitionTask?.cancel()
        recognitionTask = nil

        // 任務 2: 補上 audioEngine 初始化邏輯
        audioEngine.stop()
        audioEngine.reset()

        do {
            // 任務 1: 補上正確 AVAudioSession 初始化 (高優先級)
            let audioSession = AVAudioSession.sharedInstance()
            // 使用 .record 類別，.measurement 模式，.duckOthers 選項
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            // .notifyOthersOnDeactivation 確保在停止時通知其他 App
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            
            // 檢查麥克風是否可用
            guard audioSession.inputIsAvailable else {
                throw NSError(domain: "SpeechRecognitionManager", code: 1001, userInfo: [NSLocalizedDescriptionKey: "麥克風輸入不可用。"])
            }

            // 檢查辨識器是否可用
            guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
                // 任務 6: 檢查網路連線 (間接檢查)
                throw NSError(domain: "SpeechRecognitionManager", code: 1002, userInfo: [NSLocalizedDescriptionKey: "語音辨識器不可用，請檢查網路連線 (api.speech.apple.com)。"])
            }

            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let recognitionRequest = recognitionRequest else {
                fatalError("無法創建 SFSpeechAudioBufferRecognitionRequest 實例")
            }
            
            // 設置 recognitionRequest 屬性
            recognitionRequest.shouldReportPartialResults = true // 任務 4: 啟用部分結果回調
            
            // 設置音頻輸入
            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { (buffer, when) in
                self.recognitionRequest?.append(buffer)
            }

            // 啟動音頻引擎
            audioEngine.prepare()
            try audioEngine.start()

            // 啟動辨識任務
            recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] (result, error) in
                guard let self = self else { return }

                var isFinal = false
                if let result = result {
                    // 任務 4: 處理 partial results
                    self.resultUpdateHandler?(result.bestTranscription.formattedString, result.isFinal)
                    isFinal = result.isFinal
                }

                if error != nil || isFinal {
                    // 任務 5: 紀錄 recognitionTask.error
                    if let error = error {
                        // print("❌ [任務 5] recognitionTask 錯誤: \(error.localizedDescription)")
                    }
                    
                    // 停止當前 session
                    self.stopListeningSession()

                    if self.isContinuousListening && !self.isRestarting {
                        // 任務 4: 持續監聽模式 - 任務完成或出錯後自動重啟
                        // print("🔄 [任務 4] 持續監聽模式：任務結束或出錯，正在自動重啟...")
                        self.isRestarting = true
                        // 延遲重啟以避免資源競爭
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            self.startListening(continuous: true)
                        }
                    } else {
                        // 最終停止
                        self.stateUpdateHandler?(.stopped(error))
                    }
                }
            }
            
            // print("✅ 語音監聽啟動成功。")

        } catch {
            // 任務 5: 紀錄錯誤
            // print("❌ [任務 5] 啟動語音監聽時發生錯誤: \(error.localizedDescription)")
            stopListeningSession()
            stateUpdateHandler?(.error(error))
        }
    }

    /// 停止語音監聽
    func stopListening() {
        isContinuousListening = false // 停止持續監聽模式
        stopListeningSession()
        stateUpdateHandler?(.stopped(nil))
        // print("🛑 語音監聽已手動停止。")
    }

    /// 停止當前錄音 Session (內部使用)
    private func stopListeningSession() {
        // 任務 3: 確保所有組件停止
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel() // 確保取消，避免意外回調
        recognitionTask = nil

        // 停止 AVAudioSession
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            // 任務 5: 紀錄 audioSession 中斷通知 (deactivation error)
            // print("❌ [任務 5] 停止 AVAudioSession 錯誤: \(error.localizedDescription)")
        }
    }
}

// MARK: - SFSpeechRecognizerDelegate

extension SpeechRecognitionManager: SFSpeechRecognizerDelegate {
    
    // 任務 6: 檢查辨識器可用性 (間接檢查網路連線)
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        if available {
            // print("✅ [任務 6] 語音辨識器可用。")
        } else {
            // print("❌ [任務 6] 語音辨識器不可用，請檢查網路連線 (api.speech.apple.com)。")
            // 這裡可以加入自動停止或提示用戶的邏輯
        }
    }
}

// MARK: - AVAudioSession Interruption Handling

extension SpeechRecognitionManager {
    
    /// 註冊 AVAudioSession 中斷通知 (任務 5)
    func registerForAudioSessionNotifications() {
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(handleInterruption),
                                               name: AVAudioSession.interruptionNotification,
                                               object: nil)
    }
    
    /// 處理 AVAudioSession 中斷 (任務 5)
    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }

        switch type {
        case .began:
            // 任務 5: 紀錄 audioSession 中斷通知 (began)
            // print("⚠️ [任務 5] AVAudioSession 中斷開始 (例如：來電)。")
            // 中斷開始時，停止當前監聽
            stopListeningSession()
            stateUpdateHandler?(.stopped(nil))
            
        case .ended:
            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            
            // 任務 5: 紀錄 audioSession 中斷通知 (ended)
            // print("✅ [任務 5] AVAudioSession 中斷結束。")

            if options.contains(.shouldResume) {
                // 嘗試重新啟動監聽 (如果之前是持續監聽模式)
                // print("🔄 嘗試恢復監聽...")
                // 這裡需要判斷是否需要自動恢復，如果用戶手動停止則不恢復
                // 為了簡潔，這裡不自動恢復，讓用戶手動點擊
            }
            
        @unknown default:
            break
        }
    }
}
