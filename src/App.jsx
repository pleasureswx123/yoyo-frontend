import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, LogIn } from 'lucide-react'
import { AppProvider, useApp } from './contexts/AppContext'
import { LoginModal } from './components/Login/LoginModal'
import { ChatContainer } from './components/Chat/ChatContainer'
import { ChatInput } from './components/Chat/ChatInput'
import { UserMenu } from './components/UserMenu/UserMenu'
import { Live2DViewer } from './components/Live2D/Live2DViewer'
import { ToastContainer } from './components/Notification/Toast'
import { SearchIndicator } from './components/Search/SearchIndicator'

function AppContent() {
  const {
    websocket,
    session,
    audio,
    toast,
    messages,
    setMessages,
    addMessage,
    setIsTyping,
    setCurrentBotMessage,
    profileCompletion,
    conversationStage,
    systemStatus,
    promptMode,
    changePromptMode,
    updatePromptMode,
    isImmersiveMode,
    toggleImmersiveMode,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    asrStatus,
    setAsrStatus,
    currentVoice,
    currentSpeed
  } = useApp()

  const [showLogin, setShowLogin] = useState(false)

  // 更新提示词模式显示
  const updatePromptModeDisplay = useCallback((mode, modeInfo) => {
    if (mode !== undefined) {
      updatePromptMode(mode)
    }

    if (modeInfo) {
      console.log(`当前提示词模式: ${mode} (${modeInfo.name} - ${modeInfo.description})`)
    }
  }, [updatePromptMode])

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
      // Tab 键 - 切换沉浸模式（全局有效）
      if (event.key === 'Tab') {
        console.log('🎯 Tab键触发 - 切换沉浸模式')
        toggleImmersiveMode()
        event.preventDefault()
        return
      }

      // 检查是否在输入框中,如果是则不处理其他快捷键
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
    console.log('✅ 键盘快捷键已初始化 (0-5切换提示词模式, Command/Ctrl打破沉默, Tab切换沉浸模式)')

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [websocket.isConnected, changePromptMode, toggleImmersiveMode])

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
      // 创建一个新的空消息，使用唯一 ID
      addMessage({
        type: 'bot',
        content: '',
        id: `bot-message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // 使用时间戳+随机字符串生成唯一 ID
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

    // 处理 TTS 音频片段（流式）
    const handleTTSAudio = (data) => {
      if (data.audio_data && data.order) {
        audio.playTTSAudioChunk(data.audio_data, data.format || 'mp3', data.order)
      } else if (data.audio_data) {
        // 兼容没有顺序号的情况
        audio.playTTSAudio(data.audio_data, data.format || 'mp3')
      }
    }

    // 处理 TTS 音频（非流式回退方案）
    const handleTTSAudioFallback = (data) => {
      console.log('🎵 收到TTS音频（回退模式）')
      if (data.audio_data) {
        audio.playTTSAudio(data.audio_data, data.format || 'mp3')
      }
    }

    // 处理主动对话响应
    const handleProactiveChatResponse = (data) => {
      console.log('💬 收到主动对话响应')
      // 主动对话会通过正常的 generation 流程返回
      // 这里可以添加特殊的UI标识，比如显示一个图标表示这是AI主动发起的对话
      if (data.message) {
        toast.info('AI 主动发起对话')
      }
    }

    // 处理 TTS 完成
    const handleTTSComplete = () => {
      audio.onTTSComplete()
    }

    // 处理提示词模式信息
    const handlePromptModeInfo = (data) => {
      console.log('📋 收到提示词模式信息:', data.mode_info)
      // 更新提示词模式显示
      updatePromptModeDisplay(data.mode, data.mode_info)
    }

    // 处理初始化成功
    const handleInitSuccess = (data) => {
      console.log('✅ 用户初始化成功:', data.user_id)
      toast.success('连接成功')
    }

    // 处理 TTS 设置请求
    const handleRequestTTSSettings = () => {
      console.log('🔄 收到TTS设置同步请求')
      // 发送当前的TTS设置到后端
      websocket.sendMessage({
        type: 'sync_tts_settings',
        voice: currentVoice,
        speed: currentSpeed
      })
    }

    // 处理 ASR 切换成功/失败
    const handleASRChangeSuccess = (data) => {
      console.log('✅ ASR切换成功:', data.asr_type)
      toast.success(data.message || 'ASR切换成功')
    }

    const handleASRChangeError = (data) => {
      console.error('❌ ASR切换失败:', data.error)
      toast.error(`ASR切换失败: ${data.error}`)
    }

    // 处理提示词模式切换成功/失败
    const handlePromptModeChangeSuccess = (data) => {
      console.log('✅ 提示词模式切换成功:', data.mode, data.mode_info)

      // 显示通知
      toast.success(data.message || '提示词模式切换成功')

      // 更新提示词模式显示
      updatePromptModeDisplay(data.mode, data.mode_info)
    }

    const handlePromptModeChangeError = (data) => {
      console.error('❌ 提示词模式切换失败:', data.error)
      toast.error(`提示词模式切换失败: ${data.error}`)
    }

    // 处理搜索状态
    const handleSearchStart = (data) => {
      console.log('🔍 搜索开始:', data.query)
      setIsSearching(true)
      setSearchQuery(data.query || '')
    }

    const handleSearchComplete = () => {
      console.log('✅ 搜索完成')
      setIsSearching(false)
      setSearchQuery('')
    }

    const handleSearchError = (data) => {
      console.error('❌ 搜索错误:', data.error)
      setIsSearching(false)
      setSearchQuery('')
      toast.error(`搜索失败: ${data.error}`)
    }

    // 处理深度思考状态
    const handleThinkingToggled = (data) => {
      console.log('🧠 深度思考模式:', data.enabled ? '已开启' : '已关闭')
      toast.success(data.enabled ? '深度思考模式已开启' : '深度思考模式已关闭')
    }

    const handleThinkingError = (data) => {
      console.error('❌ 深度思考切换失败:', data.error)
      toast.error(`深度思考切换失败: ${data.error}`)
    }

    // 处理音色切换成功/失败
    const handleVoiceChangeSuccess = (data) => {
      console.log('🎵 音色切换成功:', data.voice)
      toast.success(data.message || '音色切换成功')
    }

    const handleVoiceChangeError = (data) => {
      console.error('❌ 音色切换失败:', data.error)
      toast.error(`音色切换失败: ${data.error}`)
    }

    // 处理语速调节成功/失败
    const handleSpeedChangeSuccess = (data) => {
      console.log('🎚️ 语速调节成功:', data.speed)
      toast.success(data.message || '语速调节成功')
    }

    const handleSpeedChangeError = (data) => {
      console.error('❌ 语速调节失败:', data.error)
      toast.error(`语速调节失败: ${data.error}`)
    }

    // 处理 ASR 识别状态
    const handleASRStarted = () => {
      console.log('🎤 ASR识别已开始')
      setAsrStatus({ isRecording: true, text: '', isFinal: false })
    }

    const handleASRResult = (data) => {
      console.log('🎤 ASR识别结果:', data.text, '(final:', data.is_final, ')')
      setAsrStatus({
        isRecording: !data.is_final,
        text: data.text || '',
        isFinal: data.is_final || false
      })
    }

    const handleASRStopped = () => {
      console.log('🎤 ASR识别已停止')
      setAsrStatus({ isRecording: false, text: '', isFinal: false })
    }

    const handleASRError = (data) => {
      console.error('❌ ASR识别错误:', data.error)
      setAsrStatus({ isRecording: false, text: '', isFinal: false })
      toast.error(`ASR识别错误: ${data.error}`)
    }

    // 处理错误消息
    const handleError = (data) => {
      console.error('❌ 错误:', data.error)
      setIsTyping(false)
      toast.error(data.error || '发生错误')
    }

    // 注册事件监听
    websocket.on('generation_start', handleGenerationStart)
    websocket.on('generation_chunk', handleGenerationChunk)
    websocket.on('generation_end', handleGenerationEnd)
    websocket.on('tts_audio_chunk', handleTTSAudio)
    websocket.on('tts_audio', handleTTSAudioFallback)
    websocket.on('tts_complete', handleTTSComplete)
    websocket.on('prompt_mode_info', handlePromptModeInfo)
    websocket.on('proactive_chat_response', handleProactiveChatResponse)
    websocket.on('init_success', handleInitSuccess)
    websocket.on('request_tts_settings', handleRequestTTSSettings)
    websocket.on('asr_change_success', handleASRChangeSuccess)
    websocket.on('asr_change_error', handleASRChangeError)
    websocket.on('prompt_mode_change_success', handlePromptModeChangeSuccess)
    websocket.on('prompt_mode_change_error', handlePromptModeChangeError)
    websocket.on('search_start', handleSearchStart)
    websocket.on('search_complete', handleSearchComplete)
    websocket.on('search_error', handleSearchError)
    websocket.on('thinking_toggled', handleThinkingToggled)
    websocket.on('thinking_error', handleThinkingError)
    websocket.on('voice_change_success', handleVoiceChangeSuccess)
    websocket.on('voice_change_error', handleVoiceChangeError)
    websocket.on('speed_change_success', handleSpeedChangeSuccess)
    websocket.on('speed_change_error', handleSpeedChangeError)
    websocket.on('asr_started', handleASRStarted)
    websocket.on('asr_result', handleASRResult)
    websocket.on('asr_stopped', handleASRStopped)
    websocket.on('asr_error', handleASRError)
    websocket.on('error', handleError)

    return () => {
      websocket.off('generation_start', handleGenerationStart)
      websocket.off('generation_chunk', handleGenerationChunk)
      websocket.off('generation_end', handleGenerationEnd)
      websocket.off('tts_audio_chunk', handleTTSAudio)
      websocket.off('tts_audio', handleTTSAudioFallback)
      websocket.off('tts_complete', handleTTSComplete)
      websocket.off('prompt_mode_info', handlePromptModeInfo)
      websocket.off('proactive_chat_response', handleProactiveChatResponse)
      websocket.off('init_success', handleInitSuccess)
      websocket.off('request_tts_settings', handleRequestTTSSettings)
      websocket.off('asr_change_success', handleASRChangeSuccess)
      websocket.off('asr_change_error', handleASRChangeError)
      websocket.off('prompt_mode_change_success', handlePromptModeChangeSuccess)
      websocket.off('prompt_mode_change_error', handlePromptModeChangeError)
      websocket.off('search_start', handleSearchStart)
      websocket.off('search_complete', handleSearchComplete)
      websocket.off('search_error', handleSearchError)
      websocket.off('thinking_toggled', handleThinkingToggled)
      websocket.off('thinking_error', handleThinkingError)
      websocket.off('voice_change_success', handleVoiceChangeSuccess)
      websocket.off('voice_change_error', handleVoiceChangeError)
      websocket.off('speed_change_success', handleSpeedChangeSuccess)
      websocket.off('speed_change_error', handleSpeedChangeError)
      websocket.off('asr_started', handleASRStarted)
      websocket.off('asr_result', handleASRResult)
      websocket.off('asr_stopped', handleASRStopped)
      websocket.off('asr_error', handleASRError)
      websocket.off('error', handleError)
    }
  }, [websocket, audio, addMessage, setIsTyping, setCurrentBotMessage, updatePromptModeDisplay, messages, toast, setIsSearching, setSearchQuery, setAsrStatus, currentVoice, currentSpeed])



  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Search Indicator */}
      <SearchIndicator isSearching={isSearching} query={searchQuery} />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      {/* Header */}
      <header className="border-b border-[#ececec] rounded-3xl shadow-lg sticky top-0 z-[1] h-[5rem]">
        <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400/90 to-pink-400/90 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">悠悠</h1>
              <p className="text-xs text-gray-500/80">AI情感陪伴数字人智能对话系统</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full">
              <div className={`w-2 h-2 rounded-full ${websocket.isConnected ? 'bg-green-500' : 'bg-red-400'} ${websocket.isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-gray-600 font-medium">
                {websocket.isConnected ? '已连接' : '未连接'}
              </span>
            </div>

            {session.isLoggedIn ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400/90 to-cyan-400/90 hover:from-blue-500/90 hover:to-cyan-500/90 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                title="登录"
              >
                <LogIn className="w-4.5 h-4.5 text-white" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 h-[calc(100vh-5rem)] ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full"
            >
              <ChatContainer isImmersiveMode={isImmersiveMode} />
              <ChatInput />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live2D Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full h-full rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden"
            >
              <Live2DViewer />
            </motion.div>

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
