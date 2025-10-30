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

  // 柔和的渐变背景样式
  const styles = {
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    error: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    info: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    },
    warning: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      borderColor: 'rgba(245, 158, 11, 0.3)'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: styles[type].background,
        borderColor: styles[type].borderColor,
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-sm"
    >
      <div className="text-white">
        {icons[type]}
      </div>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
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

