"""
健康检查路由
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..schemas import HealthResponse

router = APIRouter(tags=["系统"])


@router.get(
    "/health",
    summary="健康检查",
    description="检测服务是否正常运行",
    response_model=HealthResponse,
)
async def health_check():
    return JSONResponse(
        content={"status": "ok", "service": "trace-ai-cs-server"}
    )
