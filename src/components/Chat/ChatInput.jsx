import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Mic, Paperclip, Brain, Search, X, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

/**
 * 聊天输入组件
 * 参考 UI 图设计:
 * - 左侧: 附件按钮 + 麦克风按钮
 * - 中间: 多行文本输入框
 * - 右侧: Send Message 按钮
 */
export function ChatInput() {
  const {
    sendChatMessage,
    audio,
    websocket,
    isThinkingEnabled,
    toggleThinking,
    isSearchEnabled,
    toggleSearch,
    currentFile,
    setCurrentFile,
    isUploading
  } = useApp()
  const [inputValue, setInputValue] = useState('')
  const [filePreviewUrl, setFilePreviewUrl] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // 新的 ASR 状态管理
  const [finalResult, setFinalResult] = useState({isFinal: false, msg: ''})
  
  

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCurrentFile(file)

      // 如果是图片，创建预览URL
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setFilePreviewUrl(url)
      } else {
        setFilePreviewUrl(null)
      }

      console.log('📎 已选择文件:', file.name, file.type, (file.size / 1024).toFixed(1) + ' KB')
    }
  }

  // 移除文件
  const handleRemoveFile = () => {
    setCurrentFile(null)
    setFilePreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log('🗑️ 已移除文件')
  }

  // 发送消息
  const handleSend = async () => {
    debugger
    const message = inputValue.trim()
    if (!message && !currentFile) return

    await sendChatMessage(message, currentFile)
    setInputValue('')
    handleRemoveFile()

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

  // 开始 ASR 录音
  const startASR = useCallback(async () => {
    // 如果已经在录音，忽略
    if (audio.isRecording) {
      console.log('🎤 ASR已在进行中，忽略')
      return
    }

    try {
      // 1. 重置 finalResult 为默认值
      setFinalResult({isFinal: false, msg: ''})
      console.log('🎤 开始ASR录音，重置 finalResult')

      await audio.startRecording((audioData) => {
        if (websocket.isConnected) {
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
      console.log('✅ ASR 已启动，已发送 start_asr 消息')
    } catch (error) {
      console.error('❌ 启动ASR失败:', error)
    }
  }, [audio, websocket])

  // 停止 ASR 录音
  const stopASR = useCallback(async () => {
    console.log('🔍 stopASR 被调用, audio.isRecording:', audio.isRecording)

    // 如果未在录音，忽略
    if (!audio.isRecording) {
      console.log('🎤 ASR未在进行中，跳过')
      return
    }

    try {
      console.log('🎤 停止ASR录音')
      await audio.stopRecording()

      // 通知后端停止 ASR
      websocket.sendMessage({ type: 'stop_asr' })
      console.log('🎤 已发送 stop_asr 消息，等待最终结果')
    } catch (error) {
      console.error('❌ 停止ASR失败:', error)
    }
  }, [audio, websocket])



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

  // 监听 finalResult 的 isFinal 值，当为 true 时发送消息
  useEffect(() => {
    if (finalResult.isFinal && finalResult.msg.trim()) {
      console.log('✅ finalResult.isFinal 为 true，准备发送消息:', finalResult.msg)

      // 保存消息内容
      const messageToSend = finalResult.msg
      const fileToSend = currentFile

      // 立即重置 finalResult，防止重复触发
      setFinalResult({isFinal: false, msg: ''})

      // 显示在输入框
      setInputValue(messageToSend)

      // 发送消息
      sendChatMessage(messageToSend, fileToSend)

      // 清空输入框和文件
      setTimeout(() => {
        setInputValue('')
        handleRemoveFile()
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }, 100)
    }
  }, [finalResult.isFinal, finalResult.msg])



  // 监听 ASR 结果
  useEffect(() => {
    const handleASRResult = (data) => {
      console.log('🎤 收到ASR识别结果:', data.text, '(final:', data.is_final, ')')

      if (data.is_final) {
        // 2. 当 is_final 为 true 时，改变 finalResult 的 isFinal 为 true
        console.log('🎤 收到最终结果信号 (is_final=true)，设置 isFinal=true')
        setFinalResult(prev => ({
          ...prev,
          isFinal: true
        }))
      } else if (data.text) {
        // 3. 当 is_final 为 false 时，更新 finalResult 的 msg 值
        console.log('🎤 更新 finalResult.msg:', data.text)
        setFinalResult(prev => ({
          ...prev,
          msg: data.text
        }))

        // 实时更新输入框显示
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
    <div className="bg-gray-50/50 p-4">
      {/* 功能状态提示 */}
      {(isThinkingEnabled || isSearchEnabled) && (
        <div className="mb-4 flex items-center gap-2">
          {isThinkingEnabled && (
            <div className="px-3 py-1.5 bg-purple-50/80 rounded-full flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span className="text-xs font-medium text-purple-700">深度思考已启用</span>
            </div>
          )}
          {isSearchEnabled && (
            <div className="px-3 py-1.5 bg-blue-50/80 rounded-full flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="text-xs font-medium text-blue-700">联网搜索已启用</span>
            </div>
          )}
        </div>
      )}

      {/* ASR 状态提示 */}
      {audio.isRecording && (
        <div className="mb-4 px-4 py-3 bg-red-50/80 rounded-2xl flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute w-4 h-4 bg-red-400 rounded-full animate-ping opacity-75" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">正在录音中...</p>
            <p className="text-xs text-red-600/80 mt-0.5">松开麦克风按钮结束录音</p>
          </div>
        </div>
      )}

      {/*{audio.asrText && !audio.isRecording && (*/}
      {/*  <div className="mb-4 px-4 py-3 bg-green-50/80 rounded-2xl">*/}
      {/*    <p className="text-xs text-green-600/80 font-medium mb-1">识别结果</p>*/}
      {/*    <p className="text-sm text-green-900">{audio.asrText}</p>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* 文件预览 */}
      {currentFile && (
        <div className="mb-4 px-4 py-3 bg-gray-50/80 rounded-2xl flex items-center gap-3">
          {filePreviewUrl ? (
            <img
              src={filePreviewUrl}
              alt="预览"
              className="w-14 h-14 rounded-lg object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-200/80 flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{currentFile.name}</p>
            <p className="text-xs text-gray-500">{(currentFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
            title="移除文件"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 上传中提示 */}
      {isUploading && (
        <div className="mb-4 px-4 py-3 bg-blue-50/80 rounded-2xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-700">正在上传文件...</p>
        </div>
      )}

      {/* 主输入区域 */}
      <div className="relative bg-gray-100/80 rounded-3xl shadow-sm hover:shadow transition-shadow duration-200">
          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="What would you like to know?"
            rows={1}
            className="w-full px-6 pt-6 pb-16 bg-transparent border-0 resize-none focus:outline-none text-gray-800 placeholder:text-gray-500/70 text-base leading-relaxed"
            style={{ minHeight: '120px', maxHeight: '200px' }}
          />

          {/* 底部按钮栏 */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-center justify-between">
            {/* 左侧按钮组 */}
            <div className="flex items-center gap-2">
              {/* 麦克风按钮 */}
              <button
                type="button"
                onMouseDown={handleMicMouseDown}
                onMouseUp={handleMicMouseUp}
                onMouseLeave={handleMicMouseLeave}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  audio.isRecording
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200/50'
                    : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-600'
                }`}
                title="按住说话"
              >
                <Mic className={`w-5 h-5 ${audio.isRecording ? 'animate-pulse' : ''}`} />
              </button>

              {/* 附件按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-gray-200/80 hover:bg-gray-300/80 text-gray-600 flex items-center justify-center transition-all duration-200"
                title="添加附件"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* 深度思考按钮 */}
              <button
                type="button"
                onClick={toggleThinking}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isThinkingEnabled
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-200/50'
                    : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-600'
                }`}
                title={isThinkingEnabled ? '深度思考：已开启' : '深度思考：已关闭'}
              >
                <Brain className={`w-5 h-5 ${isThinkingEnabled ? 'animate-pulse' : ''}`} />
              </button>

              {/* 联网搜索按钮 */}
              <button
                type="button"
                onClick={toggleSearch}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSearchEnabled
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200/50'
                    : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-600'
                }`}
                title={isSearchEnabled ? '联网搜索：已开启' : '联网搜索：已关闭'}
              >
                <Search className={`w-5 h-5 ${isSearchEnabled ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            {/* 右侧发送按钮 */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                inputValue.trim()
                  ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
                  : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
              }`}
              title="发送消息"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
    </div>
  )
}

