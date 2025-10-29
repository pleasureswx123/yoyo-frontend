import lipSyncService from './lipSync'

/**
 * 音频服务
 * 管理 TTS 音频播放和 ASR 音频录制
 */

class AudioService {
  constructor() {
    // TTS 相关
    this.audioQueue = []
    this.isPlayingQueue = false
    this.currentAudioElements = []
    this.orderedAudioBuffer = new Map()
    this.expectedOrder = 1
    this.isTTSGenerationComplete = false
    this.onPlaybackComplete = null

    // ASR 相关
    this.isRecording = false
    this.mediaRecorder = null
    this.audioStream = null
    this.audioContext = null
    this.processor = null
    this.onAudioData = null
  }

  // ========== TTS 音频播放 ==========

  /**
   * 播放 TTS 音频 (Base64)
   */
  playTTSAudio(audioBase64, format = 'mp3') {
    try {
      console.log('🔊 播放 TTS 音频:', { format, length: audioBase64.length })

      // 将 Base64 转换为 Blob
      const binaryString = atob(audioBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: `audio/${format}` })
      const url = URL.createObjectURL(blob)

      // 创建音频元素
      const audio = new Audio(url)

      // 开始口型同步
      audio.onplay = () => {
        lipSyncService.start(audio)
      }

      audio.play()

      // 播放结束后清理
      audio.onended = () => {
        URL.revokeObjectURL(url)
        lipSyncService.stop()
      }

      return audio
    } catch (error) {
      console.error('❌ 播放 TTS 音频失败:', error)
      return null
    }
  }

  /**
   * 播放带顺序号的 TTS 音频片段
   */
  playTTSAudioChunkWithOrder(audioBase64, format = 'mp3', order = 0) {
    try {
      console.log('🎵 处理音频片段:', { order, format })

      // 将 Base64 转换为 Blob
      const binaryString = atob(audioBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: `audio/${format}` })

      // 存储到有序缓冲区
      this.orderedAudioBuffer.set(order, { blob, format })

      // 处理缓冲区
      this.processOrderedAudioBuffer()

    } catch (error) {
      console.error('❌ 处理音频片段失败:', error)
    }
  }

  /**
   * 处理有序音频缓冲区
   */
  processOrderedAudioBuffer() {
    // 按顺序播放音频
    while (this.orderedAudioBuffer.has(this.expectedOrder)) {
      const audioChunk = this.orderedAudioBuffer.get(this.expectedOrder)
      this.orderedAudioBuffer.delete(this.expectedOrder)

      console.log(`🎵 按顺序播放音频片段 #${this.expectedOrder}`)

      // 添加到播放队列
      this.audioQueue.push(audioChunk)
      this.expectedOrder++

      // 如果没有在播放,开始播放队列
      if (!this.isPlayingQueue) {
        this.playAudioQueue()
      }
    }
  }

  /**
   * 播放音频队列
   */
  playAudioQueue() {
    if (this.isPlayingQueue || this.audioQueue.length === 0) {
      return
    }

    this.isPlayingQueue = true
    console.log('🎵 开始播放音频队列,长度:', this.audioQueue.length)

    const playNextChunk = () => {
      if (this.audioQueue.length === 0) {
        this.isPlayingQueue = false
        console.log('🎵 音频队列播放完成')
        this.checkAllAudioPlaybackComplete()
        return
      }

      const audioChunk = this.audioQueue.shift()

      try {
        const url = URL.createObjectURL(audioChunk.blob)
        const audio = new Audio(url)

        // 添加到当前播放列表
        this.currentAudioElements.push(audio)

        // 开始口型同步
        audio.onplay = () => {
          lipSyncService.start(audio)
        }

        audio.onended = () => {
          URL.revokeObjectURL(url)
          lipSyncService.stop()

          // 从当前播放列表移除
          const index = this.currentAudioElements.indexOf(audio)
          if (index > -1) {
            this.currentAudioElements.splice(index, 1)
          }

          // 播放下一个
          playNextChunk()
        }

        audio.onerror = (error) => {
          console.error('❌ 音频播放错误:', error)
          URL.revokeObjectURL(url)
          
          // 从当前播放列表移除
          const index = this.currentAudioElements.indexOf(audio)
          if (index > -1) {
            this.currentAudioElements.splice(index, 1)
          }

          // 继续播放下一个
          playNextChunk()
        }

        audio.play().catch(error => {
          console.error('❌ 音频播放失败:', error)
          playNextChunk()
        })

      } catch (error) {
        console.error('❌ 创建音频失败:', error)
        playNextChunk()
      }
    }

    playNextChunk()
  }

  /**
   * TTS 生成完成
   */
  onTTSComplete() {
    console.log('🎵 TTS 生成完成')
    this.isTTSGenerationComplete = true

    // 处理剩余的缓冲区音频
    if (this.orderedAudioBuffer.size > 0) {
      const remainingOrders = Array.from(this.orderedAudioBuffer.keys()).sort((a, b) => a - b)
      console.log('🎵 处理剩余缓冲区音频:', remainingOrders)

      for (const order of remainingOrders) {
        const audioChunk = this.orderedAudioBuffer.get(order)
        this.orderedAudioBuffer.delete(order)
        this.audioQueue.push(audioChunk)
      }

      if (!this.isPlayingQueue && this.audioQueue.length > 0) {
        this.playAudioQueue()
      }
    }

    // 重置顺序号
    this.expectedOrder = 1

    // 检查是否所有音频都播放完成
    this.checkAllAudioPlaybackComplete()
  }

  /**
   * 检查所有音频是否播放完成
   */
  checkAllAudioPlaybackComplete() {
    if (this.isTTSGenerationComplete && 
        this.audioQueue.length === 0 && 
        !this.isPlayingQueue && 
        this.currentAudioElements.length === 0) {
      
      console.log('🎵 所有音频播放完成')
      this.isTTSGenerationComplete = false

      // 触发回调
      if (this.onPlaybackComplete) {
        this.onPlaybackComplete()
      }
    }
  }

  /**
   * 停止所有 TTS 音频
   */
  stopAllTTSAudio() {
    console.log('🛑 停止所有 TTS 播放')

    // 停止口型同步
    lipSyncService.stop()

    // 停止所有正在播放的音频
    this.currentAudioElements.forEach(audio => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (error) {
        console.error('停止音频失败:', error)
      }
    })
    this.currentAudioElements = []

    // 清空队列
    this.audioQueue = []
    this.orderedAudioBuffer.clear()
    this.isPlayingQueue = false
    this.isTTSGenerationComplete = false
    this.expectedOrder = 1

    console.log('✅ TTS 停止完成')
  }

  // ========== ASR 音频录制 ==========

  /**
   * 开始录音
   */
  async startRecording(onAudioData) {
    if (this.isRecording) {
      console.log('⚠️ 已经在录音中')
      return
    }

    try {
      console.log('🎤 开始录音')
      this.onAudioData = onAudioData

      // 请求麦克风权限
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      // 创建 AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      })

      const source = this.audioContext.createMediaStreamSource(this.audioStream)
      this.processor = this.audioContext.createScriptProcessor(1024, 1, 1)

      this.processor.onaudioprocess = (event) => {
        if (this.isRecording && this.onAudioData) {
          const inputBuffer = event.inputBuffer
          const inputData = inputBuffer.getChannelData(0)

          // 转换为 PCM16
          const pcm16 = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }

          // 发送音频数据
          this.onAudioData(pcm16.buffer)
        }
      }

      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      this.isRecording = true
      console.log('✅ 录音已开始')

    } catch (error) {
      console.error('❌ 启动录音失败:', error)
      throw error
    }
  }

  /**
   * 停止录音
   */
  async stopRecording() {
    if (!this.isRecording) {
      return
    }

    try {
      console.log('🎤 停止录音')

      this.isRecording = false

      // 停止音频处理
      if (this.processor) {
        this.processor.disconnect()
        this.processor = null
      }

      // 关闭音频上下文
      if (this.audioContext) {
        await this.audioContext.close()
        this.audioContext = null
      }

      // 停止音频流
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop())
        this.audioStream = null
      }

      this.onAudioData = null
      console.log('✅ 录音已停止')

    } catch (error) {
      console.error('❌ 停止录音失败:', error)
    }
  }

  /**
   * 检查是否正在录音
   */
  isRecordingActive() {
    return this.isRecording
  }
}

// 创建单例
const audioService = new AudioService()

export default audioService

