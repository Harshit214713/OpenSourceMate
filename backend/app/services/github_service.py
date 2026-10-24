import httpx

from app.services.github_client import (
    GITHUB_API_URL,
    MAX_REPOSITORY_PAGES,
    REPOS_PER_PAGE,
    get_github_headers,
    raise_for_github_response,
)


async def get_github_user(username: str):
    url = f"{GITHUB_API_URL}/users/{username}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=get_github_headers())

    if response.status_code == 404:
        return None

    raise_for_github_response(response)
    return response.json()


async def get_user_repositories(username: str):
    """
    Fetch public repositories for a user, following pagination.

    Caps at MAX_REPOSITORY_PAGES * REPOS_PER_PAGE (default 300) so large
    profiles stay responsive.
    """
    repositories: list[dict] = []

    async with httpx.AsyncClient() as client:
        for page in range(1, MAX_REPOSITORY_PAGES + 1):
            url = f"{GITHUB_API_URL}/users/{username}/repos"
            params = {
                "per_page": REPOS_PER_PAGE,
                "sort": "updated",
                "page": page,
            }

            response = await client.get(
                url,
                params=params,
                headers=get_github_headers(),
            )

            if response.status_code == 404:
                return None

            raise_for_github_response(response)

            page_repos = response.json()
            if not isinstance(page_repos, list):
                break

            repositories.extend(page_repos)

            if len(page_repos) < REPOS_PER_PAGE:
                break

    return repositories
