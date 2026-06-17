# Trace AI CS Client

基于 Vite + React 18 + TypeScript 的实时对话式 AI 前端应用。

## 技术栈

- React 18.3 + TypeScript 5.6
- Redux Toolkit 2.5 (状态管理)
- Vite 6.0 (构建工具)
- Arco Design 2.65 (UI 组件库)
- @volcengine/rtc 4.66 (火山引擎 RTC SDK)
- Less (CSS 预处理)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (默认 :3000)
pnpm --filter @trace-ai-cs/client dev

# 类型检查
npx tsc --noEmit
```

## 构建

```bash
pnpm --filter @trace-ai-cs/client build
# 输出: client/dist/
```

## 项目结构

```
src/
├── api/           # API 请求层 (base / api / type)
├── config/        # 配置 (后端地址)
├── lib/           # RTC 核心 (RtcClient, useCommon, listenerHooks)
├── store/slices/  # Redux (room, device)
├── pages/         # 页面组件 (MainPage, Mobile)
│   ├── MainPage/MainArea/Antechamber/  # 准备房间 (邀请)
│   └── MainPage/MainArea/Room/         # 通话中 (摄像头/字幕/工具/打断)
├── components/    # 通用组件 (AiAvatarCard, AudioLoading 等)
├── utils/         # 工具函数 (TLV编解码, logger)
└── assets/        # 静态资源
```
