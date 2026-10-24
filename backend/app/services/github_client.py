import os

import httpx


GITHUB_API_URL = "https://api.github.com"
MAX_REPOSITORY_PAGES = 3
REPOS_PER_PAGE = 100


class GitHubAPIError(Exception):
    """Raised when the GitHub API returns an error response."""

    def __init__(
        self,
        message: str,
        status_code: int = 502,
        *,
        rate_limited: bool = False,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.rate_limited = rate_limited


def get_github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    token = os.getenv("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return headers


def raise_for_github_response(response: httpx.Response) -> None:
    if response.status_code == 404:
        return

    if response.status_code == 403:
        remaining = response.headers.get("X-RateLimit-Remaining")
        if remaining == "0" or "rate limit" in response.text.lower():
            raise GitHubAPIError(
                "GitHub API rate limit reached. Please try again in a few minutes.",
                status_code=429,
                rate_limited=True,
            )

    if response.status_code == 401:
        raise GitHubAPIError(
            "GitHub authentication failed. Check GITHUB_TOKEN.",
            status_code=401,
        )

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise GitHubAPIError(
            f"GitHub API request failed with status {response.status_code}.",
            status_code=502,
        ) from exc
