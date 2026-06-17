# TESTING.md — 测试策略

## 当前状态

项目 v1.1.0 **暂无自动化测试**。以下为测试策略规划，随着项目成熟逐步引入。

## 测试金字塔

```
        ┌──────┐
        │ E2E  │  ← 全链路验证 (浏览器 → 后端 → 火山引擎)
        ├──────┤
        │ 集成  │  ← 模块间交互 (API 请求/响应、Token 生成)
        ├──────┤
        │ 单元  │  ← 纯函数/类 (util, rtc_token, tlv)
        └──────┘
```

## 推荐策略 (按优先级)

### Phase 1: 单元测试 (servers/)

**目标**: 覆盖纯逻辑函数，不依赖外部服务。

| 模块 | 测试内容 | 框架 |
|------|---------|------|
| `rtc_token.py` | Token 生成/序列化/过期 | pytest |
| `util.py` | `interpolate_env()` 变量替换 | pytest |
| `util.py` | `read_files()` 加载与 fallback | pytest |
| `utils/utils.ts` | `string2tlv()` / `tlv2String()` 编解码 | Vitest |
| `utils/handler.ts` | 消息解析、状态枚举 | Vitest |

### Phase 2: API 集成测试 (servers/)

**目标**: 验证 HTTP 接口行为。

| 端点 | 测试用例 |
|------|---------|
| `GET /health` | 返回 200 + `{"status": "ok"}` |
| `POST /getScenes` | 返回场景列表 + 有效 Token |
| `POST /proxy?Action=StartVoiceChat` | 无效 SceneID 返回 400 |
| `POST /proxy?Action=StopVoiceChat` | 缺少必填字段返回 400 |
| `POST /llm/callback` | 无效 JSON 返回 error SSE |

框架: `pytest` + `httpx.AsyncClient` (FastAPI 内置 TestClient)

### Phase 3: 前端组件测试 + E2E

| 范围 | 内容 | 框架 |
|------|------|------|
| Redux reducers | Action 状态变更 | Vitest |
| Hooks | `useDeviceState`, `useJoin` | React Testing Library |
| E2E | 加入房间 → 对话 → 离开 | Playwright |

## 后端测试示例 (pytest + httpx)

```python
# server/tests/test_util.py
from server.util import interpolate_env
import os

def test_interpolate_env_replaces_var():
    os.environ["TEST_VAR"] = "hello"
    assert interpolate_env("${TEST_VAR} world") == "hello world"

def test_interpolate_env_empty_for_missing():
    assert interpolate_env("${DOES_NOT_EXIST}") == ""

def test_interpolate_env_recursive_dict():
    data = {"a": {"b": "${TEST_VAR}"}}
    result = interpolate_env(data)
    assert result == {"a": {"b": "hello"}}
```

```python
# server/tests/test_health.py
from httpx import ASGITransport, AsyncClient
from server.app import app

async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "service": "trace-ai-cs-server"}
```

## 测试命令

```bash
# 运行所有后端测试
cd server
pytest tests/ -v

# 带覆盖率
pytest tests/ -v --cov=. --cov-report=term-missing

# 运行前端测试
cd client
npx vitest run
```

## 测试隔离

后端测试必须:
- 不依赖真实的火山引擎 API (mock `httpx.AsyncClient`)
- 不依赖真实的环境变量 (在测试中 monkeypatch `os.environ`)
- 不依赖真实的场景 JSON (使用 fixture 构造内存数据)

## 未来自动化

随着项目复杂度增长，引入 CI:
- GitHub Actions (或等效): 每次 PR 运行 lint + test
- 代码覆盖率门槛: >= 80% (service 层) / >= 90% (util 层)
