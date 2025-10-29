# 用户切换功能实现文档

## 📋 概述

参考 `test.html` 中的用户切换功能,在 React 项目中实现了完整的用户切换系统,允许用户快速切换到其他活跃用户账户。

## ✨ 实现的功能

### 1. **用户菜单中的切换入口**
- ✅ 在用户菜单中添加"切换用户"按钮
- ✅ 点击后打开切换用户弹窗
- ✅ 使用 Users 图标标识

### 2. **切换用户弹窗**
- ✅ 复用 LoginModal 组件
- ✅ 根据 `showSwitchUser` 状态显示不同内容
- ✅ 标题和图标动态切换

### 3. **最近使用的用户列表**
- ✅ 从后端获取活跃用户列表 (`/memory/users/active`)
- ✅ 过滤掉当前用户
- ✅ 按最后活跃时间排序
- ✅ 只显示前5个用户
- ✅ 显示用户信息:
  - 用户名
  - 用户 ID
  - 最后活跃时间 (刚刚/X分钟前/X小时前/X天前)
  - 对话次数 (如果有)

### 4. **用户卡片交互**
- ✅ Hover 效果 (边框变蓝、背景变浅蓝)
- ✅ 箭头图标 (Hover 时显示)
- ✅ 点击卡片直接切换用户
- ✅ 流畅的动画效果 (framer-motion)

### 5. **手动输入切换**
- ✅ 用户 ID 输入框
- ✅ 用户名输入框
- ✅ 切换按钮
- ✅ 支持 Enter 键提交

### 6. **切换流程**
- ✅ 清空当前聊天记录
- ✅ 断开当前 WebSocket 连接
- ✅ 登录新用户
- ✅ 自动连接新用户的 WebSocket
- ✅ 更新用户信息显示
- ✅ 关闭弹窗

## 🎨 设计特点

### 参考 test.html 的设计

根据 `test.html` 的实现,我们保留了以下核心功能:

1. **最近使用的用户列表**
   - 显示其他活跃用户
   - 按时间排序
   - 显示最后活跃时间

2. **手动输入切换**
   - 支持输入用户名或 ID
   - 查找并切换到指定用户

3. **切换流程**
   - 清空聊天记录
   - 断开 WebSocket
   - 保存新会话
   - 重新连接

### React 版本的改进

相比 `test.html`,React 版本有以下改进:

1. **更好的 UI 设计**
   - 现代化的卡片设计
   - 流畅的动画效果
   - 更好的 Hover 反馈

2. **更好的代码组织**
   - 组件化设计
   - 状态管理清晰
   - 逻辑复用

3. **更好的用户体验**
   - 自动关闭菜单
   - 自动连接 WebSocket
   - 实时状态更新

## 📁 文件结构

```
yoyo-frontend/
├── src/
│   ├── components/
│   │   ├── Login/
│   │   │   └── LoginModal.jsx        # 登录/切换用户弹窗 (修改)
│   │   └── UserMenu/
│   │       └── UserMenu.jsx          # 用户菜单 (修改)
│   ├── services/
│   │   └── session.js                # 会话服务 (新增 getActiveUsers)
│   └── hooks/
│       └── useSession.js             # 会话 Hook (新增 getActiveUsers)
```

## 🔧 技术实现

### 1. 后端 API

```javascript
// 获取活跃用户列表
async getActiveUsers() {
  const response = await fetch('http://localhost:8000/memory/users/active')
  const data = await response.json()
  
  if (data.success && data.active_users) {
    return data.active_users
  }
  return []
}
```

### 2. 加载活跃用户

```javascript
const loadActiveUsers = async () => {
  setLoadingUsers(true)
  try {
    const users = await session.getActiveUsers()
    // 过滤掉当前用户,按最后活跃时间排序
    const otherUsers = users
      .filter(user => user.user_id !== session.userId)
      .sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
      .slice(0, 5) // 只显示前5个用户
    setActiveUsers(otherUsers)
  } catch (error) {
    console.error('加载活跃用户失败:', error)
  } finally {
    setLoadingUsers(false)
  }
}
```

### 3. 切换用户逻辑

```javascript
const handleSwitchToUser = async (user) => {
  try {
    setIsLoading(true)

    // 清空当前聊天记录
    if (clearMessages) {
      clearMessages()
    }

    // 断开当前WebSocket连接
    websocket.disconnect()

    // 登录新用户
    await session.login(user.user_id, user.name)

    console.log(`✅ 已切换到用户: ${user.name} (${user.user_id})`)

    // 关闭弹窗
    setShowSwitchUser(false)
    setTimeout(() => {
      onClose()
    }, 500)

  } catch (error) {
    console.error('❌ 用户切换失败:', error)
    alert('切换用户失败,请重试')
  } finally {
    setIsLoading(false)
  }
}
```

### 4. 格式化时间

```javascript
const formatLastActive = (lastActive) => {
  const now = new Date()
  const last = new Date(lastActive)
  const diffMinutes = Math.floor((now - last) / (1000 * 60))

  if (diffMinutes < 1) return '刚刚活跃'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}
```

### 5. UI 条件渲染

```jsx
{showSwitchUser ? (
  <>
    {/* 切换用户界面 */}
    <h2>👥 切换用户</h2>
    <p>选择要切换到的用户账户</p>
    
    {/* 最近使用的用户 */}
    <div>
      {activeUsers.map((user) => (
        <div onClick={() => handleSwitchToUser(user)}>
          <div>{user.name}</div>
          <div>ID: {user.user_id}</div>
          <div>{formatLastActive(user.last_active)}</div>
        </div>
      ))}
    </div>
    
    {/* 手动输入 */}
    <div>
      <input placeholder="输入用户ID..." />
      <input placeholder="输入用户名..." />
      <button>切换</button>
    </div>
  </>
) : (
  <>
    {/* 原来的登录界面 */}
  </>
)}
```

## 📊 功能对比

### test.html vs React 版本

| 功能 | test.html | React 版本 |
|------|-----------|------------|
| 切换用户入口 | 独立按钮 | 用户菜单中 |
| 活跃用户列表 | ✅ | ✅ |
| 最后活跃时间 | ✅ | ✅ |
| 对话次数显示 | ✅ | ✅ |
| 手动输入切换 | ✅ | ✅ |
| 清空聊天记录 | ✅ | ✅ |
| 断开 WebSocket | ✅ | ✅ |
| 自动重连 | ✅ | ✅ |
| 动画效果 | ❌ | ✅ |
| 卡片设计 | 简单 | 现代化 |
| 代码组织 | 单文件 | 组件化 |

## 🎯 使用流程

### 用户操作流程

1. **打开用户菜单**
   - 点击右上角用户头像

2. **点击切换用户**
   - 在菜单中点击"切换用户"

3. **选择用户**
   - **方式一**: 点击最近使用的用户卡片
   - **方式二**: 手动输入用户 ID 和用户名,点击"切换"

4. **自动切换**
   - 系统自动清空聊天记录
   - 断开当前连接
   - 登录新用户
   - 重新连接 WebSocket
   - 更新界面显示

### 开发者使用

```jsx
// 在 UserMenu 组件中
import { LoginModal } from '../Login/LoginModal'

export function UserMenu() {
  const [showSwitchUser, setShowSwitchUser] = useState(false)

  return (
    <>
      {/* 用户菜单 */}
      <button onClick={() => setShowSwitchUser(true)}>
        <Users />
        切换用户
      </button>

      {/* 切换用户弹窗 */}
      <LoginModal
        isOpen={showSwitchUser}
        onClose={() => setShowSwitchUser(false)}
      />
    </>
  )
}
```

## 🐛 已知问题和解决方案

### 问题 1: 用户档案 404 错误
- **现象**: 切换用户时出现 `❌ 获取用户档案失败: 404`
- **原因**: 新用户可能没有档案数据
- **影响**: 不影响切换功能,只是无法加载档案
- **解决**: 已在代码中处理,不会阻塞切换流程

### 问题 2: 会话同步 404 错误
- **现象**: `❌ 会话同步失败: 404`
- **原因**: 后端可能没有实现会话同步接口
- **影响**: 不影响切换功能
- **解决**: 已在代码中处理,不会阻塞切换流程

## 🚀 后续优化

### 待实现功能

1. **用户搜索**
   - 在活跃用户列表中搜索
   - 支持模糊匹配

2. **用户分组**
   - 按对话阶段分组
   - 按最后活跃时间分组

3. **用户头像**
   - 显示用户自定义头像
   - 默认头像生成

4. **切换历史**
   - 记录切换历史
   - 快速切换到最近使用的用户

5. **批量操作**
   - 批量删除用户
   - 批量导出用户数据

## 📝 总结

✅ **成功实现了完整的用户切换功能**
✅ **参考 test.html 的核心逻辑**
✅ **提供了更好的 UI 和用户体验**
✅ **代码组织清晰,易于维护**
✅ **支持快速切换和手动输入两种方式**
✅ **智能按钮切换: 未登录显示"注册",已登录显示"切换用户"**

**效果**: 用户可以轻松切换到其他活跃用户,无需重新登录! 🎊

## 🆕 最新改进 (2025-10-29)

### 完全移除"注册"按钮,统一使用"切换用户"

根据用户反馈,我们对登录界面的按钮进行了彻底优化:

**问题**:
- 原来的"注册"按钮功能与"登录"按钮完全重复
- 因为新用户可以通过"登录"按钮自动注册,所以"注册"按钮没有任何实际意义
- 增加了用户的认知负担

**解决方案**:
- ✅ **完全移除"注册"按钮**
- ✅ **统一使用"切换用户"按钮**
- ✅ 无论是否登录,都提供"切换用户"功能

**实现逻辑**:
```jsx
{/* 始终显示"切换用户"按钮 */}
<button
  onClick={handleShowSwitchUser}
  disabled={isLoading}
  className="flex-1 bg-purple-500 hover:bg-purple-600..."
>
  <Users className="w-5 h-5" />
  <span>切换用户</span>
</button>
```

**效果**:
1. **所有状态**: 始终显示"登录"和"切换用户"两个按钮
2. **未登录用户**: 可以点击"切换用户"查看活跃用户列表,快速切换到已有账户
3. **已登录用户**: 可以点击"切换用户"快速切换到其他账户
4. **新用户**: 直接使用"登录"按钮即可自动注册

**用户体验提升**:
- ✅ 完全消除了冗余功能
- ✅ 简化了用户的选择
- ✅ 提供了统一的切换入口
- ✅ 降低了认知负担
- ✅ 界面更加简洁清晰

**按钮设计**:
- **登录按钮**: 蓝色背景 (bg-blue-500) - 主要操作
- **切换用户按钮**: 紫色背景 (bg-purple-500) - 辅助操作
- 颜色区分明显,功能一目了然

## 🔗 相关文件

- `yoyo-frontend/src/components/Login/LoginModal.jsx` - 登录/切换用户弹窗
- `yoyo-frontend/src/components/UserMenu/UserMenu.jsx` - 用户菜单
- `yoyo-frontend/src/services/session.js` - 会话服务
- `yoyo-frontend/src/hooks/useSession.js` - 会话 Hook
- `test.html` (行 2918-3090) - 原始实现参考

