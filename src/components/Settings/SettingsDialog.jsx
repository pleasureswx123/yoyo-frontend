import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, MessageSquare, Heart, Activity } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

/**
 * 设置对话框组件
 */
export function SettingsDialog({ isOpen, onClose }) {
  const { websocket, session } = useApp()

  // 音色选择
  const [currentVoice, setCurrentVoice] = useState('zh_female_meilinvyou_emo_v2_mars_bigtts')
  const [currentSpeed, setCurrentSpeed] = useState(1.2)

  // 提示词模式
  const [currentPromptMode, setCurrentPromptMode] = useState(0)

  // 情感状态
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [emotionHistory, setEmotionHistory] = useState([])

  // 沉默时间设置
  const [silenceTimeout, setSilenceTimeout] = useState(30)
  const [isSavingSilence, setIsSavingSilence] = useState(false)

  // 性能监测
  const [performanceMetrics, setPerformanceMetrics] = useState({
    llmFirstTokenTime: '--',
    ttsFirstPacketTime: '--',
    endToEndTime: '--',
    llmStatus: '等待中',
    ttsStatus: '等待中',
    e2eStatus: '等待中'
  })

  // 音色选项
  const voiceOptions = [
    { value: 'zh_female_meilinvyou_emo_v2_mars_bigtts', label: '魅力女友 (默认)' },
    { value: 'zh_female_roumeinvyou_emo_v2_mars_bigtts', label: '柔美女友' }
  ]

  // 提示词模式信息
  const promptModeInfo = {
    0: { name: 'neutral', description: '中性状态' },
    1: { name: 'fast', description: '兴奋畅聊状态' },
    2: { name: 'backchannel-rich', description: '倾听回应状态' },
    3: { name: 'furious', description: '愤怒状态' },
    4: { name: 'focused-reflective', description: '专注反思状态' },
    5: { name: 'emotional-slow', description: '情感慢节奏状态' }
  }

  // 情感描述映射
  const emotionDescriptions = {
    'happy': '开心',
    'sad': '悲伤',
    'angry': '愤怒',
    'surprised': '惊讶',
    'fear': '恐惧',
    'disgust': '厌恶',
    'contempt': '轻蔑',
    'neutral': '中性'
  }

  // 监听 WebSocket 消息
  useEffect(() => {
    if (!websocket.isConnected) return

    const handlePromptModeChange = (data) => {
      if (data.mode !== undefined) {
        setCurrentPromptMode(data.mode)
        console.log('✅ 提示词模式已更新:', data.mode, data.mode_info)
      }
    }

    const handleEmotionUpdate = (data) => {
      if (data.emotion) {
        setCurrentEmotion(data.emotion)
        setEmotionHistory(prev => {
          const newHistory = [{ emotion: data.emotion, time: new Date() }, ...prev]
          return newHistory.slice(0, 5) // 只保留最近5条
        })
        console.log('✅ 情感状态已更新:', data.emotion)
      }
    }

    const handlePerformanceUpdate = (data) => {
      // 更新性能指标
      setPerformanceMetrics(prev => ({
        ...prev,
        ...data
      }))
    }

    websocket.on('prompt_mode_change_success', handlePromptModeChange)
    websocket.on('prompt_mode_info', handlePromptModeChange)
    websocket.on('emotion_update', handleEmotionUpdate)
    websocket.on('performance_update', handlePerformanceUpdate)

    return () => {
      websocket.off('prompt_mode_change_success', handlePromptModeChange)
      websocket.off('prompt_mode_info', handlePromptModeChange)
      websocket.off('emotion_update', handleEmotionUpdate)
      websocket.off('performance_update', handlePerformanceUpdate)
    }
  }, [websocket])

  // 切换音色
  const handleVoiceChange = (voice) => {
    setCurrentVoice(voice)
    if (websocket.isConnected) {
      const success = websocket.sendMessage({
        type: 'change_voice',
        voice: voice
      })
      if (success) {
        console.log('🎵 切换音色:', voice)
      }
    }
  }

  // 加载沉默时间设置
  useEffect(() => {
    const loadSilenceTimeout = async () => {
      if (!session.userId) return

      try {
        const response = await fetch(`/api/proactive/silence-timeout/${session.userId}`)
        if (response.ok) {
          const result = await response.json()
          setSilenceTimeout(result.silence_timeout)
          console.log(`✅ 加载沉默时间设置: ${result.silence_timeout}秒`)
        }
      } catch (error) {
        console.error('❌ 加载沉默时间设置失败:', error)
      }
    }

    if (isOpen && session.userId) {
      loadSilenceTimeout()
    }
  }, [isOpen, session.userId])

  // 切换语速
  const handleSpeedChange = (speed) => {
    setCurrentSpeed(speed)
    if (websocket.isConnected) {
      const success = websocket.sendMessage({
        type: 'change_speed',
        speed: speed
      })
      if (success) {
        console.log('⚡ 切换语速:', speed)
      }
    }
  }

  // 切换提示词模式
  const handlePromptModeChange = (mode) => {
    if (mode >= 0 && mode <= 5) {
      if (websocket.isConnected) {
        const success = websocket.sendMessage({
          type: 'change_prompt_mode',
          mode: mode
        })
        if (success) {
          console.log('🎯 切换提示词模式:', mode)
        }
      } else {
        console.error('WebSocket未连接，无法切换提示词模式')
      }
    }
  }

  // 应用沉默时间设置
  const handleApplySilenceTimeout = async () => {
    if (!session.userId) {
      console.log('❌ 无用户ID，无法设置沉默时间')
      return
    }

    setIsSavingSilence(true)

    try {
      const response = await fetch(`/api/proactive/silence-timeout/${session.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeout: silenceTimeout })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ 沉默时间设置成功: ${silenceTimeout}秒`)
      } else {
        const error = await response.json()
        console.error('❌ 设置沉默时间失败:', error.error)
      }
    } catch (error) {
      console.error('❌ 设置沉默时间请求失败:', error)
    } finally {
      setIsSavingSilence(false)
    }
  }

  // 重置性能监测
  const handleResetPerformance = () => {
    setPerformanceMetrics({
      llmFirstTokenTime: '--',
      ttsFirstPacketTime: '--',
      endToEndTime: '--',
      llmStatus: '等待中',
      ttsStatus: '等待中',
      e2eStatus: '等待中'
    })
    console.log('🔄 性能监测数据已重置')
  }

  // ESC 键关闭弹窗
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('🎯 ESC键触发 - 关闭设置弹窗')
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscKey)
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed w-full min-h-dvh inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">设置</h2>
                <p className="text-sm text-gray-500 mt-1">调整您的偏好设置</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* 音色设置 */}
              <div className="bg-gray-100/80 rounded-2xl p-5">
                <h3 className="text-base font-medium text-gray-900 mb-4">音色设置</h3>

                <div className="space-y-4">
                  {/* 音色选择 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">音色</span>
                    </div>
                    <select
                      value={currentVoice}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-gray-400 focus:outline-none transition-colors"
                    >
                      {voiceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 语速调节 */}
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0 pt-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">语速</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={currentSpeed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0.5x</span>
                        <span className="font-medium text-gray-700">{currentSpeed}x</span>
                        <span>2.0x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 提示词模式 */}
              <div className="bg-gray-100/80 rounded-2xl p-5">
                <h3 className="text-base font-medium text-gray-900 mb-4">提示词模式</h3>

                <div className="space-y-4">
                  {/* 当前模式显示 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">当前模式</span>
                    </div>
                    <div className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        模式 {currentPromptMode}: {promptModeInfo[currentPromptMode]?.description}
                      </div>
                    </div>
                  </div>

                  {/* 模式切换按钮 */}
                  <div className="pt-2">
                    <div className="text-xs text-gray-500 mb-3">快速切换 (键盘 0-5):</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(promptModeInfo).map(([mode, info]) => (
                        <button
                          key={mode}
                          onClick={() => handlePromptModeChange(parseInt(mode))}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            currentPromptMode === parseInt(mode)
                              ? 'bg-gray-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {mode}: {info.description}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 情感状态 */}
              <div className="bg-gray-100/80 rounded-2xl p-5">
                <h3 className="text-base font-medium text-gray-900 mb-4">情感状态</h3>

                <div className="space-y-4">
                  {/* 当前情感 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">当前情感</span>
                    </div>
                    <div className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">
                        {emotionDescriptions[currentEmotion] || currentEmotion}
                      </span>
                    </div>
                  </div>

                  {/* 情感历史 */}
                  {emotionHistory.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs text-gray-500 mb-2">最近变化:</div>
                      <div className="space-y-1.5">
                        {emotionHistory.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg text-xs">
                            <span className="text-gray-700">
                              {emotionDescriptions[item.emotion] || item.emotion}
                            </span>
                            <span className="text-gray-400">
                              {item.time.toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 智能对话设置 */}
              <div className="bg-gray-100/80 rounded-2xl p-5">
                <h3 className="text-base font-medium text-gray-900 mb-4">智能主动对话</h3>

                <div className="space-y-4">
                  {/* 沉默触发时间 */}
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0 pt-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">触发时间</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={silenceTimeout}
                        onChange={(e) => setSilenceTimeout(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>5秒</span>
                        <span className="font-medium text-gray-700">{silenceTimeout}秒</span>
                        <span>120秒</span>
                      </div>
                    </div>
                  </div>

                  {/* 应用按钮 */}
                  <div className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0"></div>
                    <button
                      onClick={handleApplySilenceTimeout}
                      disabled={isSavingSilence}
                      className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                      {isSavingSilence ? '保存中...' : '应用设置'}
                    </button>
                  </div>

                  {/* 说明文字 */}
                  <div className="flex items-start gap-4">
                    <div className="w-32 flex-shrink-0"></div>
                    <p className="flex-1 text-xs text-gray-500">
                      AI 会在初始化和沉默 {silenceTimeout} 秒后自动开启对话
                    </p>
                  </div>
                </div>
              </div>

              {/* 性能监测 */}
              <div className="bg-gray-100/80 rounded-2xl p-5">
                <h3 className="text-base font-medium text-gray-900 mb-4">性能监测</h3>

                <div className="space-y-3">
                  {/* LLM首字响应 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">LLM响应</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">
                        {performanceMetrics.llmFirstTokenTime}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        performanceMetrics.llmStatus === '已完成'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {performanceMetrics.llmStatus}
                      </span>
                    </div>
                  </div>

                  {/* TTS首包回复 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">TTS首包</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">
                        {performanceMetrics.ttsFirstPacketTime}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        performanceMetrics.ttsStatus === '已完成'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {performanceMetrics.ttsStatus}
                      </span>
                    </div>
                  </div>

                  {/* 端到端延迟 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">端到端</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">
                        {performanceMetrics.endToEndTime}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        performanceMetrics.e2eStatus === '已完成'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {performanceMetrics.e2eStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

