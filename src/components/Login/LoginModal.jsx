import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogIn, UserPlus, Search, Users, Clock, ArrowRight } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

/**
 * 登录模态框组件
 */
export function LoginModal({ isOpen, onClose }) {
  const { session, websocket, clearMessages } = useApp()
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showSwitchUser, setShowSwitchUser] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // 搜索用户
  useEffect(() => {
    const searchUsers = async () => {
      if (userId.trim().length < 2) {
        setSearchResults([])
        setShowSuggestions(false)
        return
      }

      try {
        const results = await session.searchUsers(userId)
        setSearchResults(results)
        setShowSuggestions(results.length > 0)
      } catch (error) {
        console.error('搜索用户失败:', error)
      }
    }

    const timer = setTimeout(searchUsers, 300)
    return () => clearTimeout(timer)
  }, [userId, session])

  // 处理登录
  const handleLogin = async () => {
    if (!userId.trim() || !userName.trim()) {
      alert('请输入用户ID和用户名')
      return
    }

    try {
      setIsLoading(true)

      // 登录 (WebSocket 连接会由 App.jsx 自动处理)
      await session.login(userId.trim(), userName.trim())

      console.log('✅ 登录成功,等待自动连接 WebSocket...')

      // 关闭登录框
      setTimeout(() => {
        onClose()
      }, 500)

    } catch (error) {
      console.error('❌ 登录失败:', error)
      alert('登录失败,请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 选择用户
  const handleSelectUser = (user) => {
    setUserId(user.user_id)
    setUserName(user.name)
    setShowSuggestions(false)
  }

  // 加载活跃用户列表
  const loadActiveUsers = async () => {
    setLoadingUsers(true)
    try {
      const users = await session.getActiveUsers()
      // 过滤掉当前用户,按最后活跃时间排序
      const otherUsers = users
        .filter(user => user.user_id !== session.userId)
        .sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
        .slice(0, 5) // 只显示前5个用户
      setActiveUsers(otherUsers)
    } catch (error) {
      console.error('加载活跃用户失败:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // 切换到指定用户
  const handleSwitchToUser = async (user) => {
    try {
      setIsLoading(true)

      // 清空当前聊天记录
      if (clearMessages) {
        clearMessages()
      }

      // 断开当前WebSocket连接
      websocket.disconnect()

      // 登录新用户
      await session.login(user.user_id, user.name)

      console.log(`✅ 已切换到用户: ${user.name} (${user.user_id})`)

      // 关闭弹窗
      setShowSwitchUser(false)
      setTimeout(() => {
        onClose()
      }, 500)

    } catch (error) {
      console.error('❌ 用户切换失败:', error)
      alert('切换用户失败,请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 显示切换用户界面
  const handleShowSwitchUser = () => {
    setShowSwitchUser(true)
    loadActiveUsers()
  }

  // 格式化最后活跃时间
  const formatLastActive = (lastActive) => {
    const now = new Date()
    const last = new Date(lastActive)
    const diffMinutes = Math.floor((now - last) / (1000 * 60))

    if (diffMinutes < 1) return '刚刚活跃'
    if (diffMinutes < 60) return `${diffMinutes}分钟前`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}小时前`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}天前`
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed w-full min-h-dvh inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              {showSwitchUser ? (
                <Users className="w-8 h-8 text-white" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showSwitchUser ? '👥 切换用户' : '欢迎来到悠悠'}
            </h2>
            <p className="text-gray-600 text-sm">
              {showSwitchUser ? '选择要切换到的用户账户' : '请登录或注册以开始对话'}
            </p>

            {/* 切换用户按钮 */}
            {!showSwitchUser && session.isLoggedIn && (
              <button
                onClick={handleShowSwitchUser}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
              >
                <Users className="w-4 h-4" />
                切换到其他用户
              </button>
            )}

            {/* 返回登录按钮 */}
            {showSwitchUser && (
              <button
                onClick={() => setShowSwitchUser(false)}
                className="mt-4 text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                ← 返回登录
              </button>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* 切换用户界面 */}
            {showSwitchUser ? (
              <>
                {/* 最近使用的用户 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    最近使用的用户
                  </h4>

                  {loadingUsers ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      正在加载用户列表...
                    </div>
                  ) : activeUsers.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {activeUsers.map((user) => (
                        <motion.div
                          key={user.user_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => handleSwitchToUser(user)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 group-hover:text-blue-600 flex items-center gap-2">
                                {user.name || '匿名用户'}
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                ID: {user.user_id}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400">
                                {formatLastActive(user.last_active)}
                              </div>
                              {user.conversation_count > 0 && (
                                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1 inline-block">
                                  {user.conversation_count} 次对话
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无其他用户
                    </div>
                  )}
                </div>

                {/* 手动输入用户名切换 */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    登录其他用户
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入用户ID..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入用户名..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleLogin}
                      disabled={isLoading || !userId.trim() || !userName.trim()}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>切换中...</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5" />
                          <span>切换</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 原来的登录表单 */}
            {/* User ID Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户 ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入用户ID或搜索..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* User Suggestions */}
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      onClick={() => handleSelectUser(user)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.user_id}</div>
                      </div>
                      {user.conversation_count > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {user.conversation_count} 次对话
                        </span>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* User Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的名字..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleLogin}
                disabled={isLoading || !userId.trim() || !userName.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>登录</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShowSwitchUser}
                disabled={isLoading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                <span>切换用户</span>
              </button>
            </div>
              </>
            )}
          </div>

          {/* Tips */}
          {!showSwitchUser && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>提示:</strong> 如果是新用户,输入任意ID和名字即可自动注册
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

