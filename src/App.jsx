import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, LogIn } from 'lucide-react'
import { AppProvider, useApp } from './contexts/AppContext'
import { LoginModal } from './components/Login/LoginModal'
import { ChatContainer } from './components/Chat/ChatContainer'
import { ChatInput } from './components/Chat/ChatInput'
import { UserMenu } from './components/UserMenu/UserMenu'
import { Live2DViewer } from './components/Live2D/Live2DViewer'

function AppContent() {
  const {
    websocket,
    session,
    audio,
    messages,
    setMessages,
    addMessage,
    setIsTyping,
    setCurrentBotMessage,
    profileCompletion,
    conversationStage,
    systemStatus,
    promptMode,
    changePromptMode
  } = useApp()

  const [showLogin, setShowLogin] = useState(false)

  // 自动恢复会话和连接 WebSocket
  useEffect(() => {
    if (session.isLoading) return

    if (session.isLoggedIn && session.userId) {
      // 如果有会话,自动连接 WebSocket
      console.log('✅ 检测到已登录会话,自动连接 WebSocket')
      websocket.connect(session.userId)
      setShowLogin(false)
    } else {
      // 没有会话,自动显示登录框
      console.log('ℹ️ 未检测到会话,显示登录框')
      setShowLogin(true)
    }
  }, [session.isLoggedIn, session.isLoading, session.userId, websocket])

  // 发送打破沉默消息
  const sendBreakSilenceMessage = () => {
    if (!websocket.isConnected) {
      console.error('WebSocket未连接')
      return
    }

    console.log('📤 发送打破沉默消息到后端')

    // 发送特殊的打破沉默消息
    websocket.sendMessage({
      type: 'chat',
      content: '用户没有回应，请打破沉默'
    })

    // 在界面上显示提示
    addMessage({
      type: 'system',
      content: '⚡ 已触发打破沉默',
      timestamp: new Date().toISOString()
    })
  }

  // 监听键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 检查是否在输入框中,如果是则不处理快捷键
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      // Command/Ctrl 键 - 打破沉默
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        console.log('🎯 Command/Ctrl键触发 - 发送打破沉默消息')
        sendBreakSilenceMessage()
        event.preventDefault()
        return
      }

      // 数字键 0-5 - 切换提示词模式
      if (event.key >= '0' && event.key <= '5') {
        const mode = parseInt(event.key)
        console.log(`🎯 键盘快捷键触发: ${event.key} -> 切换到提示词模式 ${mode}`)
        changePromptMode(mode)
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    console.log('✅ 键盘快捷键已初始化 (0-5切换提示词模式, Command/Ctrl打破沉默)')

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [websocket.isConnected, changePromptMode])

  // 设置音频播放完成回调
  useEffect(() => {
    audio.onPlaybackComplete = () => {
      console.log('🎵 所有音频播放完成，通知后端开始沉默检测')
      if (websocket.isConnected) {
        websocket.sendMessage({
          type: 'audio_playback_complete',
          message: '音频播放完成'
        })
      }
    }

    return () => {
      audio.onPlaybackComplete = null
    }
  }, [audio, websocket])

  // 监听 WebSocket 消息
  useEffect(() => {
    if (!websocket.isConnected) return

    // 处理生成开始
    const handleGenerationStart = (data) => {
      console.log('📝 生成开始')
      // 创建一个新的空消息
      addMessage({
        type: 'bot',
        content: '',
        id: 'current-bot-message' // 特殊 ID 用于标识当前正在生成的消息
      })
      setIsTyping(true)
    }

    // 处理生成片段(流式文本)
    const handleGenerationChunk = (data) => {
      if (data.content) {
        console.log('📝 生成片段:', data.content)
        // 使用函数式更新来避免闭包问题
        setMessages(prev => {
          const newMessages = [...prev]
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'bot') {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: (newMessages[newMessages.length - 1].content || '') + data.content
            }
          }
          return newMessages
        })
      }
    }

    // 处理生成结束
    const handleGenerationEnd = (data) => {
      console.log('✅ 生成结束')
      setIsTyping(false)
      setCurrentBotMessage(null)
    }

    // 处理 TTS 音频
    const handleTTSAudio = (data) => {
      if (data.audio_data && data.order) {
        audio.playTTSAudioChunk(data.audio_data, data.format || 'mp3', data.order)
      }
    }

    // 处理 TTS 完成
    const handleTTSComplete = () => {
      audio.onTTSComplete()
    }

    // 处理提示词模式信息
    const handlePromptModeInfo = (data) => {
      if (data.mode !== undefined) {
        changePromptMode(data.mode)
      }
    }

    // 注册事件监听
    websocket.on('generation_start', handleGenerationStart)
    websocket.on('generation_chunk', handleGenerationChunk)
    websocket.on('generation_end', handleGenerationEnd)
    websocket.on('tts_audio_chunk', handleTTSAudio)
    websocket.on('tts_complete', handleTTSComplete)
    websocket.on('prompt_mode_info', handlePromptModeInfo)

    return () => {
      websocket.off('generation_start', handleGenerationStart)
      websocket.off('generation_chunk', handleGenerationChunk)
      websocket.off('generation_end', handleGenerationEnd)
      websocket.off('tts_audio_chunk', handleTTSAudio)
      websocket.off('tts_complete', handleTTSComplete)
      websocket.off('prompt_mode_info', handlePromptModeInfo)
    }
  }, [websocket, audio, addMessage, setIsTyping, setCurrentBotMessage, changePromptMode, messages])



  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">悠悠</h1>
              <p className="text-sm text-gray-500">AI情感陪伴数字人智能对话系统</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${websocket.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {websocket.isConnected ? '已连接' : '未连接'}
              </span>
            </div>

            {session.isLoggedIn ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                title="登录"
              >
                <LogIn className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[700px]"
            >
              <ChatContainer />
              <ChatInput />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live2D Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg"
            >
              {/*<h3 className="text-lg font-semibold mb-4">数字人预览</h3>*/}
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden">
                <Live2DViewer />
              </div>
            </motion.div>

            {/*/!* User Info *!/*/}
            {/*<motion.div*/}
            {/*  initial={{ opacity: 0, x: 20 }}*/}
            {/*  animate={{ opacity: 1, x: 0 }}*/}
            {/*  transition={{ delay: 0.1 }}*/}
            {/*  className="bg-white rounded-2xl shadow-lg p-6"*/}
            {/*>*/}
            {/*  <h3 className="text-lg font-semibold mb-4">用户信息</h3>*/}
            {/*  <div className="space-y-3">*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">用户名</span>*/}
            {/*      <span className="font-medium">{session.userName || '未登录'}</span>*/}
            {/*    </div>*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">对话轮次</span>*/}
            {/*      <span className="font-medium">{session.session?.conversation_count || 0}</span>*/}
            {/*    </div>*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">档案完成度</span>*/}
            {/*      <span className="font-medium">{profileCompletion}%</span>*/}
            {/*    </div>*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">对话阶段</span>*/}
            {/*      <span className="font-medium text-sm">{conversationStage}</span>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</motion.div>*/}

            {/*/!* System Status *!/*/}
            {/*<motion.div*/}
            {/*  initial={{ opacity: 0, x: 20 }}*/}
            {/*  animate={{ opacity: 1, x: 0 }}*/}
            {/*  transition={{ delay: 0.2 }}*/}
            {/*  className="bg-white rounded-2xl shadow-lg p-6"*/}
            {/*>*/}
            {/*  <h3 className="text-lg font-semibold mb-4">系统状态</h3>*/}
            {/*  <div className="space-y-3">*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">LLM</span>*/}
            {/*      <span className={`font-medium ${systemStatus.llm === 'normal' ? 'text-green-500' : 'text-red-500'}`}>*/}
            {/*        {systemStatus.llm === 'normal' ? '正常' : '异常'}*/}
            {/*      </span>*/}
            {/*    </div>*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">TTS</span>*/}
            {/*      <span className={`font-medium ${systemStatus.tts === 'normal' ? 'text-green-500' : 'text-red-500'}`}>*/}
            {/*        {systemStatus.tts === 'normal' ? '正常' : '异常'}*/}
            {/*      </span>*/}
            {/*    </div>*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*      <span className="text-gray-600">ASR</span>*/}
            {/*      <span className={`font-medium ${systemStatus.asr === 'normal' ? 'text-green-500' : 'text-red-500'}`}>*/}
            {/*        {systemStatus.asr === 'normal' ? '正常' : '异常'}*/}
            {/*      </span>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</motion.div>*/}
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
