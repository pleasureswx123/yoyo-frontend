import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

/**
 * ASR 状态指示器组件
 * 显示 ASR 识别状态和实时识别结果
 */
export function ASRIndicator({ asrStatus }) {
  const { isRecording, text, isFinal } = asrStatus

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40"
        >
          <div className="bg-white rounded-lg shadow-lg border border-red-200 px-4 py-3 min-w-[300px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Mic className="w-5 h-5 text-red-500" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">正在识别...</p>
            </div>
            {text && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                <p className={`text-sm ${isFinal ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {text}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

