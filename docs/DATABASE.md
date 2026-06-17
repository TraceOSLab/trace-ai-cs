# DATABASE.md — Trace AI CS

## 当前状态: **无数据库**

Trace AI CS 当前版本 (1.1.0) **不使用任何持久化数据库**。

### 数据存储方式

| 数据类型 | 存储位置 | 生命周期 | 说明 |
|---------|---------|---------|------|
| 场景配置 | `server/scenes/Custom.json` | 文件持久 | JSON 文件，启动时加载到内存 |
| 账号凭证 | `.env` | 文件持久 | 环境变量，通过 `load_dotenv()` 加载 |
| RTC Token | 内存 | 进程生命周期 | 每次调用 `/getScenes` 时动态生成(HMAC-SHA256) |
| RequestID | sessionStorage | 浏览器会话 | 前端存储，用于展示 |
| RTC 连接状态 | Redux Store + RTC SDK | 页面生命周期 | 退出房间时清空 |
| 对话历史 | Redux Store (`msgHistory`) | 页面生命周期 | 退出房间时清空 |

### 场景配置 JSON 结构 (`server/scenes/*.json`)

```json
{
  "SceneConfig": { "icon": "...", "name": "..." },
  "AccountConfig": { "accessKeyId": "...", "secretKey": "..." },
  "RTCConfig": { "AppId": "...", "AppKey": "...", "RoomId": "...", "UserId": "...", "Token": "..." },
  "VoiceChat": {
    "AppId": "...",
    "RoomId": "...",
    "TaskId": "...",
    "AgentConfig": {
      "TargetUserId": ["..."],
      "WelcomeMessage": "...",
      "UserId": "...",
      "EnableConversationStateCallback": true
    },
    "Config": {
      "ASRConfig": { "Provider": "volcano", "ProviderParams": { ... } },
      "TTSConfig": { "Provider": "volcano", "ProviderParams": { ... } },
      "LLMConfig": { "Mode": "CustomLLM", "Url": "...", "APIKey": "..." },
      "AvatarConfig": { "Enabled": false, ... },
      "InterruptMode": 0
    }
  }
}
```

### 为什么没有数据库

当前项目聚焦于实时语音对话能力验证，以下状态均不需要持久化：

- **RTC 连接**是瞬时的 (每次对话独立建立/销毁)
- **Token** 通过 HMAC-SHA256 动态生成，24 小时有效
- **对话记录**暂无持久化需求
- **场景配置**通过 JSON 文件管理，数量少 (目前 1 个)

### 未来可能的数据库需求

当以下功能加入时，需引入数据库：

| 功能 | 推荐数据库 |
|------|-----------|
| 用户系统/登录 | PostgreSQL |
| 对话历史持久化 | PostgreSQL 或 MongoDB |
| RAG 知识库 | PostgreSQL (pgvector) 或向量数据库 |
| 多租户场景管理 | PostgreSQL |
| 会话状态缓存 | Redis |

数据库引入后，本文档将更新为表结构设计、ER 图和索引策略。
