"""
代理路由 — 转发 AIGC OpenAPI 请求（StartVoiceChat / StopVoiceChat）
"""

from typing import Dict, Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..schemas import ProxyRequest, WrapperResponse
from ..services import build_start_body, build_stop_body, proxy_request
from ..util import wrapper_response

router = APIRouter(tags=["AIGC 代理"])

# 由 app.py 在启动时注入
_scenes: Dict[str, Any] = {}


def init_scenes(scenes: Dict[str, Any]) -> None:
    """注入场景配置字典"""
    global _scenes
    _scenes = scenes


@router.post(
    "/proxy",
    summary="代理 AIGC OpenAPI",
    description=(
        "通过火山引擎 SDK 签名认证，代理请求到 `rtc.volcengineapi.com`。\n\n"
        "**支持的 Action（Query 参数）：**\n"
        "- **StartVoiceChat** — 启动 AI Agent 加入 RTC 房间\n"
        "- **StopVoiceChat** — 停止 AI Agent\n\n"
        "请求体只需传入 `SceneID`，服务端会根据场景配置自动构造完整参数并签名转发。"
    ),
    response_model=WrapperResponse,
    responses={
        400: {"description": "请求参数错误（SceneID 不存在、凭证未配置等）"},
    },
)
async def proxy_aigc(
    body: ProxyRequest,
    Action: str = Query(
        ..., description="API 动作（StartVoiceChat | StopVoiceChat）"
    ),
    Version: str = Query(
        "2024-12-01", description="API 版本",
    ),
):
    scene_id = body.SceneID
    scene_data = _scenes.get(scene_id)
    if not scene_data:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={
                    "Code": -1,
                    "Message": (
                        f"场景 '{scene_id}' 不存在，"
                        "请先在 server/scenes/ 目录下定义该场景的 JSON 配置"
                    ),
                },
            ),
        )

    voice_chat = scene_data.get("VoiceChat", {})
    account_config = scene_data.get("AccountConfig", {})

    access_key_id = account_config.get("accessKeyId", "")
    secret_key = account_config.get("secretKey", "")

    if not access_key_id or not secret_key:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={
                    "Code": -1,
                    "Message": (
                        "AccountConfig.accessKeyId 或 "
                        "AccountConfig.secretKey 未配置"
                    ),
                },
            ),
        )

    # 根据 Action 构造转发体
    if Action == "StartVoiceChat":
        proxy_body = build_start_body(voice_chat)
    elif Action == "StopVoiceChat":
        app_id = voice_chat.get("AppId", "")
        room_id = voice_chat.get("RoomId", "")
        task_id = voice_chat.get("TaskId", "")

        missing = []
        if not app_id:
            missing.append("VoiceChat.AppId")
        if not room_id:
            missing.append("VoiceChat.RoomId")
        if not task_id:
            missing.append("VoiceChat.TaskId")
        if missing:
            return JSONResponse(
                status_code=400,
                content=wrapper_response(
                    success=False,
                    action=Action,
                    error={
                        "Code": -1,
                        "Message": f"缺少必填字段: {', '.join(missing)}",
                    },
                ),
            )

        proxy_body = build_stop_body(voice_chat)
    else:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={"Code": -1, "Message": f"不支持的 Action: {Action}"},
            ),
        )

    # 签名并转发
    result = await proxy_request(
        Action, Version, access_key_id, secret_key, proxy_body
    )

    is_success = "Result" in result or "TaskId" in str(result)
    return JSONResponse(
        content=wrapper_response(
            success=is_success,
            action=Action,
            result=result,
        )
    )
