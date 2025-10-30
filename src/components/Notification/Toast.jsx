import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react'

/**
 * Toast 通知组件
 * 用于显示各种状态变化通知
 */
export function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  }

  // 使用与 test.html 一致的纯色背景样式
  const bgColors = {
    success: '#10b981', // 绿色
    error: '#ef4444',   // 红色
    info: '#3b82f6',    // 蓝色
    warning: '#f59e0b'  // 橙色
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        backgroundColor: bgColors[type],
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}
      className="flex items-center gap-3 px-5 py-3 rounded-lg"
    >
      <div className="text-white">
        {icons[type]}
      </div>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

/**
 * Toast 容器组件
 * 管理多个 Toast 通知
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

