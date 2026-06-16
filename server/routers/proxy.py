"""
代理路由 — 转发 AIGC OpenAPI（StartVoiceChat / StopVoiceChat）
"""

from typing import Dict, Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..schemas import ProxyRequest, WrapperResponse
from ..services import proxy_request
from ..util import wrapper_response

router = APIRouter(tags=["AIGC 代理"])

_scenes: Dict[str, Any] = {}


def init_scenes(scenes: Dict[str, Any]) -> None:
    global _scenes
    _scenes = scenes


@router.post(
    "/proxy",
    summary="代理 AIGC OpenAPI",
    description=(
        "通过火山引擎 SDK 签名，代理请求到 `rtc.volcengineapi.com`。\n\n"
        "**支持的 Action：** `StartVoiceChat` / `StopVoiceChat`（Query 参数）。\n"
        "请求体只需传入 `SceneID`。"
    ),
    response_model=WrapperResponse,
    responses={400: {"description": "参数错误"}},
)
async def proxy_aigc(
    body: ProxyRequest,
    Action: str = Query(..., description="StartVoiceChat | StopVoiceChat"),
    Version: str = Query("2024-12-01", description="API 版本"),
):
    scene_data = _scenes.get(body.SceneID)
    if not scene_data:
        return _err(Action, f"场景 '{body.SceneID}' 不存在")

    voice_chat = scene_data.get("VoiceChat", {})
    account = scene_data.get("AccountConfig", {})
    access_key_id = account.get("accessKeyId", "")
    secret_key = account.get("secretKey", "")

    if not access_key_id or not secret_key:
        return _err(Action, "accessKeyId 或 secretKey 未配置")

    # 根据 Action 构造转发体
    if Action == "StartVoiceChat":
        proxy_body = dict(voice_chat)
    elif Action == "StopVoiceChat":
        app_id = voice_chat.get("AppId", "")
        room_id = voice_chat.get("RoomId", "")
        task_id = voice_chat.get("TaskId", "")
        missing = [f for f in ["AppId", "RoomId", "TaskId"] if not voice_chat.get(f)]
        if missing:
            return _err(Action, f"缺少必填字段: {', '.join(missing)}")
        proxy_body = {"AppId": app_id, "RoomId": room_id, "TaskId": task_id}
    else:
        return _err(Action, f"不支持的 Action: {Action}")

    result = await proxy_request(Action, Version, access_key_id, secret_key, proxy_body)

    return JSONResponse(
        content=wrapper_response(
            success=bool("Result" in result or "TaskId" in str(result)),
            action=Action,
            result=result,
        )
    )


def _err(action: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=wrapper_response(
            success=False, action=action,
            error={"Code": -1, "Message": message},
        ),
    )
