from fastapi import APIRouter, HTTPException

from app.services.github_client import GitHubAPIError
from app.services.github_service import get_user_repositories
from app.services.skill_service import analyze_skills
from app.services.issue_service import search_github_issues
from app.services.matching_service import calculate_issue_score


router = APIRouter(
    prefix="/api/matching",
    tags=["Matching"],
)


@router.get("/users/{username}/issues")
async def get_matched_issues(username: str):
    try:
        repositories = await get_user_repositories(username)
    except GitHubAPIError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    skill_data = analyze_skills(repositories)

    user_skills = [
        skill["name"]
        for skill in skill_data["skills"]
    ]

    if not user_skills:
        return {
            "username": username,
            "skills": [],
            "recommendations": [],
        }

    all_issues = []
    rate_limited = False

    # Search issues for the user's top skills.
    for skill in user_skills[:5]:
        try:
            result = await search_github_issues(
                language=skill,
                label="good first issue",
                per_page=10,
            )

            for issue in result["issues"]:
                match = calculate_issue_score(
                    issue,
                    user_skills,
                )

                all_issues.append(
                    {
                        **issue,
                        "match_score": match["score"],
                        "match_reasons": match["reasons"],
                    }
                )

        except GitHubAPIError as exc:
            if exc.rate_limited:
                rate_limited = True
                break
            continue
        except Exception:
            # One failed language search should not
            # break the entire recommendation request.
            continue

    if rate_limited and not all_issues:
        raise HTTPException(
            status_code=429,
            detail=(
                "GitHub API rate limit reached. "
                "Please try again in a few minutes."
            ),
        )

    # Remove duplicate issues.
    unique_issues = {}

    for issue in all_issues:
        unique_issues[issue["id"]] = issue

    recommendations = list(unique_issues.values())

    # Highest compatibility first.
    recommendations.sort(
        key=lambda issue: issue["match_score"],
        reverse=True,
    )

    return {
        "username": username,
        "skills": user_skills,
        "recommendations": recommendations[:20],
        "rate_limited": rate_limited,
    }
