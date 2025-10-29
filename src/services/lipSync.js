/**
 * 口型同步服务
 * 基于音频能量分析实现 Live2D 口型同步
 */
class LipSyncService {
  constructor() {
    this.audioContext = null
    this.analyser = null
    this.dataArray = null
    this.rafId = null
    this.source = null
    this.lastValue = 0
    
    // 配置参数
    this.SMOOTH = 0.35  // 平滑系数：越大越稳定
    this.GAIN = 1.8     // 口型增益：越大张口越大
  }

  /**
   * 确保音频上下文已创建
   */
  ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 1024
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
      console.log('🎤 音频上下文已创建')
    }
  }

  /**
   * 计算音频能量级别
   */
  calculateLevel() {
    this.analyser.getByteTimeDomainData(this.dataArray)
    
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const v = (this.dataArray[i] - 128) / 128
      sum += v * v
    }
    
    const rms = Math.sqrt(sum / this.dataArray.length) // 0~1
    return Math.min(1, rms * this.GAIN)
  }

  /**
   * 动画帧更新
   */
  tick() {
    const model = window.live2dModel
    if (!model || !this.analyser) return

    const target = this.calculateLevel()
    const y = this.lastValue + (target - this.lastValue) * this.SMOOTH
    this.lastValue = y

    // Cubism4 参数写入
    const core = model.internalModel && model.internalModel.coreModel
    if (core) {
      core.setParameterValueById('ParamMouthOpenY', y)
      // 根据能量稍微变化嘴型
      core.setParameterValueById('ParamMouthForm', y * 0.6)
    }

    if (this.rafId) {
      this.rafId = requestAnimationFrame(() => this.tick())
    }
  }

  /**
   * 开始口型同步
   * @param {HTMLAudioElement} audioElement - 音频元素
   */
  start(audioElement) {
    try {
      console.log('🎤 开始口型同步:', audioElement)
      
      this.ensureAudioContext()
      this.stop()

      // 创建音频源
      this.source = this.audioContext.createMediaElementSource(audioElement)
      this.source.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)

      // 开始动画循环
      this.rafId = requestAnimationFrame(() => this.tick())
      
      console.log('✅ 口型同步已启动')
    } catch (error) {
      console.warn('⚠️ 口型同步启动失败:', error)
    }
  }

  /**
   * 停止口型同步
   */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.lastValue = 0

    try {
      if (this.source) {
        this.source.disconnect()
        this.source = null
      }
    } catch (error) {
      // 忽略断开连接错误
    }

    // 收口
    const model = window.live2dModel
    if (model?.internalModel?.coreModel) {
      model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0)
      model.internalModel.coreModel.setParameterValueById('ParamMouthForm', 0)
    }

    console.log('🎤 口型同步已停止')
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stop()
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyser = null
    this.dataArray = null
    
    console.log('🗑️ 口型同步服务已销毁')
  }
}

// 创建单例
const lipSyncService = new LipSyncService()

// 暴露全局函数供兼容性使用
window.__startLipSyncForAudio = (audioEl) => lipSyncService.start(audioEl)
window.__stopLipSync = () => lipSyncService.stop()

export default lipSyncService

