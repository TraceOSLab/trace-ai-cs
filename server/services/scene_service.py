"""
场景服务 — 构建场景列表、生成 RTC Token
"""

import uuid
import time
from typing import Any, Dict, List, Optional

from ..rtc_token import AccessToken, Privileges
from ..schemas import SceneConfigOut, RTCConfigOut


def build_scene_list(
    scenes: Dict[str, Any], filter_ids: Optional[List[str]] = None
) -> List[dict]:
    """
    根据原始场景配置构建场景列表，并为每个场景生成 RTC Token。
    """
    items: List[dict] = []

    for scene_id, scene_data in scenes.items():
        if filter_ids and scene_id not in filter_ids:
            continue

        scene_config = dict(scene_data.get("SceneConfig", {}))
        rtc_config = scene_data.get("RTCConfig", {})
        voice_chat = scene_data.get("VoiceChat", {})

        app_id = rtc_config.get("AppId", "")
        room_id = rtc_config.get("RoomId", "")
        user_id = rtc_config.get("UserId", "")
        app_key = rtc_config.get("AppKey", "")
        token = rtc_config.get("Token", "")

        if app_id and app_key:
            room_id = room_id or str(uuid.uuid4())
            user_id = user_id or str(uuid.uuid4())
            voice_chat["RoomId"] = room_id
            if "AgentConfig" in voice_chat and voice_chat["AgentConfig"].get(
                "TargetUserId"
            ):
                voice_chat["AgentConfig"]["TargetUserId"][0] = user_id

            key = AccessToken(app_id, app_key, room_id, user_id)
            key.add_privilege(Privileges.SubscribeStream, 0)
            key.add_privilege(Privileges.PublishStream, 0)
            key.expire_time(int(time.time()) + (24 * 3600))
            token = key.serialize()

        agent_config = voice_chat.get("AgentConfig", {})
        llm_cfg = voice_chat.get("Config", {}).get("LLMConfig", {})
        avatar_cfg = voice_chat.get("Config", {}).get("AvatarConfig", {})

        scene_out = SceneConfigOut(
            id=scene_id,
            name=scene_config.get("name", ""),
            icon=scene_config.get("icon", ""),
            botName=agent_config.get("UserId", ""),
            isInterruptMode=voice_chat.get("Config", {}).get("InterruptMode", 0) == 0,
            isVision=llm_cfg.get("VisionConfig", {}).get("Enable", False),
            isScreenMode=llm_cfg.get("VisionConfig", {})
            .get("SnapshotConfig", {})
            .get("StreamType", 0)
            == 1,
            isAvatarScene=avatar_cfg.get("Enabled", False),
            avatarBgUrl=avatar_cfg.get("BackgroundUrl", ""),
        )

        rtc_out = RTCConfigOut(
            AppId=app_id, RoomId=room_id, UserId=user_id, Token=token
        )

        items.append({"scene": scene_out.model_dump(), "rtc": rtc_out.model_dump()})

    return items
