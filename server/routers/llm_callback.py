"""
CustomLLM 回调路由

火山引擎 RTC AIGC 在 LLMConfig.Mode = "CustomLLM" 时，
POST 以下格式请求到配置的 Url：

{
    "messages": [{"role":"user","content":"..."}],
    "stream": true,
    "temperature": 0.1,
    "max_tokens": 100,
    "top_p": 0.9,
    "model": "doubao-32k",
    "stream_options": {"include_usage": true}
}

我们的服务：
1. 从场景配置中读取 LLMChannel + RAGConfig + AccountConfig
2. 执行 RAG 检索增强
3. 调用 LLM 服务（方舟 Ark / OpenAI 兼容）
4. SSE text/event-stream 流式返回
"""

import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from ..services import chat_completion_stream

logger = logging.getLogger(__name__)

router = APIRouter(tags=["CustomLLM 回调"])

# 场景配置引用（由 app.py 注入）
_SCENES_REF: dict = {}


def init_callback_scenes(scenes: dict) -> None:
    """注入场景配置（由 app.py 调用）。"""
    global _SCENES_REF  # noqa: PLW0603
    _SCENES_REF = scenes


def _get_scene_config(request: Request) -> tuple[dict, dict, str, str]:
    """
    从请求中推断当前场景，返回 (llm_config, rag_config, ak, sk)。

    默认取第一个可用的场景配置。
    """
    # 从 query params 或 header 获取 scene 名称
    scene_name = request.query_params.get("scene") or request.headers.get(
        "X-Scene-Name", ""
    )
    # 回退到 POST body 中的 scene 字段（解析后）
    # 由于 body 已经流式消费，这里从 _SCENES_REF 取默认
    scenes = _SCENES_REF
    if not scenes:
        return {}, {}, "", ""

    # 优先用指定的 scene，否则取第一个
    scene_data = scenes.get(scene_name) or next(iter(scenes.values()), {})
    llm_config = scene_data.get("LLMChannel", {})
    rag_config = scene_data.get("RAGConfig", {})
    account = scene_data.get("AccountConfig", {})
    ak = account.get("accessKeyId", "")
    sk = account.get("secretKey", "")

    return llm_config, rag_config, ak, sk


@router.post(
    "/llm/callback",
    summary="CustomLLM 回调接口",
    description="RAG 检索 + LLM 流式回复。",
)
async def llm_callback(request: Request):
    try:
        raw = await request.json()
    except Exception:
        return StreamingResponse(
            _error_sse("Invalid JSON body"),
            media_type="text/event-stream",
        )

    messages = raw.get("messages", [])

    # 从场景配置中获取 LLM / RAG / 账号配置
    llm_config, rag_config, ak, sk = _get_scene_config(request)

    logger.info(
        "CustomLLM callback: messages=%d scene=%s",
        len(messages),
        list(_SCENES_REF.keys())[0] if _SCENES_REF else "none",
    )

    return StreamingResponse(
        chat_completion_stream(
            messages=messages,
            llm_config=llm_config,
            rag_config=rag_config,
            access_key_id=ak,
            secret_key=sk,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


def _error_sse(message: str):
    yield f"data: {json.dumps({'error': message})}\n\n"
    yield "data: [DONE]\n\n"
