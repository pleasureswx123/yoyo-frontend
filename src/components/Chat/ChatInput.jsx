import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Mic, Paperclip, CornerDownLeft } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

/**
 * 聊天输入组件
 * 参考 UI 图设计:
 * - 左侧: 附件按钮 + 麦克风按钮
 * - 中间: 多行文本输入框
 * - 右侧: Send Message 按钮
 */
export function ChatInput() {
  const { sendChatMessage, audio, websocket } = useApp()
  const [inputValue, setInputValue] = useState('')
  const [isSpaceKeyPressed, setIsSpaceKeyPressed] = useState(false)
  const [spaceKeyTimer, setSpaceKeyTimer] = useState(null)
  const textareaRef = useRef(null)

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return

    sendChatMessage(inputValue.trim())
    setInputValue('')

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 自动调整 textarea 高度
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }

  // 监听输入变化,自动调整高度
  useEffect(() => {
    autoResizeTextarea()
  }, [inputValue])

  // 空格键长按录音
  const handleSpaceKeyDown = useCallback(async (e) => {
    if (e.code !== 'Space' || isSpaceKeyPressed) return
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    e.preventDefault()
    setIsSpaceKeyPressed(true)

    const timer = setTimeout(async () => {
      console.log('🎤 开始录音')
      try {
        await audio.startRecording((audioData) => {
          // 发送音频数据到后端
          if (websocket.isConnected) {
            websocket.sendMessage({
              type: 'audio_data',
              data: Array.from(new Uint8Array(audioData))
            })
          }
        })

        // 通知后端开始 ASR
        websocket.sendMessage({ type: 'start_asr' })
      } catch (error) {
        console.error('录音失败:', error)
      }
    }, 400) // 长按 0.4 秒

    setSpaceKeyTimer(timer)
  }, [isSpaceKeyPressed, audio, websocket])

  const handleSpaceKeyUp = useCallback(async () => {
    if (!isSpaceKeyPressed) return

    setIsSpaceKeyPressed(false)

    if (spaceKeyTimer) {
      clearTimeout(spaceKeyTimer)
      setSpaceKeyTimer(null)
    }

    if (audio.isRecording) {
      console.log('🎤 停止录音')
      await audio.stopRecording()

      // 通知后端停止 ASR
      websocket.sendMessage({ type: 'stop_asr' })
    }
  }, [isSpaceKeyPressed, spaceKeyTimer, audio, websocket])

  // 监听键盘事件
  useEffect(() => {
    window.addEventListener('keydown', handleSpaceKeyDown)
    window.addEventListener('keyup', handleSpaceKeyUp)

    return () => {
      window.removeEventListener('keydown', handleSpaceKeyDown)
      window.removeEventListener('keyup', handleSpaceKeyUp)
    }
  }, [handleSpaceKeyDown, handleSpaceKeyUp])

  // 监听 ASR 结果
  useEffect(() => {
    const handleASRResult = (data) => {
      if (data.text) {
        setInputValue(data.text)
        audio.setAsrText(data.text)
      }
    }

    websocket.on('asr_result', handleASRResult)

    return () => {
      websocket.off('asr_result', handleASRResult)
    }
  }, [websocket, audio])

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* ASR 状态提示 */}
        {audio.isRecording && (
          <div className="mb-3 text-sm text-red-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>正在录音... (松开空格键结束)</span>
          </div>
        )}

        {audio.asrText && !audio.isRecording && (
          <div className="mb-3 text-sm text-green-600">
            识别结果: {audio.asrText}
          </div>
        )}

        {/* 输入区域 */}
        <div className="flex items-end gap-3">
          {/* 左侧按钮组 */}
          <div className="flex items-center gap-2">
            {/* 附件按钮 */}
            <button
              className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="附件"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* 麦克风按钮 */}
            <button
              className={`p-2.5 rounded-lg transition-colors ${
                audio.isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="长按空格键进行语音输入"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* 文本输入框 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />

            {/* 提示文字 */}
            {!inputValue && (
              <div className="absolute right-4 bottom-3 text-xs text-gray-400 pointer-events-none">
                长按空格键语音输入
              </div>
            )}
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md disabled:shadow-none"
          >
            <span>Send Message</span>
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

