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
  const [bestASRText, setBestASRText] = useState('')
  const [isASRStarting, setIsASRStarting] = useState(false) // 标记ASR是否正在启动
  const textareaRef = useRef(null)
  const inputRef = useRef(null)

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

  // 开始 ASR 录音（通用函数）
  const startASR = useCallback(async () => {
    // 如果已经在录音或正在启动，忽略
    if (audio.isRecording || isASRStarting) {
      console.log('🎤 ASR已在进行中或正在启动，忽略')
      return
    }

    try {
      setIsASRStarting(true)
      setBestASRText('')
      console.log('🎤 开始ASR录音')
      debugger

      await audio.startRecording((audioData) => {
        if (websocket.isConnected) {
          debugger
          const pcm16 = new Int16Array(audioData)
          const base64String = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)))
          console.log('🎤 发送PCM音频数据块:', base64String.length, 'chars')
          websocket.sendMessage({
            type: 'audio_chunk',
            audio_data: base64String
          })
        }
      })

      websocket.sendMessage({ type: 'start_asr' })
      debugger
      console.log('✅ ASR 已启动，已发送 start_asr 消息')
      setIsASRStarting(false)
    } catch (error) {
      console.error('❌ 启动ASR失败:', error)
      setIsASRStarting(false)
    }
  }, [audio, websocket, isASRStarting])

  // 停止 ASR 录音（通用函数）
  const stopASR = useCallback(async () => {
    // 如果未在录音且未在启动中，忽略
    if (!audio.isRecording && !isASRStarting) {
      console.log('🎤 ASR未在进行中，跳过')
      return
    }

    // 如果正在启动，等待启动完成
    if (isASRStarting) {
      console.log('🎤 ASR正在启动，等待启动完成...')
      // 等待最多1秒让ASR启动完成
      let waitCount = 0
      while (isASRStarting && waitCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waitCount++
      }
    }

    // 再次检查是否在录音
    if (!audio.isRecording) {
      console.log('🎤 ASR未在录音状态，跳过停止')
      return
    }

    try {
      console.log('🎤 停止ASR录音')
      await audio.stopRecording()

      // 通知后端停止 ASR
      websocket.sendMessage({ type: 'stop_asr' })
      console.log('🎤 已发送 stop_asr 消息')

      // 等待一小段时间让ASR处理完最后的结果
      setTimeout(() => {
        console.log('🎤 检查ASR结果，bestASRText:', bestASRText)

        // 如果有识别结果，自动发送消息
        if (bestASRText && bestASRText.trim()) {
          console.log('🎤 ASR完成，发送结果:', bestASRText)
          setInputValue(bestASRText.trim())

          // 自动发送消息
          setTimeout(() => {
            handleSend()
          }, 100)
        } else {
          console.log('🎤 ASR无有效结果')
        }
      }, 500) // 等待500ms让ASR完成最后的处理
    } catch (error) {
      console.error('❌ 停止ASR失败:', error)
    }
  }, [audio, websocket, bestASRText, handleSend, isASRStarting])



  // 麦克风按钮鼠标按下事件
  const handleMicMouseDown = useCallback(async (e) => {
    e.preventDefault()
    console.log('🎤 麦克风按钮按下')
    await startASR()
  }, [startASR])

  // 麦克风按钮鼠标松开事件
  const handleMicMouseUp = useCallback(async (e) => {
    e.preventDefault()
    console.log('🎤 麦克风按钮松开')
    await stopASR()
  }, [stopASR])

  // 麦克风按钮鼠标离开事件（防止用户拖出按钮）
  const handleMicMouseLeave = useCallback(async () => {
    if (audio.isRecording) {
      console.log('🎤 鼠标离开麦克风按钮，停止录音')
      await stopASR()
    }
  }, [audio.isRecording, stopASR])



  // 监听 ASR 结果
  useEffect(() => {
    const handleASRResult = (data) => {
      console.log('🎤 收到ASR识别结果:', data.text, '(final:', data.is_final, ')')

      if (data.text) {
        // 实时更新输入框
        setInputValue(data.text)
        audio.setAsrText(data.text)

        // 更新最佳结果（如果当前结果更长或更有意义）
        if (data.text.trim() && (data.text.length > bestASRText.length || !bestASRText)) {
          // 过滤掉单独的标点符号
          if (data.text.trim() !== '。' && data.text.trim() !== '，' &&
              data.text.trim() !== '？' && data.text.trim() !== '！') {
            setBestASRText(data.text)
            console.log('🎤 更新最佳ASR结果:', data.text)
          }
        }
      }
    }

    websocket.on('asr_result', handleASRResult)

    return () => {
      websocket.off('asr_result', handleASRResult)
    }
  }, [websocket, audio, bestASRText])

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* ASR 状态提示 */}
        {audio.isRecording && (
          <div className="mb-3 text-sm text-red-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>正在录音... (松开按钮结束)</span>
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

            {/* 麦克风按钮 - 按住说话 */}
            <button
              onMouseDown={handleMicMouseDown}
              onMouseUp={handleMicMouseUp}
              onMouseLeave={handleMicMouseLeave}
              className={`p-2.5 rounded-lg transition-colors select-none ${
                audio.isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="按住说话"
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
                按住麦克风说话
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

