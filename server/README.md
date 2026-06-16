# Trace AI CS Server

基于 FastAPI 的实时对话式 AI 后端服务。

## 技术栈

- Python 3.12+
- FastAPI
- httpx
- 火山引擎 OpenAPI / RTC SDK

## 本地开发

```bash
cd trace-ai-cs
python3 -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt
uvicorn server.app:app --reload --host 0.0.0.0 --port 3001
```

交互式文档：`http://localhost:3001/docs`

## API 接口

| 方法 | 路径            | 说明                                   |
| ---- | --------------- | -------------------------------------- |
| GET  | `/health`       | 健康检查                               |
| POST | `/getScenes`    | 获取场景配置列表 + RTC Token           |
| POST | `/proxy`        | 代理 AIGC OpenAPI                      |
| POST | `/llm/callback` | **CustomLLM 回调接口**（火山引擎调用） |
| GET  | `/llm/channels` | 获取可用 LLM 渠道列表                  |

## 目录结构

```
server/
├── app.py              # 入口
├── routers/            # 路由层
├── schemas/            # Pydantic 数据模型
├── services/           # 业务逻辑层
├── token.py            # RTC Token 算法
├── util.py             # 工具函数
└── scenes/             # 场景配置 JSON
```

## 接入第三方大模型

火山引擎 RTC AIGC 通过 **CustomLLM 回调模式** 接入第三方模型：

```
火山引擎 RTC  → 回调 POST /llm/callback  →  转发到真实 LLM 渠道
                (SSE 流式)                    (OpenAI/DeepSeek/自定义)
```

### 配置方式

在场景 JSON 中配置 `LLMConfig.Mode = "CustomLLM"`，并填写回调地址：

```json
{
  "LLMConfig": {
    "Mode": "CustomLLM",
    "Url": "http://your-server:3001/llm/callback",
    "APIKey": ""
  }
}
```

在 `LLMChannel` 中配置回调背后实际使用的模型渠道：

```json
{
  "LLMChannel": {
    "channel_id": "openai",
    "api_key": "${OPENAI_API_KEY}",
    "model": "gpt-4o",
    "base_url": "https://api.openai.com/v1",
    "system_prompt": "你是智能 AI 助手",
    "max_tokens": 4096,
    "temperature": 0.7
  }
}
```

### 支持的渠道

| channel_id | 说明                            | 默认模型        |
| ---------- | ------------------------------- | --------------- |
| `openai`   | OpenAI 官方 API                 | `gpt-4o`        |
| `deepseek` | DeepSeek                        | `deepseek-chat` |
| `custom`   | 任意兼容 OpenAI Chat API 的服务 | —               |

### 扩展自定义渠道

在 `server/services/llm_channel.py` 中添加新渠道的处理逻辑即可。
