# Trace AI CS Server

基于 FastAPI 的实时对话式 AI 后端服务。

## 技术栈

- Python 3.11+
- FastAPI 0.115
- httpx 0.28
- Pydantic 2.10
- 火山引擎 OpenAPI (SignerV4 签名)

## 本地开发

```bash
cd trace-ai-cs
python3 -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt
uvicorn server.app:app --reload --host 0.0.0.0 --port 3001
```

交互式文档: `http://localhost:3001/docs`

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/getScenes` | 获取场景配置列表 + RTC Token |
| POST | `/proxy` | 代理 AIGC OpenAPI (`?Action=StartVoiceChat\|StopVoiceChat`) |
| POST | `/llm/callback` | CustomLLM 回调接口 (SSE 流式) |

## 目录结构

```
server/
├── app.py              # 入口: 加载配置 → 创建 FastAPI → 注册路由
├── routers/            # 路由层: health, scene, proxy, llm_callback
├── schemas/            # Pydantic 数据模型: common, scene, llm
├── services/           # 业务逻辑层: scene_service, proxy_service, llm_channel
├── rtc_token.py        # RTC Token 生成 (HMAC-SHA256)
├── util.py             # 工具: interpolate_env, read_files, wrapper_response
├── scenes/             # 场景配置 JSON
│   ├── Custom.example.json  # 模板 (git 跟踪)
│   └── Custom.json          # 真实配置 (gitignore)
└── requirements.txt
```

## 接入第三方大模型

火山引擎 RTC AIGC 通过 **CustomLLM 回调模式** 接入第三方模型:

```
火山引擎 → POST /llm/callback → llm_channel.py → OpenAI 兼容 API → SSE 流式返回
```

### 配置方式

1. 场景 JSON 中 `LLMConfig.Mode = "CustomLLM"`, `Url` 填回调地址
2. 编辑 `services/llm_channel.py` 中的 `_LLM_CONFIG` 字典
3. 重启后端生效

文档: `docs/CONFIGURATION.md`, `docs/GLOSSARY.md`
