import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2 } from 'lucide-react'

/**
 * 搜索状态指示器组件
 * 显示搜索开始、进行中、完成等状态
 */
export function SearchIndicator({ isSearching, query }) {
  return (
    <AnimatePresence>
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40"
        >
          <div className="bg-white rounded-lg shadow-lg border border-blue-200 px-4 py-3 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900">正在搜索...</p>
              {query && (
                <p className="text-xs text-gray-500">搜索关键词: {query}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

