/**
 * 用户会话管理服务
 * 管理用户登录、会话存储和同步
 */

class SessionService {
  constructor() {
    this.SESSION_KEY = 'user_session_v2'
    this.SYNC_INTERVAL = 60 * 60 * 1000 // 1小时同步间隔
    this.session = null
  }

  /**
   * 创建新会话
   */
  createSession(userId, userName, profileData = {}) {
    this.session = {
      user_id: userId,
      name: userName,
      login_time: new Date().toISOString(),
      last_sync_time: new Date().toISOString(),
      profile: profileData,
      conversation_count: 0,
      last_conversation_time: null
    }

    this.saveToStorage()
    console.log('✅ 会话已创建:', this.session)
    return this.session
  }

  /**
   * 加载会话
   */
  loadSession() {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY)
      if (stored) {
        this.session = JSON.parse(stored)
        console.log('✅ 会话已加载:', this.session)
        return this.session
      }
    } catch (error) {
      console.error('❌ 加载会话失败:', error)
    }
    return null
  }

  /**
   * 保存会话到 localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.session))
      console.log('💾 会话已保存到本地存储')
    } catch (error) {
      console.error('❌ 保存会话失败:', error)
    }
  }

  /**
   * 更新会话信息
   */
  updateSession(updates) {
    if (!this.session) {
      console.error('❌ 没有活动会话')
      return
    }

    this.session = {
      ...this.session,
      ...updates,
      last_sync_time: new Date().toISOString()
    }

    this.saveToStorage()
    console.log('✅ 会话已更新:', updates)
  }

  /**
   * 更新用户档案
   */
  updateProfile(profileData) {
    if (!this.session) return

    this.session.profile = {
      ...this.session.profile,
      ...profileData
    }

    this.saveToStorage()
  }

  /**
   * 增加对话计数
   */
  incrementConversationCount() {
    if (!this.session) return

    this.session.conversation_count = (this.session.conversation_count || 0) + 1
    this.session.last_conversation_time = new Date().toISOString()
    this.saveToStorage()
  }

  /**
   * 清除会话
   */
  clearSession() {
    this.session = null
    localStorage.removeItem(this.SESSION_KEY)
    console.log('🗑️ 会话已清除')
  }

  /**
   * 获取当前会话
   */
  getSession() {
    return this.session
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    return this.session?.user_id || null
  }

  /**
   * 获取用户名
   */
  getUserName() {
    return this.session?.name || null
  }

  /**
   * 检查是否需要同步
   */
  needsSync() {
    if (!this.session || !this.session.last_sync_time) return true

    const lastSync = new Date(this.session.last_sync_time)
    const now = new Date()
    const timeDiff = now - lastSync

    return timeDiff > this.SYNC_INTERVAL
  }

  /**
   * 同步会话到服务器
   */
  async syncToServer() {
    if (!this.session) return

    try {
      const response = await fetch('http://localhost:8000/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.session.user_id,
          session_data: this.session
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ 会话同步成功:', data)
        
        // 更新同步时间
        this.session.last_sync_time = new Date().toISOString()
        this.saveToStorage()
        
        return data
      } else {
        console.error('❌ 会话同步失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 会话同步错误:', error)
    }
  }

  /**
   * 从服务器获取用户档案
   */
  async fetchProfile(userId) {
    try {
      const response = await fetch(`http://localhost:8000/api/user/profile/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 用户档案获取成功:', data)
        return data
      } else {
        console.error('❌ 获取用户档案失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 获取用户档案错误:', error)
    }
    return null
  }

  /**
   * 搜索用户
   */
  async searchUsers(query) {
    try {
      const response = await fetch(`http://localhost:8000/api/user/search?q=${encodeURIComponent(query)}`)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ 用户搜索成功:', data)
        return data.users || []
      } else {
        console.error('❌ 用户搜索失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 用户搜索错误:', error)
    }
    return []
  }

  /**
   * 获取活跃用户列表
   */
  async getActiveUsers() {
    try {
      const response = await fetch('http://localhost:8000/memory/users/active')

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.active_users) {
          console.log('✅ 获取活跃用户成功:', data.active_users.length, '个用户')
          return data.active_users
        }
      } else {
        console.error('❌ 获取活跃用户失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 获取活跃用户错误:', error)
    }
    return []
  }

  /**
   * 用户登录
   */
  async login(userId, userName) {
    try {
      // 获取用户档案
      const profile = await this.fetchProfile(userId)
      
      // 创建会话
      this.createSession(userId, userName, profile)
      
      // 同步到服务器
      await this.syncToServer()
      
      return this.session
    } catch (error) {
      console.error('❌ 登录失败:', error)
      throw error
    }
  }

  /**
   * 用户登出
   */
  logout() {
    this.clearSession()
    console.log('👋 用户已登出')
  }
}

// 创建单例
const sessionService = new SessionService()

export default sessionService

