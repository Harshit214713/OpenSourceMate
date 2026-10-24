from fastapi import APIRouter, Query, HTTPException

from app.services.github_client import GitHubAPIError
from app.services.issue_service import search_github_issues


router = APIRouter(
    prefix="/api/issues",
    tags=["Issues"],
)


@router.get("/search")
async def search_issues(
    language: str | None = Query(default=None),
    label: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    per_page: int = Query(default=20, ge=1, le=100),
):
    try:
        data = await search_github_issues(
            language=language,
            label=label,
            keyword=keyword,
            per_page=per_page,
        )

        return {
            "total_count": data["total_count"],
            "issues": data["issues"],
        }

    except GitHubAPIError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search GitHub issues: {exc}",
        ) from exc
