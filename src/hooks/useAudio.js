import { useState, useCallback, useRef, useEffect } from 'react'
import audioService from '../services/audio'

/**
 * 音频管理 Hook
 * 管理 TTS 播放和 ASR 录音
 */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [asrText, setAsrText] = useState('')
  const onAudioDataRef = useRef(null)

  // 播放 TTS 音频
  const playTTSAudio = useCallback((audioBase64, format = 'mp3') => {
    return audioService.playTTSAudio(audioBase64, format)
  }, [])

  // 播放带顺序号的 TTS 音频片段
  const playTTSAudioChunk = useCallback((audioBase64, format = 'mp3', order = 0) => {
    audioService.playTTSAudioChunkWithOrder(audioBase64, format, order)
  }, [])

  // TTS 生成完成
  const onTTSComplete = useCallback(() => {
    audioService.onTTSComplete()
  }, [])

  // 停止所有 TTS 音频
  const stopAllTTS = useCallback(() => {
    audioService.stopAllTTSAudio()
    setIsPlaying(false)
  }, [])

  // 开始录音
  const startRecording = useCallback(async (onAudioData) => {
    try {
      onAudioDataRef.current = onAudioData
      await audioService.startRecording(onAudioData)
      setIsRecording(true)
    } catch (error) {
      console.error('开始录音失败:', error)
      throw error
    }
  }, [])

  // 停止录音
  const stopRecording = useCallback(async () => {
    try {
      await audioService.stopRecording()
      setIsRecording(false)
      setAsrText('')
    } catch (error) {
      console.error('停止录音失败:', error)
    }
  }, [])

  // 设置播放完成回调
  useEffect(() => {
    audioService.onPlaybackComplete = () => {
      setIsPlaying(false)
    }

    return () => {
      audioService.onPlaybackComplete = null
    }
  }, [])

  return {
    isPlaying,
    isRecording,
    asrText,
    setAsrText,
    playTTSAudio,
    playTTSAudioChunk,
    onTTSComplete,
    stopAllTTS,
    startRecording,
    stopRecording
  }
}

