# 用户菜单实现文档

## 📋 概述

参考用户提供的设计截图,实现了一个现代化的用户菜单下拉卡片组件,替换了原来的三个独立按钮(设置、用户、登出)。

## ✨ 实现的功能

### 1. **用户头像按钮**
- ✅ 圆形头像,显示用户名首字母
- ✅ 渐变背景色 (蓝色到紫色)
- ✅ 在线状态指示器 (绿色小圆点)
- ✅ Hover 效果
- ✅ 点击展开/收起菜单

### 2. **下拉菜单卡片**
- ✅ 圆角卡片设计 (rounded-2xl)
- ✅ 阴影效果 (shadow-2xl)
- ✅ 流畅的展开/收起动画 (framer-motion)
- ✅ 点击外部自动关闭

### 3. **用户信息头部**
- ✅ 大头像 (16x16) + 在线状态指示器
- ✅ 用户名显示
- ✅ 对话阶段显示 (初次见面/逐渐熟悉/已经熟悉/亲密朋友)
- ✅ 渐变背景 (蓝色到紫色)

### 4. **菜单项**

#### 对话统计
- ✅ 显示对话轮次
- ✅ 图标 + 文字 + 数字

#### 设置
- ✅ 设置图标 + 文字
- ✅ Hover 效果
- ✅ 点击事件 (TODO: 打开设置面板)

#### 我的档案
- ✅ 档案图标 + 文字 + 外部链接图标
- ✅ Hover 效果
- ✅ 点击事件 (TODO: 打开用户档案)

#### 登出
- ✅ 登出图标 + 文字
- ✅ 红色 Hover 效果
- ✅ 确认对话框
- ✅ 登出后刷新页面

## 🎨 设计特点

### 参考设计元素
根据用户提供的截图,实现了以下设计元素:

1. **头像 + 在线状态**
   - 圆形头像
   - 右下角绿色在线指示器

2. **用户信息区域**
   - 用户名 (大字体、粗体)
   - 副标题 (对话阶段)

3. **分割线**
   - 菜单项之间的分割线

4. **菜单项布局**
   - 图标 + 文字
   - 左对齐
   - Hover 背景色变化

5. **登出按钮**
   - 单独分隔
   - 红色 Hover 效果

### 改进和优化

相比参考设计,我们还添加了:

1. **动画效果**
   - 使用 framer-motion 实现流畅的展开/收起动画
   - opacity + scale + y 轴位移

2. **对话统计**
   - 显示对话轮次
   - 实时更新

3. **渐变背景**
   - 用户信息区域使用渐变背景
   - 更加美观

4. **点击外部关闭**
   - 自动检测点击外部区域
   - 自动关闭菜单

## 📁 文件结构

```
yoyo-frontend/
├── src/
│   ├── components/
│   │   └── UserMenu/
│   │       └── UserMenu.jsx  # 用户菜单组件 (新增)
│   └── App.jsx               # 主应用 (修改)
```

## 🔧 技术实现

### 组件代码结构

```jsx
export function UserMenu() {
  const { session } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    // ...
  }, [isOpen])

  // 登出处理
  const handleLogout = () => {
    if (window.confirm('确定要登出吗?')) {
      session.logout()
      setIsOpen(false)
      window.location.reload()
    }
  }

  // 获取用户头像首字母
  const getInitial = () => {
    return session.userName?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 用户头像按钮 */}
      <button onClick={() => setIsOpen(!isOpen)}>
        {/* 头像 + 在线状态 */}
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
          >
            {/* 用户信息头部 */}
            {/* 菜单项 */}
            {/* 登出 */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 关键技术点

1. **useRef + useEffect 实现点击外部关闭**
   ```jsx
   const menuRef = useRef(null)
   
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
   ```

2. **framer-motion 动画**
   ```jsx
   <motion.div
     initial={{ opacity: 0, y: -10, scale: 0.95 }}
     animate={{ opacity: 1, y: 0, scale: 1 }}
     exit={{ opacity: 0, y: -10, scale: 0.95 }}
     transition={{ duration: 0.15 }}
   >
   ```

3. **对话阶段映射**
   ```jsx
   {session.profile?.conversation_stage === 'greeting' && '初次见面'}
   {session.profile?.conversation_stage === 'getting_to_know' && '逐渐熟悉'}
   {session.profile?.conversation_stage === 'familiar' && '已经熟悉'}
   {session.profile?.conversation_stage === 'close' && '亲密朋友'}
   ```

## 🎯 使用方法

### 在 App.jsx 中使用

```jsx
import { UserMenu } from './components/UserMenu/UserMenu'

function App() {
  return (
    <header>
      {/* ... */}
      {session.isLoggedIn && <UserMenu />}
    </header>
  )
}
```

### 功能说明

1. **点击头像** - 展开/收起菜单
2. **点击外部** - 自动关闭菜单
3. **点击设置** - 打开设置面板 (TODO)
4. **点击我的档案** - 打开用户档案 (TODO)
5. **点击登出** - 确认后登出并刷新页面

## 📊 对比

### 修改前
- ❌ 三个独立按钮 (设置、用户、登出)
- ❌ 占用空间大
- ❌ 功能分散
- ❌ 没有用户信息展示

### 修改后
- ✅ 单个用户头像按钮
- ✅ 占用空间小
- ✅ 功能集中在下拉菜单
- ✅ 完整的用户信息展示
- ✅ 现代化设计
- ✅ 流畅的动画效果

## 🚀 后续优化

### 待实现功能

1. **设置面板**
   - 语音设置 (音色、语速)
   - ASR 设置
   - 主题设置
   - 快捷键设置

2. **用户档案**
   - 档案详情展示
   - 对话历史
   - 档案完成度可视化
   - 对话阶段进度

3. **头像上传**
   - 支持自定义头像
   - 头像裁剪
   - 头像预览

4. **更多菜单项**
   - 帮助文档
   - 关于
   - 反馈

## 📝 总结

✅ **成功实现了参考设计的用户菜单卡片**
✅ **替换了原来的三个独立按钮**
✅ **提供了更好的用户体验**
✅ **代码结构清晰,易于扩展**

**效果**: 现代化、美观、功能完整的用户菜单组件! 🎊

