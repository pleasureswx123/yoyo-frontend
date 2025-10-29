import { createContext, useContext, useState, useCallback } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useSession } from '../hooks/useSession'
import { useAudio } from '../hooks/useAudio'

/**
 * 应用全局状态 Context
 */
const AppContext = createContext(null)

export function AppProvider({ children }) {
  // 使用自定义 Hooks
  const websocket = useWebSocket()
  const session = useSession()
  const audio = useAudio()

  // 聊天相关状态
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentBotMessage, setCurrentBotMessage] = useState(null)

  // 用户档案相关状态
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [conversationStage, setConversationStage] = useState('greeting')
  const [emotion, setEmotion] = useState(null)

  // 系统状态
  const [systemStatus, setSystemStatus] = useState({
    llm: 'normal',
    tts: 'normal',
    asr: 'normal'
  })

  // 设置相关状态
  const [currentVoice, setCurrentVoice] = useState('zh_female_meilinvyou_emo_v2_mars_bigtts')
  const [currentSpeed, setCurrentSpeed] = useState(1.2)
  const [currentASR, setCurrentASR] = useState('xfyun')
  const [promptMode, setPromptMode] = useState(0)
  const [isImmersiveMode, setIsImmersiveMode] = useState(false)

  // 添加消息
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: message.id || Date.now(),
      timestamp: message.timestamp || new Date()
    }])
  }, [])

  // 更新最后一条消息
  const updateLastMessage = useCallback((updates) => {
    setMessages(prev => {
      const newMessages = [...prev]
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          ...updates
        }
      }
      return newMessages
    })
  }, [])

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 发送消息
  const sendChatMessage = useCallback((content, file = null) => {
    if (!websocket.isConnected) {
      console.error('WebSocket 未连接')
      return false
    }

    // 停止当前 TTS 播放
    audio.stopAllTTS()

    // 添加用户消息到界面
    addMessage({
      type: 'user',
      content,
      file
    })

    // 发送到后端
    const success = websocket.sendMessage({
      type: 'chat',
      message: content,
      user_id: session.userId,
      file: file ? {
        name: file.name,
        type: file.type,
        data: file.data
      } : null
    })

    if (success) {
      // 增加对话计数
      session.incrementConversationCount()
    }

    return success
  }, [websocket, audio, session, addMessage])

  // 切换语音
  const changeVoice = useCallback((voice) => {
    setCurrentVoice(voice)
    websocket.sendMessage({
      type: 'change_voice',
      voice
    })
  }, [websocket])

  // 切换语速
  const changeSpeed = useCallback((speed) => {
    setCurrentSpeed(speed)
    websocket.sendMessage({
      type: 'change_speed',
      speed
    })
  }, [websocket])

  // 切换 ASR
  const changeASR = useCallback((asrType) => {
    setCurrentASR(asrType)
    websocket.sendMessage({
      type: 'change_asr',
      asr_type: asrType
    })
  }, [websocket])

  // 切换提示词模式
  const changePromptMode = useCallback((mode) => {
    setPromptMode(mode)
    websocket.sendMessage({
      type: 'change_prompt_mode',
      mode
    })
  }, [websocket])

  // 切换沉浸模式
  const toggleImmersiveMode = useCallback(() => {
    setIsImmersiveMode(prev => !prev)
  }, [])

  const value = {
    // WebSocket
    websocket,
    
    // Session
    session,
    
    // Audio
    audio,
    
    // Messages
    messages,
    setMessages,
    addMessage,
    updateLastMessage,
    clearMessages,
    sendChatMessage,
    
    // Typing
    isTyping,
    setIsTyping,
    currentBotMessage,
    setCurrentBotMessage,
    
    // Profile
    profileCompletion,
    setProfileCompletion,
    conversationStage,
    setConversationStage,
    emotion,
    setEmotion,
    
    // System Status
    systemStatus,
    setSystemStatus,
    
    // Settings
    currentVoice,
    changeVoice,
    currentSpeed,
    changeSpeed,
    currentASR,
    changeASR,
    promptMode,
    changePromptMode,
    isImmersiveMode,
    toggleImmersiveMode
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

