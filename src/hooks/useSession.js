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

  // 刷新会话
  const refreshSession = useCallback(async (showLoading = false) => {
    try {
      const refreshedSession = await sessionService.refreshSession(showLoading)
      setSession(refreshedSession)
      return refreshedSession
    } catch (error) {
      console.error('刷新会话失败:', error)
      throw error
    }
  }, [])

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
    userId: session?.userId,      // ✅ 修正字段名
    userName: session?.userName,  // ✅ 修正字段名
    profile: session?.profile,
    login,
    logout,
    refreshSession,
    searchUsers,
    getActiveUsers
  }
}

