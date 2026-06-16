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

我们的服务以 SSE text/event-stream 格式返回。
"""

import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from ..services import chat_completion_stream

logger = logging.getLogger(__name__)

router = APIRouter(tags=["CustomLLM 回调"])


@router.post(
    "/llm/callback",
    summary="CustomLLM 回调接口",
    description="火山引擎在 LLMConfig.Mode = CustomLLM 时回调此接口。转发到 services/llm_channel.py 中配置的 LLM 渠道。",
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
    temperature = raw.get("temperature", 0.7)
    max_tokens = raw.get("max_tokens", 4096)
    top_p = raw.get("top_p", 0.9)

    logger.info("CustomLLM callback: messages=%d", len(messages))

    return StreamingResponse(
        chat_completion_stream(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
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
