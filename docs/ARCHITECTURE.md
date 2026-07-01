# ARCHITECTURE.md — Trace AI CS

## 总体架构

```
┌────────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                     │
│                                                            │
│  ┌──────┐  ┌────────┐  ┌──────┐  ┌──────────────────────┐ │
│  │Config│  │  API   │  │Redux │  │  @volcengine/rtc SDK  │ │
│  │ Layer│  │  Layer │  │Store │  │  - RTC 连接/音频/视频   │ │
│  └──────┘  └───┬────┘  └──────┘  └──────────┬───────────┘ │
│                │ HTTP                         │ WebRTC      │
└────────────────┼─────────────────────────────┼─────────────┘
                 │                             │
     ┌───────────▼─────────────┐   ┌───────────▼───────────┐
     │  Backend (FastAPI :3001) │   │ 火山引擎 RTC 云端服务    │
     │                         │   │ (音频流/消息路由)        │
     │  GET  /health           │   └───────────────────────┘
     │  POST /getScenes        │
     │  POST /proxy            │───▶ 火山引擎 OpenAPI
     │  POST /llm/callback ◀───┼───  CustomLLM 回调
     │  POST /llm/debug/*      │───▶ 方舟 Ark + 知识库 (Debug)
     └───────────┬─────────────┘
                 │ HTTP
     ┌───────────▼─────────────┐
     │  方舟 Ark LLM            │
     │  (OpenAI 兼容接口)        │
     │  + 火山知识库 RAG          │
     └─────────────────────────┘
```

## 前端架构

### 路由 (`client/src/App.tsx`)

```
/ (BrowserRouter)
└── /* → MainPage (单一入口)
     ├── Antechamber (未加入房间)
     │   ├── AIChangeCard (场景展示/切换)
     │   ├── InvokeButton (开始对话)
     │   └── 底部声明 (Powered by ...)
     └── Room (已加入房间)
         ├── FullScreenCard (数字人全屏 或 AI 头像)
         ├── CameraArea (视频画面)
         ├── Conversation (对话字幕)
         ├── ToolBar (底部工具栏)
         ├── AudioController (音量指示/打断按钮)
         └── MobileToolBar (移动端工具栏)
```

### 状态管理 Redux

```
Store
├── room (roomSlice)
│   ├── scene: string                    # 当前场景 ID
│   ├── sceneConfigMap: Record<string, SceneConfig>  # 场景配置映射
│   ├── rtcConfigMap: Record<string, RTCConfig>      # RTC 配置映射
│   ├── localUser: LocalUser             # 本地用户信息 (publishAudio/video/screen)
│   ├── remoteUsers: IUser[]             # 远端用户列表
│   ├── isJoined: boolean                # 是否已加入房间
│   ├── isAIGCEnable: boolean            # AI 对话是否已启动
│   ├── isAITalking: boolean             # AI 是否正在说话
│   ├── isAIThinking: boolean            # AI 是否正在思考
│   ├── msgHistory: Msg[]                # 对话消息历史 (字幕)
│   ├── isShowSubtitle: boolean          # 是否显示字幕
│   └── isFullScreen: boolean            # 是否全屏模式
└── device (deviceSlice)
    ├── audioInputs: MediaDeviceInfo[]    # 麦克风设备列表
    ├── videoInputs: MediaDeviceInfo[]    # 摄像头设备列表
    ├── selectedMicrophone?: string       # 当前选中的麦克风
    ├── selectedCamera?: string           # 当前选中的摄像头
    └── devicePermissions: {audio, video} # 设备权限
```

### 核心 Hooks

| Hook | 文件 | 职责 |
|------|------|------|
| `useScene()` | `useCommon.ts` | 获取当前场景的 SceneConfig |
| `useRTC()` | `useCommon.ts` | 获取当前场景的 RTCConfig |
| `useDeviceState()` | `useCommon.ts` | 设备开关（麦克风/摄像头/屏幕）及设备查询 |
| `useGetDevicePermission()` | `useCommon.ts` | 检查设备权限 |
| `useJoin()` | `useCommon.ts` | 加入房间流程（创建引擎→加入→启麦→启动AI） |
| `useLeave()` | `useCommon.ts` | 离开房间流程（停止采集→停AI→离开→清状态） |
| `useRtcListeners()` | `listenerHooks.ts` | RTC 事件监听（用户进出/流状态/二进制消息等） |
| `useMessageHandler()` | `handler.ts` | 解析 RTC 二进制消息（TLV 编码） |

### RTC 消息协议

火山引擎通过 RTC DataChannel 发送二进制消息 (TLV 编码):

```
TLV 格式: [Type:4字节] [Length:4字节] [Value:变长]

消息类型:
  conv (BRIEF)  →  AI 状态 (LISTENING/THINKING/SPEAKING/INTERRUPTED/FINISHED)
  subv (SUBTITLE) → 字幕文本 + 确定性标记 (definite) + 段落标记 (paragraph)
  tool (FUNCTION_CALL) → Function Calling 请求
```

### 核心组件交互

```
MainPage
  │
  ├─ getScenes() → API → Redux updateSceneConfig / updateRTCConfig
  │
  ├─ InvokeButton (点击) → useJoin()
  │   │
  │   ├─ RtcClient.createEngine() → 创建 RTC 引擎
  │   ├─ RtcClient.addEventListeners() → 注册事件监听
  │   ├─ RtcClient.joinRoom() → WebRTC 加入房间
  │   ├─ RtcClient.getDevices() → 查询设备列表
  │   ├─ switchMic() → 开启麦克风
  │   └─ RtcClient.startAgent(scene) → POST /proxy?Action=StartVoiceChat
  │
  └─ 离开 → useLeave()
      ├─ RtcClient.stopAgent() → POST /proxy?Action=StopVoiceChat
      └─ RtcClient.leaveRoom() → 退出房间
```

---

## 后端架构

### 入口 (`server/app.py`)

```
scenes/*.json ──▶ read_files() ──▶ init_*_scenes() ──▶ router 注入
.env          ──▶ load_dotenv()

app.include_router(health_router)              # /health
app.include_router(scene_router)               # /getScenes
app.include_router(proxy_router)               # /proxy
app.include_router(llm_callback_router)        # /llm/callback
app.include_router(llm_debug_router)           # /llm/debug/*
```

### 路由 → 服务 → 数据层 关系

```
routers/scene.py → services/scene_service.py → rtc_token.py (AccessToken)
                                              → scenes/*.json (场景配置)

routers/proxy.py → services/proxy_service.py → volcengine SignerV4 (HMAC签名)
                    (签名转发到 rtc.volcengineapi.com)

routers/llm_callback.py → services/llm_channel.py → services/llm_service.py (流式)
                         → services/rag_service.py  (RAG 检索)
                         → 场景 JSON (LLMChannel + RAGConfig + AccountConfig)

routers/llm_debug.py → services/llm_service.py (流式/非流式)
                     → services/rag_service.py (知识库检索)
```

### 请求处理流程

#### POST /getScenes

```
1. router 接收请求 (无需参数)
2. services/scene_service.py::build_scene_list(_scenes)
   a. 遍历场景 JSON
   b. 用 AppId + AppKey + RoomId + UserId 创建 AccessToken
   c. AccessToken.add_privilege(SubscribeStream) + add_privilege(PublishStream)
   d. token = AccessToken.serialize() (HMAC-SHA256 + Base64)
   e. 提取 SceneConfigOut (名称/图标/打断模式/视觉/数字人等)
   f. 提取 RTCConfigOut (AppId/RoomId/UserId/Token)
3. 返回 JSONResponse 包装格式
```

#### POST /proxy?Action=StartVoiceChat

```
1. router 接收 ProxyRequest { SceneID }
2. 从 _scenes[SceneID] 读取:
   - VoiceChat 配置 (完整请求体)
   - AccountConfig.accessKeyId / secretKey
3. SignerV4 签名 (HMAC-SHA256, service=rtc, region=cn-north-1)
4. httpx POST https://rtc.volcengineapi.com?Action=StartVoiceChat&Version=2024-12-01
5. 返回火山引擎响应
```

#### POST /proxy?Action=StopVoiceChat

```
1. 从 VoiceChat 配置中提取 AppId/RoomId/TaskId (缺一不可)
2. 签名并 POST 到火山引擎
3. 返回响应
```

#### POST /llm/callback (CustomLLM 模式)

```
1. 火山引擎 POST 请求体:
   {
     "messages": [{ "role": "user", "content": "..." }],
     "stream": true, "temperature": 0.1, "max_tokens": 100, "top_p": 0.9,
     "model": "doubao-32k", "stream_options": { "include_usage": true }
   }
2. router 解析 messages，从场景配置读取 LLMChannel / RAGConfig / AccountConfig
3. services/llm_channel.py::chat_completion_stream()
   a. 提取最后一条 user 消息 → RAG 检索 (rag_service.retrieve)
   b. 构造 system prompt (角色定义 + RAG 上下文)
   c. httpx 流式 POST 到方舟 Ark (OpenAI 兼容端点)
   d. 转发 SSE chunk: data: {...}\n\n ... data: [DONE]\n\n
4. 返回 StreamingResponse (media_type="text/event-stream")
```

#### POST /llm/debug/chat (流式 Debug)

```
1. 接受 ChatDebugRequest { messages, scene, temperature, max_tokens, enable_rag }
2. 读取场景配置 → RAG 检索 (可选)
3. 调用 llm_service.chat_stream() → SSE 流式返回
```

#### POST /llm/debug/chat/sync (非流式 Debug)

```
1. 同 /chat，但调用 llm_service.chat() → 一次性 JSON 返回
```

#### POST /llm/debug/rag (知识库 Debug)

```
1. 接受 RagDebugRequest { query, scene, limit }
2. 调用 rag_service.retrieve() → JSON 返回检索内容
```

### LLM 服务 (`services/llm_service.py`)

- `LLMService` 类：封装方舟 Ark (OpenAI 兼容接口) 调用
- `chat_stream()`: 流式对话，yield SSE chunk
- `chat()`: 非流式对话，一次性返回完整回复
- `configure()`: 运行时注入场景渠道配置 (api_key, base_url, model, temperature, max_tokens)
- 内置角色 system prompt 模板 + RAG 上下文拼接

### RAG 服务 (`services/rag_service.py`)

- `RagService` 类：封装火山引擎知识库 API
- `retrieve(query, config, ak, sk)`: SignerV4 签名 → POST 搜索 → 提取 result_list[].content → 拼接返回
- 配置从场景 JSON 的 `RAGConfig` 读取 (collection_name, project_name, account_id 等)

### 场景配置结构 (`scenes/Custom.json`)

```json
{
  "SceneConfig": { ... },      // 前端展示
  "AccountConfig": { ... },    // AK/SK 引用 .env
  "RTCConfig": { ... },        // RTC 连接信息
  "VoiceChat": {               // AIGC 对话配置
    "Config": {
      "LLMConfig": { "Mode": "CustomLLM", "Url": "..." }
    }
  },
  "LLMChannel": {              // LLM 渠道配置
    "api_key": "...",
    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
    "model": "ep-xxx",
    "max_tokens": 4096,
    "temperature": 0.3
  },
  "RAGConfig": {               // RAG 知识库配置
    "enabled": true,
    "collection_name": "dw_ai",
    "project_name": "default",
    "account_id": "...",
    "limit": 3
  }
}
```

### 启动流程 (`server/app.py`)

```
1. from dotenv import load_dotenv; load_dotenv()    → 加载 .env
2. read_files("./scenes", ".json")                  → 加载场景 JSON
3. init_scene_router() / init_proxy_router() / init_callback_scenes() / init_debug_scenes()
4. FastAPI() + CORS + include_router                → 创建应用
5. uvicorn.run("server.app:app", host="127.0.0.1", port=3001)
```

## 前端 ↔ 后端 数据流

### 场景获取

```
前端: Apis.Basic.getScenes() → POST /getScenes
后端: 读取 scene JSON → 生成 Token → 返回 { scenes: [{ scene: {...}, rtc: {...} }] }
前端: dispatch(updateSceneConfig(...)) + dispatch(updateRTCConfig(...))
      RtcClient.basicInfo = { app_id, room_id, user_id, token }
```

### RTC 连接

```
前端: RtcClient.joinRoom() → engine.joinRoom(token, roomId, { userId }, options)
数据通道: WebRTC 连接到火山引擎 RTC 服务器
事件: 通过 listenerHooks 分发给 Redux actions
```

### AI 对话生命周期

```
开始: StartVoiceChat → 火山引擎创建 AI 智能体 → 开始处理音频流
进行中: 音频流实时交互 + 字幕/状态消息
      ASR → 火山引擎 → CustomLLM 回调 → RAG 检索 → Ark LLM → TTS
结束: StopVoiceChat → 火山引擎销毁 AI 智能体
```

## 关键设计决策

1. **单一前端入口**: 整个应用只有一个 `<MainPage>` 路由，通过 `room.isJoined` 切换 Antechamber ↔ Room
2. **RTC Client 单例**: `export default new RTCClient()` 全局共享
3. **场景 JSON 双层加载**: 优先 `.json`，fallback `.example.json`，避免首次部署无配置报错
4. **环境变量插值**: `${VAR}` 语法在 JSON 中，通过 `interpolate_env()` 递归替换
5. **CustomLLM 回调 + RAG**: 后端收到回调 → RAG 检索 → 拼入 system prompt → 调用方舟 Ark → SSE 流式返回
6. **Token 动态生成**: 不在 JSON 中存储 Token，每次 `/getScenes` 调用时用 HMAC-SHA256 生成新 Token（24h有效期）
7. **无鉴权中间件**: 后端所有接口无需认证，适合内网/开发环境。部署到公网需加安全措施
8. **配置分层**: `.env` 仅主账号 AK/SK；LLM/RAG/回调地址等业务配置在场景 JSON 中
