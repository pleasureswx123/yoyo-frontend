import { useEffect, useState, useCallback, useRef } from 'react'
import websocketService from '../services/websocket'

/**
 * WebSocket Hook
 * 管理 WebSocket 连接和消息处理
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const handlersRef = useRef(new Map())

  // 连接 WebSocket
  const connect = useCallback((userId) => {
    websocketService.connect(userId)
  }, [])

  // 断开连接
  const disconnect = useCallback(() => {
    websocketService.disconnect()
  }, [])

  // 发送消息
  const sendMessage = useCallback((data) => {
    return websocketService.send(data)
  }, [])

  // 注册消息处理器
  const on = useCallback((type, handler) => {
    websocketService.on(type, handler)

    // 保存引用以便清理
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, [])
    }
    handlersRef.current.get(type).push(handler)
  }, [])

  // 移除消息处理器
  const off = useCallback((type, handler) => {
    websocketService.off(type, handler)
  }, [])

  useEffect(() => {
    // 监听连接状态
    const handleOpen = () => setIsConnected(true)
    const handleClose = () => setIsConnected(false)
    const handleMessage = (data) => setLastMessage(data)

    websocketService.on('onopen', handleOpen)
    websocketService.on('onclose', handleClose)
    websocketService.on('onmessage', handleMessage)

    // 同步初始连接状态
    setIsConnected(websocketService.isConnected())

    // 定期同步连接状态 (每秒检查一次,确保状态准确)
    const syncInterval = setInterval(() => {
      const actualState = websocketService.isConnected()
      setIsConnected(prev => {
        if (prev !== actualState) {
          console.log(`🔄 同步连接状态: ${prev} -> ${actualState}`)
          return actualState
        }
        return prev
      })
    }, 1000)

    // 清理
    return () => {
      clearInterval(syncInterval)
      websocketService.off('onopen', handleOpen)
      websocketService.off('onclose', handleClose)
      websocketService.off('onmessage', handleMessage)

      // 清理所有注册的处理器
      handlersRef.current.forEach((handlers, type) => {
        handlers.forEach(handler => {
          websocketService.off(type, handler)
        })
      })
      handlersRef.current.clear()
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    on,
    off
  }
}

