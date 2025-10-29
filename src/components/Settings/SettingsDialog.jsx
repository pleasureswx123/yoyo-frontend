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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">设置</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 音色选择器 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">音色选择</h3>
                </div>

                <select
                  value={currentVoice}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all mb-3"
                >
                  {voiceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="text-sm text-gray-600 mb-4">
                  当前: {voiceOptions.find(v => v.value === currentVoice)?.label}
                </div>

                {/* 语速调节 */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">语速调节</div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={currentSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>慢</span>
                    <span>正常</span>
                    <span>快</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    当前: {currentSpeed}x
                  </div>
                </div>
              </div>

              {/* 提示词模式显示器 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">提示词模式</h3>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="text-lg font-semibold text-purple-600">
                    模式 {currentPromptMode}: {promptModeInfo[currentPromptMode]?.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {promptModeInfo[currentPromptMode]?.description}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  使用键盘 0-5 快速切换模式：
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(promptModeInfo).map(([mode, info]) => (
                    <button
                      key={mode}
                      onClick={() => handlePromptModeChange(parseInt(mode))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPromptMode === parseInt(mode)
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-purple-100'
                      }`}
                    >
                      {mode}: {info.description}
                    </button>
                  ))}
                </div>
              </div>

              {/* 情感状态选择器 */}
              <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border border-pink-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">当前情感</h3>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-pink-600 mb-1">
                    {currentEmotion}
                  </div>
                  <div className="text-sm text-gray-600">
                    {emotionDescriptions[currentEmotion] || '未知'}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-2">最近情感变化：</div>
                <div className="space-y-2">
                  {emotionHistory.length > 0 ? (
                    emotionHistory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-700">
                          {emotionDescriptions[item.emotion] || item.emotion}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {item.time.toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-4">
                      暂无情感变化记录
                    </div>
                  )}
                </div>
              </div>

              {/* 沉默时间设置 */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">智能主动对话</h3>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  AI会在初始化和沉默时自动开启对话
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    沉默触发时间: <span className="text-orange-600 font-bold">{silenceTimeout}</span> 秒
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={silenceTimeout}
                    onChange={(e) => setSilenceTimeout(parseInt(e.target.value))}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer mb-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>5秒</span>
                    <span>60秒</span>
                    <span>120秒</span>
                  </div>
                  <button
                    onClick={handleApplySilenceTimeout}
                    disabled={isSavingSilence}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingSilence ? '保存中...' : '应用设置'}
                  </button>
                </div>

                <div className="bg-white rounded-lg px-4 py-3 text-sm text-gray-600">
                  智能对话: 已启用 ({silenceTimeout}秒触发)
                </div>
              </div>

              {/* 性能监测面板 */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">⚡ 性能监测</h3>
                </div>

                <div className="space-y-3">
                  {/* LLM首字响应 */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">LLM首字响应</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        performanceMetrics.llmStatus === '已完成' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {performanceMetrics.llmStatus}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {performanceMetrics.llmFirstTokenTime}
                    </div>
                  </div>

                  {/* TTS首包回复 */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">TTS首包回复</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        performanceMetrics.ttsStatus === '已完成' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {performanceMetrics.ttsStatus}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {performanceMetrics.ttsFirstPacketTime}
                    </div>
                  </div>

                  {/* 端到端延迟 */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">端到端延迟</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        performanceMetrics.e2eStatus === '已完成' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {performanceMetrics.e2eStatus}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {performanceMetrics.endToEndTime}
                    </div>
                  </div>
                </div>

                {/*<button
                  onClick={handleResetPerformance}
                  className="w-full mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                >
                  🔄 重置统计
                </button>*/}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

