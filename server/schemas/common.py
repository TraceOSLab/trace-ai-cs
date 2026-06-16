"""
通用请求/响应 Schema
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ProxyRequest(BaseModel):
    """AIGC API 代理请求体"""
    SceneID: str = Field(
        ...,
        description="场景标识符，与 scenes/ 目录下的文件名（不含后缀）对应",
        json_schema_extra={"examples": ["Custom"]},
    )


class WrapperResponse(BaseModel):
    """统一响应包装"""
    ResponseMetadata: Dict[str, Any] = Field(
        default_factory=lambda: {"Action": "unknown"},
        description="响应元数据（Action / RequestId / Error）",
    )
    Result: Optional[Dict[str, Any]] = Field(
        None, description="业务数据（成功时存在）"
    )


class ErrorResponse(BaseModel):
    """错误响应"""
    ResponseMetadata: Dict[str, Any] = Field(
        ..., description="包含 Error 信息的元数据"
    )


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = Field("ok", description="服务状态")
    service: str = Field("trace-ai-cs-server", description="服务名称")
