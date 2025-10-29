# 🚀 快速启动指南

## 📋 前置要求

### 1. 确保后端服务运行
```bash
# 在项目根目录 (/Users/shangwenxue/work/evercall/yoyo)
source venv/bin/activate
python app.py
```

**后端服务地址**: http://localhost:8000

### 2. 确保数据库服务运行
- **MongoDB**: 端口 27017
- **Redis**: 端口 6379

检查服务状态:
```bash
# 检查 MongoDB
ps aux | grep mongod

# 检查 Redis
ps aux | grep redis-server
```

## 🎯 启动前端项目

### 方法 1: 使用 pnpm (推荐)
```bash
cd yoyo-frontend
pnpm install  # 首次运行需要安装依赖
pnpm dev      # 启动开发服务器
```

### 方法 2: 使用 npm
```bash
cd yoyo-frontend
npm install   # 首次运行需要安装依赖
npm run dev   # 启动开发服务器
```

**前端访问地址**: http://localhost:3000

## ✅ 验证运行状态

### 1. 检查所有服务
```bash
# 后端服务 (端口 8000)
curl http://localhost:8000/status

# 前端服务 (端口 3000)
curl http://localhost:3000

# MongoDB (端口 27017)
mongosh --eval "db.adminCommand('ping')"

# Redis (端口 6379)
redis-cli ping
```

### 2. 服务状态总览

| 服务 | 端口 | 状态检查命令 | 预期结果 |
|------|------|-------------|----------|
| 后端 FastAPI | 8000 | `curl http://localhost:8000/status` | 返回 JSON 状态 |
| 前端 Vite | 3000 | `curl http://localhost:3000` | 返回 HTML |
| MongoDB | 27017 | `mongosh --eval "db.adminCommand('ping')"` | `{ ok: 1 }` |
| Redis | 6379 | `redis-cli ping` | `PONG` |

## 🎮 使用指南

### 1. 首次登录
1. 打开浏览器访问 http://localhost:3000
2. 会自动弹出登录框
3. 输入任意用户 ID 和用户名
4. 点击"登录"或"注册"按钮

### 2. 开始对话
1. 在输入框输入消息
2. 按 Enter 键或点击发送按钮
3. 等待 AI 回复

### 3. 语音输入 (ASR)
1. **长按空格键** 0.4 秒开始录音
2. 说话
3. **松开空格键** 结束录音
4. 等待语音识别结果
5. 识别结果会自动填入输入框

### 4. 语音播放 (TTS)
- AI 回复会自动转换为语音播放
- 发送新消息会自动停止当前播放

## ⌨️ 快捷键

| 快捷键 | 功能 | 状态 |
|--------|------|------|
| **空格键长按** | 开始语音输入 (ASR) | ✅ 已实现 |
| **Enter** | 发送消息 | ✅ 已实现 |
| **0-5** | 切换提示词模式 | ⏳ 待实现 |
| **Tab** | 切换沉浸模式 | ⏳ 待实现 |
| **Cmd/Ctrl** | 打破沉默 | ⏳ 待实现 |

## 🔧 常见问题

### 1. 前端无法连接后端
**问题**: WebSocket 连接失败,显示"未连接"

**解决方案**:
```bash
# 检查后端是否运行
ps aux | grep "python.*app.py"

# 如果没有运行,启动后端
cd /Users/shangwenxue/work/evercall/yoyo
source venv/bin/activate
python app.py
```

### 2. 麦克风权限问题
**问题**: 点击录音按钮没有反应

**解决方案**:
1. 浏览器会弹出麦克风权限请求,点击"允许"
2. 如果没有弹出,检查浏览器设置:
   - Chrome: 设置 → 隐私和安全 → 网站设置 → 麦克风
   - 确保 `http://localhost:3000` 有麦克风权限

### 3. 端口被占用
**问题**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改端口
# 编辑 vite.config.js,修改 server.port
```

### 4. 依赖安装失败
**问题**: `pnpm install` 失败

**解决方案**:
```bash
# 清除缓存
pnpm store prune

# 删除 node_modules 和 lock 文件
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### 5. 热更新不生效
**问题**: 修改代码后页面没有自动刷新

**解决方案**:
```bash
# 重启开发服务器
# 按 Ctrl+C 停止
# 然后重新运行
pnpm dev
```

## 📊 开发工具

### 1. 查看 API 文档
访问: http://localhost:8000/docs

### 2. 查看 WebSocket 消息
打开浏览器开发者工具:
- Chrome: F12 → Network → WS → 选择连接 → Messages

### 3. 查看 Console 日志
打开浏览器开发者工具:
- Chrome: F12 → Console

### 4. React DevTools
安装 React DevTools 浏览器扩展:
- Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

## 🎨 UI 组件库

### shadcn/ui 组件使用 (待集成)
```bash
# 添加组件 (示例)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
```

## 📦 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

构建产物在 `dist/` 目录。

## 🔍 调试技巧

### 1. 查看 WebSocket 连接状态
```javascript
// 在浏览器 Console 中执行
console.log('WebSocket 状态:', websocketService.isConnected())
```

### 2. 查看当前会话
```javascript
// 在浏览器 Console 中执行
console.log('当前会话:', sessionService.loadSession())
```

### 3. 查看音频队列
```javascript
// 在浏览器 Console 中执行
console.log('音频队列:', audioService.audioQueue.length)
console.log('正在播放:', audioService.isPlayingQueue)
```

## 📝 开发建议

### 1. 代码风格
- 使用 ESLint 检查代码
- 遵循 React Hooks 规则
- 使用 Tailwind CSS 类名

### 2. 组件开发
- 保持组件单一职责
- 使用自定义 Hooks 复用逻辑
- 使用 framer-motion 添加动画

### 3. 性能优化
- 使用 React.memo 避免不必要的重渲染
- 使用 useMemo 和 useCallback 优化性能
- 避免在 render 中创建新对象/函数

## 🚀 下一步

1. **完善核心功能**
   - 添加错误处理
   - 优化 UI/UX
   - 添加加载状态

2. **集成 Live2D**
   - 安装 PIXI.js
   - 加载 Live2D 模型
   - 实现唇形同步

3. **添加高级功能**
   - 用户档案系统
   - 情感系统
   - 文件上传
   - 快捷键功能

## 📚 相关文档

- [迁移状态报告](./MIGRATION_STATUS.md)
- [项目说明](./README.md)
- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [framer-motion 文档](https://www.framer.com/motion/)

---

**祝你开发愉快! 🎉**

如有问题,请查看 [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) 或联系开发团队。

