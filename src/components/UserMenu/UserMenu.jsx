import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut, CreditCard, FileText, ExternalLink, Users } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { LoginModal } from '../Login/LoginModal'
import { SettingsDialog } from '../Settings/SettingsDialog'

/**
 * 用户菜单组件
 * 点击用户头像显示下拉菜单
 */
export function UserMenu() {
  const { session } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [showSwitchUser, setShowSwitchUser] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const menuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 登出处理
  const handleLogout = () => {
    session.logout()
    setIsOpen(false)
    window.location.reload()
  }

  // 获取用户头像首字母
  const getInitial = () => {
    return session.userName?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title={session.userName}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {getInitial()}
        </div>
        {/* 在线状态指示器 */}
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* 用户信息头部 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex items-center gap-4">
                {/* 头像 */}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {getInitial()}
                  </div>
                  {/* 在线状态 */}
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                </div>

                {/* 用户信息 */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {session.userName || '未知用户'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {session.profile?.conversation_stage === 'greeting' && '初次见面'}
                    {session.profile?.conversation_stage === 'getting_to_know' && '逐渐熟悉'}
                    {session.profile?.conversation_stage === 'familiar' && '已经熟悉'}
                    {session.profile?.conversation_stage === 'close' && '亲密朋友'}
                    {!session.profile?.conversation_stage && 'AI 对话伙伴'}
                  </p>
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gray-100" />

            {/* 菜单项 */}
            <div className="p-2">
              {/* 对话统计 */}
              {/*<div className="px-4 py-3 mb-1">*/}
              {/*  <div className="flex items-center justify-between text-sm">*/}
              {/*    <div className="flex items-center gap-2 text-gray-600">*/}
              {/*      <CreditCard className="w-4 h-4" />*/}
              {/*      <span>对话轮次</span>*/}
              {/*    </div>*/}
              {/*    <span className="font-semibold text-gray-900">*/}
              {/*      {session.profile?.conversation_count || 0} 次*/}
              {/*    </span>*/}
              {/*  </div>*/}
              {/*</div>*/}

              {/* 设置 */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowSettings(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">设置</span>
              </button>

              {/* 用户档案 */}
              {/*<button
                onClick={() => {
                  setIsOpen(false)
                  // TODO: 打开用户档案
                  console.log('打开用户档案')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-gray-900 font-medium">我的档案</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </button>*/}

              {/* 切换用户 */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowSwitchUser(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">切换用户</span>
              </button>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gray-100 mx-2" />

            {/* 登出 */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors text-left group"
              >
                <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                <span className="text-gray-900 font-medium group-hover:text-red-600 transition-colors">
                  登出
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 切换用户弹窗 */}
      <LoginModal
        isOpen={showSwitchUser}
        onClose={() => setShowSwitchUser(false)}
      />

      {/* 设置对话框 */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}

