# Trace AI CS Client

基于 Vite + React 18 + TypeScript 的实时对话式 AI 前端应用。

## 技术栈

- React 18 + TypeScript
- Redux Toolkit (状态管理)
- Vite (构建工具)
- Arco Design (UI 组件库)
- @volcengine/rtc (火山引擎 RTC SDK)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @trace-ai-cs/client dev
```

## 构建

```bash
pnpm --filter @trace-ai-cs/client build
```

## 项目结构

```
src/
├── app/           # API 层
├── assets/        # 静态资源
├── components/    # 通用组件
├── config/        # 配置文件
├── lib/           # RTC 核心逻辑
├── pages/         # 页面组件
├── store/         # Redux 状态管理
└── utils/         # 工具函数
```
