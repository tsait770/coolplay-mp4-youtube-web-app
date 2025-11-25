import { NativeEventEmitter, NativeModules, Platform } from 'react-native'

const Native = (NativeModules as any).VoiceNative
const emitter = Native ? new NativeEventEmitter(Native) : null

export function isNativeAvailable(): boolean {
  return Platform.OS !== 'web' && !!Native
}

// 更新 startContinuousListen 以符合 Swift 端的 startContinuousListening 函數
export function startContinuousListen(): void {
  if (!Native) return
  // Swift 端的 startContinuousListening 函數現在會處理所有的初始化和權限請求
  // RN 端只需要呼叫它
  Native.startContinuousListening()
}

// 保持 stopContinuousListen 不變
export function stopContinuousListen(): void {
  if (!Native) return
  // Swift 端的 stopListening 預設會 de-activate session
  Native.stopListening()
}

export function onInterim(callback: (text: string) => void) {
  if (!emitter) return { remove: () => {} }
  return emitter.addListener('onInterim', (data: { text: string }) => {
    if (data && typeof data.text === 'string') callback(data.text)
  })
}

export function onFinal(callback: (text: string, confidence?: number) => void) {
  if (!emitter) return { remove: () => {} }
  return emitter.addListener('onFinal', (data: { text: string; confidence?: number }) => {
    const c = typeof data?.confidence === 'number' ? data.confidence : 0.85
    if (data && typeof data.text === 'string') callback(data.text, c)
  })
}

export function onError(callback: (code: string, message: string) => void) {
  if (!emitter) return { remove: () => {} }
  return emitter.addListener('onError', (data: { code: string; message: string }) => {
    const code = typeof data?.code === 'string' ? data.code : 'unknown'
    const message = typeof data?.message === 'string' ? data.message : ''
    callback(code, message)
  })
}

// 新增 onStatusChange 監聽器 (Issue #6)
export function onStatusChange(callback: (status: string) => void) {
  if (!emitter) return { remove: () => {} }
  return emitter.addListener('onStatusChange', (data: { status: string }) => {
    if (data && typeof data.status === 'string') callback(data.status)
  })
}
