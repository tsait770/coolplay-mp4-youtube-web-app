import { NativeEventEmitter, NativeModules, Platform } from 'react-native'

const Native = (NativeModules as any).VoiceNative
const emitter = Native ? new NativeEventEmitter(Native) : null

export function isNativeAvailable(): boolean {
  return Platform.OS !== 'web' && !!Native
}

export function startContinuousListen(): void {
  if (!Native) return
  Native.startListening()
}

export function stopContinuousListen(): void {
  if (!Native) return
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

