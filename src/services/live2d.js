/**
 * Live2D 服务
 * 管理 Live2D 模型的加载、渲染和控制
 *
 * 注意: 使用全局的 PIXI 对象(从 CDN 加载),而不是 npm 包
 */
class Live2DService {
  constructor() {
    this.app = null
    this.model = null
    this.container = null
    this.isInitialized = false
    this.expressions = []
    this.motions = []
    
    // 模型路径候选列表
    this.modelPaths = [
      '/models/youyou/youyou.model3.json',
      '/models/model.model3.json',
      '/models/avatar.model3.json'
    ]
  }

  /**
   * 初始化 Live2D
   * @param {HTMLElement} container - 容器元素
   */
  async initialize(container) {
    if (this.isInitialized) {
      console.warn('Live2D 已经初始化')
      return
    }

    this.container = container
    console.log('🎨 开始初始化 Live2D...')

    try {
      // 创建 PIXI 应用
      this.createApp()
      
      // 加载模型
      this.model = await this.loadFirstAvailableModel()
      
      // 设置模型位置和缩放
      this.fitAndPlace(this.model)
      
      // 添加到舞台
      this.app.stage.addChild(this.model)
      
      // 提取动作和表情列表
      this.extractControls(this.model)
      
      // 暴露到全局供口型同步使用
      window.live2dModel = this.model
      window.currentlive2dModel = this.model
      
      this.isInitialized = true
      console.log('✅ Live2D 初始化完成!')
      console.log('📊 可用动作:', this.motions.length)
      console.log('😊 可用表情:', this.expressions.length)
      
      return this.model
    } catch (error) {
      console.error('❌ Live2D 初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建 PIXI 应用
   */
  createApp() {
    if (!window.PIXI) {
      throw new Error('PIXI 未加载，请确认已引入 PIXI.js 库')
    }

    const resolution = window.devicePixelRatio || 1

    this.app = new window.PIXI.Application({
      width: 500,
      height: 500,
      backgroundAlpha: 0,
      antialias: true,
      resolution: resolution,
      autoDensity: true
    })

    this.container.innerHTML = ''
    this.container.appendChild(this.app.view)

    console.log(`🎨 Live2D canvas 分辨率: ${resolution}x (设备像素比: ${window.devicePixelRatio})`)
  }

  /**
   * 加载第一个可用的模型
   */
  async loadFirstAvailableModel() {
    // 确保 PIXI.live2d 已加载
    if (!window.PIXI || !window.PIXI.live2d) {
      throw new Error('PIXI.live2d 未加载，请确认已引入 pixi-live2d-display 库')
    }

    for (const path of this.modelPaths) {
      try {
        console.log('🔍 尝试加载模型:', path)
        const model = await window.PIXI.live2d.Live2DModel.from(path)
        model.name = path
        console.log('✅ 成功加载模型:', path)
        return model
      } catch (error) {
        console.log('⚠️ 模型加载失败:', path, error.message)
      }
    }
    throw new Error('未找到可用的 Live2D 模型，请确认 /public/models 下的 .model3.json 路径')
  }

  /**
   * 设置模型位置和缩放
   */
  fitAndPlace(model) {
    const targetW = 500
    const targetH = 500
    const scale = Math.min(targetW / model.width, targetH / model.height) * 1.05
    
    model.scale.set(scale)
    model.anchor.set(0.5, 1.0)
    model.position.set(targetW / 2, targetH - 2)
  }

  /**
   * 提取动作和表情列表
   */
  extractControls(model) {
    const settings = model.internalModel?.settings || {}

    // 提取动作
    this.motions = Object.entries(settings.motions || {}).flatMap(([group, arr]) =>
      (arr || []).map((def, i) => ({
        label: def?.Name || `${group} #${i + 1}`,
        group,
        index: i
      }))
    )

    // 提取表情
    this.expressions = (settings.expressions || []).map(def => ({
      id: def?.Name || def?.name || def?.file || '',
      label: def?.Name || def?.name || def?.file || 'expr'
    }))

    // 暴露表情ID列表到全局
    window.expressions = this.expressions.map(e => e.id)
  }

  /**
   * 播放动作
   * @param {string} group - 动作组名
   * @param {number} index - 动作索引
   */
  playMotion(group, index) {
    if (!this.model) {
      console.error('❌ 模型未加载')
      return
    }
    
    console.log('🎬 播放动作:', group, index)
    this.model.motion(group, index)
  }

  /**
   * 播放表情
   * @param {string} expressionId - 表情ID
   */
  playExpression(expressionId) {
    if (!this.model) {
      console.error('❌ 模型未加载')
      return
    }
    
    console.log('😊 播放表情:', expressionId)
    this.model.expression(expressionId)
  }

  /**
   * 根据拼音匹配并播放表情
   * @param {string} pinyin - 拼音字符串
   */
  playExpressionByPinyin(pinyin) {
    if (!this.model || !window.expressions) {
      return
    }

    // 这里需要 pinyin-pro 库支持,暂时简化处理
    const matchedExpressions = window.expressions.filter(expId => {
      return expId.toLowerCase().includes(pinyin.toLowerCase())
    })

    matchedExpressions.forEach(expId => {
      this.playExpression(expId)
    })
  }

  /**
   * 获取动作列表
   */
  getMotions() {
    return this.motions
  }

  /**
   * 获取表情列表
   */
  getExpressions() {
    return this.expressions
  }

  /**
   * 销毁 Live2D
   */
  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
    
    this.model = null
    this.isInitialized = false
    window.live2dModel = null
    window.currentlive2dModel = null
    
    console.log('🗑️ Live2D 已销毁')
  }
}

// 创建单例
const live2dService = new Live2DService()

export default live2dService

