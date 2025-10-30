/**
 * 用户会话管理服务
 * 管理用户登录、会话存储和同步
 * 与 test.html 中的 UserSessionManager 保持一致
 */

class SessionService {
  constructor() {
    this.SESSION_KEY = 'user_session_v2'
    this.SYNC_INTERVAL = 60 * 60 * 1000 // 1小时同步间隔
    this.session = null
  }

  /**
   * 保存完整会话信息（与 test.html 一致）
   */
  saveSession(userData) {
    const session = {
      userId: userData.userId || userData.user_id,
      userName: userData.userName || userData.name,
      profile: userData.profile || {
        name: userData.userName || userData.name,
        age: userData.age || null,
        gender: userData.gender || null,
        style: userData.style || '友好',
        interests: userData.interests || []
      },
      lastSync: new Date().toISOString(),
      isOffline: false,
      sessionToken: userData.sessionToken || null
    }

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
    this.session = session
    console.log('✅ 完整用户会话已保存:', session)
    return session
  }

  /**
   * 加载会话信息
   */
  loadSession() {
    try {
      const data = localStorage.getItem(this.SESSION_KEY)
      if (data) {
        this.session = JSON.parse(data)
        console.log('✅ 从本地存储恢复用户会话:', this.session)
        return this.session
      }

      // 兼容旧版localStorage
      return this.migrateOldSession()
    } catch (error) {
      console.error('❌ 加载会话失败:', error)
      return null
    }
  }

  /**
   * 迁移旧版localStorage数据
   */
  migrateOldSession() {
    const oldUserId = localStorage.getItem('currentUserId')
    const oldUserName = localStorage.getItem('currentUserName')

    if (oldUserId && oldUserName) {
      console.log('🔄 迁移旧版用户数据...')
      const session = this.saveSession({
        userId: oldUserId,
        userName: oldUserName
      })

      // 清理旧数据
      localStorage.removeItem('currentUserId')
      localStorage.removeItem('currentUserName')

      return session
    }

    return null
  }

  /**
   * 检查会话是否过期
   */
  isSessionExpired() {
    if (!this.session || !this.session.lastSync) return true

    const lastSync = new Date(this.session.lastSync)
    const now = new Date()
    const expired = (now - lastSync) > this.SYNC_INTERVAL

    console.log(`🕒 会话检查: 上次同步 ${lastSync.toLocaleString()}, ${expired ? '已过期' : '有效'}`)
    return expired
  }

  /**
   * 清除会话
   */
  clearSession() {
    localStorage.removeItem(this.SESSION_KEY)
    this.session = null
    console.log('✅ 用户会话已清除')
  }

  /**
   * 获取当前会话
   */
  getCurrentSession() {
    return this.session || this.loadSession()
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    return this.session?.userId || null
  }

  /**
   * 获取用户名
   */
  getUserName() {
    return this.session?.userName || null
  }

  /**
   * 显示同步状态（可选，用于UI集成）
   */
  showSyncStatus(message, type = 'info') {
    const statusEl = document.getElementById('syncStatus')
    if (statusEl) {
      statusEl.textContent = message
      statusEl.className = `sync-status ${type}`
      statusEl.style.display = 'block'

      // 3秒后自动隐藏
      setTimeout(() => {
        statusEl.style.display = 'none'
      }, 3000)
    }
    console.log(`📊 同步状态: ${message}`)
  }

  /**
   * 刷新会话（从服务器获取最新数据）
   */
  async refreshSession(showLoading = false) {
    if (!this.session) {
      throw new Error('没有活跃会话')
    }

    try {
      if (showLoading) {
        this.showSyncStatus('正在同步用户数据...', 'loading')
      }

      console.log('🔄 开始刷新用户会话...')
      const response = await fetch(`/api/user/${this.session.userId}/session`)
      const data = await response.json()

      if (data.success && data.profile) {
        // 更新会话数据
        const updatedSession = this.saveSession({
          userId: this.session.userId,
          userName: data.profile.name,
          profile: data.profile,
          sessionToken: this.session.sessionToken
        })

        // 标记为在线状态
        updatedSession.isOffline = false
        this.saveSession(updatedSession)

        if (showLoading) {
          this.showSyncStatus('同步成功！', 'success')
        }

        console.log('✅ 会话刷新成功:', updatedSession)
        return updatedSession
      } else {
        throw new Error(data.error || '用户验证失败')
      }
    } catch (error) {
      console.error('❌ 会话刷新失败:', error)

      // 标记为离线状态
      if (this.session) {
        this.session.isOffline = true
        this.saveSession(this.session)
      }

      if (showLoading) {
        this.showSyncStatus('同步失败，使用离线模式', 'error')
      }

      throw error
    }
  }

  /**
   * 从服务器获取用户档案
   */
  async fetchProfile(userId) {
    try {
      const response = await fetch(`/api/user/${userId}/session`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          console.log('✅ 用户档案获取成功:', data.profile)
          return data.profile
        }
      } else {
        console.error('❌ 获取用户档案失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 获取用户档案错误:', error)
    }
    return null
  }

  /**
   * 搜索用户（从活跃用户列表中搜索）
   */
  async searchUsers(query) {
    try {
      const response = await fetch('/memory/users/active')
      const data = await response.json()

      if (data.success && data.active_users) {
        const filteredUsers = data.active_users.filter(user =>
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.user_id?.toLowerCase().includes(query.toLowerCase())
        )
        console.log('✅ 用户搜索成功:', filteredUsers)
        return filteredUsers
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
      const response = await fetch('/memory/users/active')

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
   * 创建或更新用户档案
   */
  async createOrUpdateUser(userId, userName) {
    try {
      // 首先尝试查找现有用户
      const searchResponse = await fetch('/memory/users/active')
      const searchData = await searchResponse.json()

      let existingUser = null
      if (searchData.success && searchData.active_users) {
        existingUser = searchData.active_users.find(user =>
          user.name?.toLowerCase() === userName.toLowerCase()
        )
      }

      if (existingUser) {
        console.log('✅ 找到现有用户:', existingUser)
        return existingUser
      }

      // 创建新用户
      const newUserId = userId || `user_${userName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}`
      const createResponse = await fetch(`/memory/user/${newUserId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: userName,
          created_at: new Date().toISOString()
        })
      })

      const createData = await createResponse.json()

      if (createData.success) {
        console.log('✅ 用户创建成功:', createData)
        return {
          user_id: newUserId,
          name: userName,
          profile: createData.profile
        }
      } else {
        throw new Error('创建用户失败')
      }
    } catch (error) {
      console.error('❌ 创建或更新用户失败:', error)
      throw error
    }
  }

  /**
   * 用户登录
   * 支持两种调用方式:
   * 1. login(username) - 只传用户名,自动生成 userId
   * 2. login(userId, userName) - 传入 userId 和 userName
   */
  async login(userIdOrName, userName) {
    // 兼容两种调用方式
    let searchKey, finalUserName

    if (userName) {
      // 方式2: login(userId, userName)
      searchKey = userIdOrName
      finalUserName = userName
    } else {
      // 方式1: login(username)
      searchKey = userIdOrName
      finalUserName = userIdOrName
    }

    if (!searchKey || !searchKey.trim()) {
      throw new Error('请输入用户名')
    }

    try {
      // 首先尝试查找现有用户
      const searchResponse = await fetch('/memory/users/active')
      const searchData = await searchResponse.json()

      let existingUser = null
      if (searchData.success && searchData.active_users) {
        existingUser = searchData.active_users.find(user =>
          user.name === searchKey ||
          user.user_id === searchKey ||
          user.name === finalUserName
        )
      }

      if (existingUser) {
        // 使用现有用户，保存完整会话信息
        this.saveSession({
          userId: existingUser.user_id,
          userName: existingUser.name,
          profile: {
            name: existingUser.name,
            age: existingUser.age,
            gender: existingUser.gender,
            style: existingUser.style || '友好',
            interests: existingUser.interests || []
          }
        })

        console.log(`✅ 欢迎回来，${existingUser.name}！`)
        return this.session
      } else {
        // 创建新用户
        const newUserId = userName
          ? userIdOrName  // 如果传了 userName,使用第一个参数作为 userId
          : `user_${searchKey.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}`

        const createResponse = await fetch(`/memory/user/${newUserId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: finalUserName,
            style: '友好'
          })
        })

        const createData = await createResponse.json()
        if (createData.success) {
          this.saveSession({
            userId: newUserId,
            userName: finalUserName,
            profile: {
              name: finalUserName,
              style: '友好'
            }
          })

          console.log(`✅ 新用户 ${finalUserName} 创建成功！`)
          return this.session
        } else {
          throw new Error(createData.error || '创建用户失败')
        }
      }
    } catch (error) {
      console.error('❌ 用户登录失败:', error)
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

