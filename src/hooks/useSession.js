import { useState, useEffect, useCallback } from 'react'
import sessionService from '../services/session'

/**
 * 会话管理 Hook
 * 管理用户登录状态和会话信息
 */
export function useSession() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 加载会话
  useEffect(() => {
    const loadedSession = sessionService.loadSession()
    if (loadedSession) {
      console.log('✅ 从本地存储恢复用户会话:', loadedSession)
      setSession(loadedSession)
    } else {
      console.log('ℹ️ 没有找到本地会话,需要登录')
    }
    setIsLoading(false)
  }, [])

  // 登录
  const login = useCallback(async (userId, userName) => {
    try {
      setIsLoading(true)
      const newSession = await sessionService.login(userId, userName)
      setSession(newSession)
      return newSession
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 登出
  const logout = useCallback(() => {
    sessionService.logout()
    setSession(null)
  }, [])

  // 更新会话
  const updateSession = useCallback((updates) => {
    sessionService.updateSession(updates)
    setSession({ ...session, ...updates })
  }, [session])

  // 更新档案
  const updateProfile = useCallback((profileData) => {
    sessionService.updateProfile(profileData)
    setSession({
      ...session,
      profile: { ...session?.profile, ...profileData }
    })
  }, [session])

  // 增加对话计数
  const incrementConversationCount = useCallback(() => {
    sessionService.incrementConversationCount()
    setSession({
      ...session,
      conversation_count: (session?.conversation_count || 0) + 1,
      last_conversation_time: new Date().toISOString()
    })
  }, [session])

  // 搜索用户
  const searchUsers = useCallback(async (query) => {
    return await sessionService.searchUsers(query)
  }, [])

  // 获取活跃用户
  const getActiveUsers = useCallback(async () => {
    return await sessionService.getActiveUsers()
  }, [])

  return {
    session,
    isLoading,
    isLoggedIn: !!session,
    userId: session?.user_id,
    userName: session?.name,
    profile: session?.profile,
    login,
    logout,
    updateSession,
    updateProfile,
    incrementConversationCount,
    searchUsers,
    getActiveUsers
  }
}

