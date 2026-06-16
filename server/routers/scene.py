"""
场景路由 — 获取场景列表 + RTC Token
"""

from typing import Dict, Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..services import build_scene_list
from ..util import wrapper_response

router = APIRouter(tags=["场景"])

_scenes: Dict[str, Any] = {}


def init_scenes(scenes: Dict[str, Any]) -> None:
    global _scenes
    _scenes = scenes


@router.post(
    "/getScenes",
    summary="获取场景列表",
    description=(
        "获取所有已加载的场景配置，并为每个场景自动生成 RTC Token。\n\n"
        "Token 使用场景配置中的 AppId + AppKey 通过 HMAC-SHA256 动态生成，"
        "有效期为 24 小时。请求无需参数。"
    ),
)
async def get_scenes():
    return JSONResponse(
        content=wrapper_response(
            success=True,
            action="getScenes",
            result={"scenes": build_scene_list(_scenes)},
        )
    )
