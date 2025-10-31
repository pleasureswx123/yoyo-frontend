/**
 * WebSocket 服务
 * 管理与后端的 WebSocket 连接
 */

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.messageHandlers = new Map()
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 5000
  }

  /**
   * 连接 WebSocket
   */
  connect(userId) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket 已连接或正在连接中')
      return
    }

    this.isConnecting = true
    console.log('🔌 正在连接 WebSocket...')

    try {
      this.ws = new WebSocket('/ws')

      this.ws.onopen = () => {
        console.log('✅ WebSocket 连接成功')
        this.isConnecting = false
        this.reconnectAttempts = 0

        // 发送用户初始化消息
        if (userId) {
          this.send({
            type: 'init',
            user_id: userId
          })
        }

        // 启动心跳
        this.startHeartbeat()

        // 触发连接成功回调
        this.triggerHandler('onopen', { connected: true })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 收到消息:', data.type)

          // 触发对应类型的消息处理器
          this.triggerHandler(data.type, data)
          this.triggerHandler('onmessage', data)
        } catch (error) {
          console.error('❌ 解析消息失败:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('🔌 WebSocket 连接关闭')
        this.isConnecting = false
        this.stopHeartbeat()

        // 触发关闭回调
        this.triggerHandler('onclose', { connected: false })

        // 尝试重连
        this.scheduleReconnect(userId)
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error)
        this.isConnecting = false
        this.triggerHandler('onerror', { error })
      }

    } catch (error) {
      console.error('❌ WebSocket 连接失败:', error)
      this.isConnecting = false
      this.scheduleReconnect(userId)
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    console.log('🔌 主动断开 WebSocket 连接')

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.reconnectAttempts = 0
  }

  /**
   * 发送消息
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket 未连接,无法发送消息')
      return false
    }

    try {
      this.ws.send(JSON.stringify(data))
      console.log('📤 发送消息:', data.type)
      return true
    } catch (error) {
      console.error('❌ 发送消息失败:', error)
      return false
    }
  }

  /**
   * 注册消息处理器
   */
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type).push(handler)
  }

  /**
   * 移除消息处理器
   */
  off(type, handler) {
    if (!this.messageHandlers.has(type)) return

    const handlers = this.messageHandlers.get(type)
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  /**
   * 触发消息处理器
   */
  triggerHandler(type, data) {
    if (!this.messageHandlers.has(type)) return

    const handlers = this.messageHandlers.get(type)
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`❌ 处理器执行失败 [${type}]:`, error)
      }
    })
  }

  /**
   * 计划重连
   */
  scheduleReconnect(userId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 达到最大重连次数,停止重连')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 3)

    console.log(`🔄 ${delay/1000}秒后尝试第 ${this.reconnectAttempts} 次重连...`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(userId)
    }, delay)
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
      }
    }, 30000) // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 创建单例
const websocketService = new WebSocketService()

export default websocketService

