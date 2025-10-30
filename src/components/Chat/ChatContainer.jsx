import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../contexts/AppContext'

/**
 * 聊天容器组件
 * 参考 UI 图设计:
 * - AI 消息: 左侧,浅灰色背景,带头像
 * - 用户消息: 右侧,深色背景,带头像
 */
export function ChatContainer() {
  const { messages, isTyping, session } = useApp()
  const messagesEndRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // 获取用户名首字母作为头像
  const getUserInitial = () => {
    return session && session.userName ? session.userName.charAt(0).toUpperCase() : 'U'
  }

  // 格式化消息内容(支持换行等)
  const formatMessage = (content) => {
    if (!content) return ''

    // 将换行符转换为 <br>
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  // 生成欢迎消息
  const getWelcomeMessage = () => {
    if (session && session.userName) {
      return `你好${session.userName}！我是悠悠，一个18岁的动漫设计专业大一学妹～ 很高兴认识你！我对艺术创作和生活美学都很感兴趣，也喜欢和大家分享小众漫画和设计理念。有什么想聊的吗？`
    }
    return `你好！我是悠悠，一个18岁的动漫设计专业大一学妹～ 很高兴认识你！我对艺术创作和生活美学都很感兴趣，也喜欢和大家分享小众漫画和设计理念。有什么想聊的吗？`
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/*欢迎消息*/}
      <div className="w-full py-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-4">
            {/* AI 头像 */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold shadow-sm">
              AI
            </div>

            {/* 消息内容 */}
            <div className="flex-1">
              <div className="inline-block bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-3 max-w-2xl">
                <p className="text-gray-800 leading-relaxed">
                  {getWelcomeMessage()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      { !!messages.length && (
        <>
          {messages.map((message, index) => {
            return (
              <motion.div
                key={message.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full py-4 border-b border-gray-100"
              >
                <div className="max-w-4xl mx-auto px-6">
                  {message.type === 'system' ? (
                    /* 系统消息 - 居中 */
                    <div className="text-center text-gray-400 text-sm italic py-2">
                      {message.content}
                    </div>
                  ) : message.type === 'user' ? (
                    /* 用户消息 - 右侧 */
                    <div className="flex items-start gap-4 justify-end">
                      {/* 消息内容 */}
                      <div className="flex-1 flex justify-end">
                        <div className="inline-block bg-gray-900 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl">
                          <p className="leading-relaxed">
                            {formatMessage(message.content)}
                          </p>
                        </div>
                      </div>

                      {/* 用户头像 */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold shadow-sm">
                        {getUserInitial()}
                      </div>
                    </div>
                  ) : (
                    /* AI 消息 - 左侧 */
                    <div className="flex items-start gap-4">
                      {/* AI 头像 */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold shadow-sm">
                        AI
                      </div>

                      {/* 消息内容 */}
                      <div className="flex-1">
                        {message.content ? (
                          <div className="inline-block bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-3 max-w-2xl">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {formatMessage(message.content)}
                            </p>
                          </div>
                        ) : (
                          /* 空消息显示打字指示器 */
                          <div className="inline-block bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-3">
                            <div className="flex gap-1.5">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}

