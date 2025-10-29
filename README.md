# 悠悠 - AI情感陪伴数字人智能对话系统 (前端)

这是一个基于 React + Vite + Tailwind CSS 的现代化前端项目,用于替代原有的 test.html 单页面应用。

## 技术栈

- **构建工具**: Vite 6.x
- **前端框架**: React 18.x (JavaScript)
- **样式框架**: Tailwind CSS 3.x
- **UI组件库**: shadcn/ui (即将集成)
- **图标库**: lucide-react
- **动画库**: framer-motion
- **工具库**: 
  - class-variance-authority (CVA)
  - clsx
  - tailwind-merge

## 项目结构

```
yoyo-frontend/
├── src/
│   ├── components/      # React 组件
│   │   └── ui/         # shadcn/ui 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具函数
│   ├── utils/          # 辅助函数
│   ├── assets/         # 静态资源
│   ├── App.jsx         # 主应用组件
│   ├── main.jsx        # 应用入口
│   └── index.css       # 全局样式
├── public/             # 公共资源
├── index.html          # HTML 模板
├── vite.config.js      # Vite 配置
├── tailwind.config.js  # Tailwind 配置
├── postcss.config.js   # PostCSS 配置
└── package.json        # 项目配置

```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发服务器将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 功能特性

### 已实现

- ✅ 现代化的 UI 界面
- ✅ 响应式布局
- ✅ 消息发送和显示
- ✅ 流畅的动画效果
- ✅ 系统状态显示

### 待实现 (从 test.html 迁移)

- [ ] WebSocket 连接管理
- [ ] 用户登录/注册
- [ ] 用户会话管理
- [ ] Live2D 数字人集成
- [ ] 语音识别 (ASR)
- [ ] 语音合成 (TTS)
- [ ] 实时对话流式响应
- [ ] 用户档案管理
- [ ] 对话阶段显示
- [ ] 情感系统
- [ ] 提示词模式切换
- [ ] 沉浸模式
- [ ] 文件上传
- [ ] 搜索功能

## 开发指南

### 添加 shadcn/ui 组件

```bash
# 初始化 shadcn/ui (如需要)
npx shadcn@latest init

# 添加组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
# ... 等等
```

### 代理配置

Vite 已配置代理,所有 `/api` 和 `/ws` 请求将自动转发到后端服务器 (`http://localhost:8000`)

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    '/ws': {
      target: 'ws://localhost:8000',
      ws: true,
    },
  },
}
```

## 与后端集成

### API 端点

- 后端服务: `http://localhost:8000`
- WebSocket: `ws://localhost:8000/ws`
- API 文档: `http://localhost:8000/docs`

### WebSocket 连接示例

```javascript
const ws = new WebSocket('ws://localhost:8000/ws')

ws.onopen = () => {
  console.log('WebSocket 已连接')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // 处理消息
}

ws.onclose = () => {
  console.log('WebSocket 已断开')
}
```

## 样式指南

### Tailwind CSS 使用

项目使用 Tailwind CSS 进行样式开发,支持:

- 响应式设计 (`sm:`, `md:`, `lg:`, `xl:`)
- 暗色模式 (`dark:`)
- 自定义主题颜色
- 动画效果

### CSS 变量

项目使用 CSS 变量定义主题颜色,可在 `src/index.css` 中修改:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}
```

## 性能优化

- ✅ Vite 快速热更新 (HMR)
- ✅ 代码分割
- ✅ 懒加载
- ✅ Tree-shaking
- ✅ 生产环境压缩

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 许可证

ISC

## 相关链接

- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

