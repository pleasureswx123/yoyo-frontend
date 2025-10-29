import { useEffect, useRef, useState } from 'react'
import live2dService from '../../services/live2d'

/**
 * Live2D 查看器组件
 */
export function Live2DViewer() {
  const containerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const initLive2D = async () => {
      if (!containerRef.current || isInitialized) return

      try {
        setIsLoading(true)
        setError(null)
        
        await live2dService.initialize(containerRef.current)
        
        if (mounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Live2D 初始化失败:', err)
        if (mounted) {
          setError(err.message)
          setIsLoading(false)
        }
      }
    }

    // 延迟初始化,确保 DOM 已准备好
    const timer = setTimeout(initLive2D, 100)

    return () => {
      mounted = false
      clearTimeout(timer)
      
      // 组件卸载时销毁 Live2D
      if (isInitialized) {
        live2dService.destroy()
        setIsInitialized(false)
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Live2D 容器 */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* 加载状态 */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Live2D 模型加载中...</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-3">😢</div>
            <p className="text-sm text-red-600 font-medium mb-2">Live2D 加载失败</p>
            <p className="text-xs text-gray-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

