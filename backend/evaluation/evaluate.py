"""Compare issue rankings against the hand-labelled set.

Run from the backend folder:  python -m evaluation.evaluate
Prints precision@5 (relevance 2 counts as relevant) and NDCG@5 per profile for
the old score, the keyword/TF-IDF baseline, and baseline plus embeddings (only
when sentence-transformers is installed and OSM_USE_EMBEDDINGS=true).
"""

import json
import math
from pathlib import Path

from app.services.embedding_service import similarities
from app.services.matching_service import build_idf, calculate_issue_score

DATA = Path(__file__).with_name("labelled_issues.json")
K = 5


def old_score(issue: dict, skills: list[dict]) -> float:
    """The scoring before this change: language always matched, text was never read."""
    names = {s["name"].lower() for s in skills}
    score = 40 if (issue.get("language") or "").lower() in names else 0
    score += 25  # every result carries the good first issue label
    if issue.get("comments", 0) <= 10:
        score += 10
    return score


def precision_at_k(ranked: list[dict], k: int = K) -> float:
    return sum(1 for i in ranked[:k] if i["relevance"] == 2) / k


def ndcg_at_k(ranked: list[dict], k: int = K) -> float:
    def dcg(items):
        return sum(
            (2 ** i["relevance"] - 1) / math.log2(n + 2)
            for n, i in enumerate(items[:k])
        )

    ideal = dcg(sorted(ranked, key=lambda i: -i["relevance"]))
    return dcg(ranked) / ideal if ideal else 0.0


def rank(issues: list[dict], scores: list[float]) -> list[dict]:
    # Ties keep the original (search) order, so the result is stable.
    order = sorted(range(len(issues)), key=lambda n: -scores[n])
    return [issues[n] for n in order]


def rankings(profile: dict) -> dict[str, list[dict]]:
    skills, issues = profile["skills"], profile["issues"]
    idf = build_idf(issues, skills)

    result = {
        "old": rank(issues, [old_score(i, skills) for i in issues]),
        "baseline": rank(
            issues,
            [calculate_issue_score(i, skills, idf)["raw_score"] for i in issues],
        ),
    }

    semantic = similarities(skills, issues)
    if semantic is not None:
        result["embeddings"] = rank(
            issues,
            [
                calculate_issue_score(i, skills, idf, semantic[n])["raw_score"]
                for n, i in enumerate(issues)
            ],
        )

    return result


def main() -> None:
    profiles = json.loads(DATA.read_text(encoding="utf-8"))["profiles"]
    totals: dict[str, list[tuple[float, float]]] = {}

    print(f"{'profile':<18}{'method':<12}{'P@5':>6}{'NDCG@5':>9}")

    for profile in profiles:
        for method, ranked in rankings(profile).items():
            p, n = precision_at_k(ranked), ndcg_at_k(ranked)
            totals.setdefault(method, []).append((p, n))
            print(f"{profile['name']:<18}{method:<12}{p:>6.2f}{n:>9.2f}")

    print()
    for method, values in totals.items():
        print(
            f"{'average':<18}{method:<12}"
            f"{sum(v[0] for v in values) / len(values):>6.2f}"
            f"{sum(v[1] for v in values) / len(values):>9.2f}"
        )


if __name__ == "__main__":
    main()
