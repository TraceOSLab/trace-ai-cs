"""
Trace AI Conversational Server 入口
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

from .util import read_files
from .routers import health_router, scene_router, proxy_router
from .routers.scene import init_scenes as init_scene_router
from .routers.proxy import init_scenes as init_proxy_router

# 加载项目根目录的 .env
load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 加载场景配置（全局单例）
SCENES = read_files("./scenes", ".json")

# 注入场景配置到各路由模块
init_scene_router(SCENES)
init_proxy_router(SCENES)

# ── FastAPI 应用 ──────────────────────────────────────────

app = FastAPI(
    title="Trace AI Conversational Server",
    description=(
        "基于火山引擎 RTC 的实时对话式 AI 后端服务\n\n"
        "## 接口列表\n"
        "- **`GET /health`** — 健康检查\n"
        "- **`POST /getScenes`** — 获取场景列表 + RTC Token\n"
        "- **`POST /proxy`** — 代理火山引擎 OpenAPI（StartVoiceChat / StopVoiceChat）\n\n"
        "## 使用流程\n"
        "1. 调用 `POST /getScenes` 获取场景和 RTC Token\n"
        "2. 使用 Token 通过 `@volcengine/rtc` SDK 加入 RTC 房间\n"
        "3. 调用 `POST /proxy?Action=StartVoiceChat` 启动 AI Agent\n"
        "4. 对话结束后调用 `POST /proxy?Action=StopVoiceChat` 停止 Agent"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    license_info={
        "name": "BSD-3-Clause",
        "url": "https://opensource.org/licenses/BSD-3-Clause",
    },
)

# CORS — 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 注册路由 ──────────────────────────────────────────────
app.include_router(health_router)
app.include_router(scene_router)
app.include_router(proxy_router)

# ── 启动入口 ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.app:app", host="127.0.0.1", port=3001, reload=True)
