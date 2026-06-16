"""
场景服务 — 构建场景列表、生成 RTC Token
"""

import uuid
import time
from typing import Dict, Any

from ..token import AccessToken, Privileges
from ..schemas import SceneListItem, SceneConfigOut, RTCConfigOut


def build_scene_list(scenes: Dict[str, Any]) -> list[SceneListItem]:
    """
    根据原始场景配置构建 SceneListItem 列表，并为每个场景生成 RTC Token。

    Args:
        scenes: read_files() 加载的场景字典 {scene_id: scene_data}

    Returns:
        SceneListItem 列表
    """
    items: list[SceneListItem] = []

    for scene_id, scene_data in scenes.items():
        scene_config = dict(scene_data.get("SceneConfig", {}))
        rtc_config = scene_data.get("RTCConfig", {})
        voice_chat = scene_data.get("VoiceChat", {})

        app_id = rtc_config.get("AppId", "")
        room_id = rtc_config.get("RoomId", "")
        user_id = rtc_config.get("UserId", "")
        app_key = rtc_config.get("AppKey", "")
        token = rtc_config.get("Token", "")

        # 如果 AppId 和 AppKey 都存在，重新生成 Token
        if app_id and app_key:
            room_id = room_id or str(uuid.uuid4())
            user_id = user_id or str(uuid.uuid4())

            # 同步更新 VoiceChat 中的 room / user
            voice_chat["RoomId"] = room_id
            if (
                "AgentConfig" in voice_chat
                and voice_chat["AgentConfig"].get("TargetUserId")
            ):
                voice_chat["AgentConfig"]["TargetUserId"][0] = user_id

            key = AccessToken(app_id, app_key, room_id, user_id)
            key.add_privilege(Privileges.SubscribeStream, 0)
            key.add_privilege(Privileges.PublishStream, 0)
            key.expire_time(int(time.time()) + (24 * 3600))
            token = key.serialize()

        # 提取场景元信息
        agent_config = voice_chat.get("AgentConfig", {})
        llm_config = voice_chat.get("Config", {}).get("LLMConfig", {})
        vision_config = llm_config.get("VisionConfig", {})
        avatar_config = voice_chat.get("Config", {}).get("AvatarConfig", {})

        scene_out = SceneConfigOut(
            id=scene_id,
            name=scene_config.get("name", ""),
            icon=scene_config.get("icon", ""),
            botName=agent_config.get("UserId", ""),
            isInterruptMode=voice_chat.get("Config", {}).get("InterruptMode", 0) == 0,
            isVision=vision_config.get("Enable", False),
            isScreenMode=vision_config.get("SnapshotConfig", {}).get("StreamType", 0) == 1,
            isAvatarScene=avatar_config.get("Enabled", False),
            avatarBgUrl=avatar_config.get("BackgroundUrl", ""),
        )

        rtc_out = RTCConfigOut(
            AppId=app_id,
            RoomId=room_id,
            UserId=user_id,
            Token=token,
        )

        items.append(SceneListItem(scene=scene_out, rtc=rtc_out))

    return items
