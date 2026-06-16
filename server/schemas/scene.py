"""
场景相关 Schema
"""

from pydantic import BaseModel, Field


class SceneConfigOut(BaseModel):
    """场景展示配置"""
    id: str = Field(..., description="场景标识符")
    name: str = Field("", description="场景显示名称")
    icon: str = Field("", description="场景图标 URL")
    botName: str = Field("", description="AI Bot 的 RTC UserId")
    isInterruptMode: bool = Field(True, description="是否支持语音打断")
    isVision: bool = Field(False, description="是否启用视觉模型")
    isScreenMode: bool = Field(False, description="是否为屏幕共享模式")
    isAvatarScene: bool = Field(False, description="是否为数字人场景")
    avatarBgUrl: str = Field("", description="数字人背景图 URL")


class RTCConfigOut(BaseModel):
    """RTC 配置（含 Token）"""
    AppId: str = Field(..., description="火山引擎 RTC 应用 ID")
    RoomId: str = Field(..., description="RTC 房间 ID")
    UserId: str = Field(..., description="当前用户 ID")
    Token: str = Field(..., description="RTC 接入 Token")
