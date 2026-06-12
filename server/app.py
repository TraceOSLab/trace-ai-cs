"""
Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
SPDX-license-identifier: BSD-3-Clause

Trace AI Conversational Server - 基于 FastAPI 的实时对话式 AI 后端服务
"""

import uuid
import json
import logging
from typing import Any, Dict, Optional

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

from .util import read_files, assert_not_empty, wrapper_response
from collections import OrderedDict
from datetime import datetime

from volcengine.auth.SignerV4 import SignerV4, Request as V4Request
from volcengine.Credentials import Credentials

from dotenv import load_dotenv

from .token import AccessToken, Privileges

# 加载项目根目录的 .env（账号级凭证）
load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 加载场景配置
SCENES = read_files('./scenes', '.json')

# 创建 FastAPI 应用
app = FastAPI(
    title="Trace AI Conversational Server",
    description="基于火山引擎 RTC 的实时对话式 AI 后端服务",
    version="1.0.0",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "service": "trace-ai-cs-server"}


@app.post("/getScenes")
async def get_scenes():
    """
    获取所有场景配置，自动生成 RTC Token

    返回每个场景的 SceneConfig 和 RTCConfig（含自动生成的 Token）
    """
    scenes_result = []
    for scene_id, scene_data in SCENES.items():
        scene_config = scene_data.get("SceneConfig", {})
        rtc_config = scene_data.get("RTCConfig", {})
        voice_chat = scene_data.get("VoiceChat", {})

        app_id = rtc_config.get("AppId", "")
        room_id = rtc_config.get("RoomId", "")
        user_id = rtc_config.get("UserId", "")
        app_key = rtc_config.get("AppKey", "")
        token = rtc_config.get("Token", "")

        # 如果 AppId 和 AppKey 都存在，重新生成 Token（覆盖可能过期或格式错误的旧 Token）
        if app_id and app_key:
            room_id = room_id or str(uuid.uuid4())
            user_id = user_id or str(uuid.uuid4())

            # 更新 VoiceChat 中的 RoomId 和 TargetUserId
            voice_chat["RoomId"] = room_id
            if "AgentConfig" in voice_chat and voice_chat["AgentConfig"].get("TargetUserId"):
                voice_chat["AgentConfig"]["TargetUserId"][0] = user_id

            key = AccessToken(app_id, app_key, room_id, user_id)
            key.add_privilege(Privileges.SubscribeStream, 0)
            key.add_privilege(Privileges.PublishStream, 0)
            key.expire_time(int(__import__('time').time()) + (24 * 3600))
            token = key.serialize()

        # 构建场景信息
        scene_config["id"] = scene_id
        scene_config["botName"] = voice_chat.get("AgentConfig", {}).get("UserId", "")
        scene_config["isInterruptMode"] = voice_chat.get("Config", {}).get("InterruptMode", 0) == 0
        scene_config["isVision"] = voice_chat.get("Config", {}).get("LLMConfig", {}).get("VisionConfig", {}).get("Enable", False)
        scene_config["isScreenMode"] = voice_chat.get("Config", {}).get("LLMConfig", {}).get("VisionConfig", {}).get("SnapshotConfig", {}).get("StreamType", 0) == 1
        scene_config["isAvatarScene"] = voice_chat.get("Config", {}).get("AvatarConfig", {}).get("Enabled", False)
        scene_config["avatarBgUrl"] = voice_chat.get("Config", {}).get("AvatarConfig", {}).get("BackgroundUrl", "")

        scenes_result.append({
            "scene": scene_config,
            "rtc": {
                "AppId": app_id,
                "RoomId": room_id,
                "UserId": user_id,
                "Token": token,
            },
        })

    return JSONResponse(
        content=wrapper_response(
            success=True,
            action="getScenes",
            result={"scenes": scenes_result},
        )
    )


@app.post("/proxy")
async def proxy_aigc(
    request: Request,
    Action: str = Query(..., description="API 动作"),
    Version: str = Query("2024-12-01", description="API 版本"),
):
    """
    代理 AIGC OpenAPI 请求

    支持 StartVoiceChat / StopVoiceChat 等动作
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={"Code": -1, "Message": "请求体必须为 JSON 格式"},
            ),
        )

    scene_id = body.get("SceneID", "")
    try:
        assert_not_empty(scene_id, "SceneID 不能为空, SceneID 用于指定场景的 JSON")
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={"Code": -1, "Message": str(e)},
            ),
        )

    scene_data = SCENES.get(scene_id)
    if not scene_data:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={"Code": -1, "Message": f"{scene_id} 不存在, 请先在 server/scenes 下定义该场景的 JSON"},
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
                error={"Code": -1, "Message": "AccountConfig.accessKeyId 或 AccountConfig.secretKey 不能为空"},
            ),
        )

    # 根据 Action 构造请求体
    proxy_body: Dict[str, Any] = {}
    if Action == "StartVoiceChat":
        proxy_body = voice_chat
    elif Action == "StopVoiceChat":
        app_id = voice_chat.get("AppId", "")
        room_id = voice_chat.get("RoomId", "")
        task_id = voice_chat.get("TaskId", "")

        try:
            assert_not_empty(app_id, "VoiceChat.AppId 不能为空")
            assert_not_empty(room_id, "VoiceChat.RoomId 不能为空")
            assert_not_empty(task_id, "VoiceChat.TaskId 不能为空")
        except ValueError as e:
            return JSONResponse(
                status_code=400,
                content=wrapper_response(
                    success=False,
                    action=Action,
                    error={"Code": -1, "Message": str(e)},
                ),
            )

        proxy_body = {
            "AppId": app_id,
            "RoomId": room_id,
            "TaskId": task_id,
        }
    else:
        return JSONResponse(
            status_code=400,
            content=wrapper_response(
                success=False,
                action=Action,
                error={"Code": -1, "Message": f"不支持的 Action: {Action}"},
            ),
        )

    # 使用火山引擎 SDK 对请求进行签名
    # 参考: https://github.com/volcengine/volc-sdk-python
    signer = SignerV4()
    req = V4Request()
    req.method = 'POST'
    req.host = 'rtc.volcengineapi.com'
    req.path = '/'
    req.headers = OrderedDict()
    req.headers['Host'] = 'rtc.volcengineapi.com'
    req.headers['Content-Type'] = 'application/json'
    req.query = OrderedDict()
    req.query['Action'] = Action
    req.query['Version'] = Version
    req.body = json.dumps(proxy_body)

    credentials = Credentials(
        access_key_id,
        secret_key,
        'rtc',
        'cn-north-1'
    )
    signer.sign(req, credentials)

    # 使用已签名的 headers 发送请求
    url = f"https://rtc.volcengineapi.com?Action={Action}&Version={Version}"
    signed_headers = dict(req.headers)

    logger.info(f"Proxying {Action} request to {url}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers=signed_headers,
            content=req.body,
        )

    try:
        result = response.json()
    except Exception:
        result = {"raw": response.text}

    return JSONResponse(
        content=wrapper_response(
            success=response.status_code < 400,
            action=Action,
            result=result,
        )
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.app:app", host="0.0.0.0", port=3001, reload=True)
