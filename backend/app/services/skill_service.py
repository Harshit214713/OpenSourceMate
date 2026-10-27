from collections import Counter

# Topic -> skill name. Topics come back with the repo list, so they cost no extra request.
TOPIC_SKILLS = {
    "react": "React",
    "reactjs": "React",
    "nextjs": "Next.js",
    "next-js": "Next.js",
    "vue": "Vue",
    "vuejs": "Vue",
    "angular": "Angular",
    "svelte": "Svelte",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "express": "Express",
    "nodejs": "Node.js",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "machine-learning": "Machine Learning",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "flutter": "Flutter",
    "react-native": "React Native",
    "tailwindcss": "Tailwind CSS",
    "graphql": "GraphQL",
}

# Dependency (lower case package name) -> skill name, for package.json and Python manifests.
DEPENDENCY_SKILLS = {
    "react": "React",
    "next": "Next.js",
    "vue": "Vue",
    "@angular/core": "Angular",
    "svelte": "Svelte",
    "express": "Express",
    "tailwindcss": "Tailwind CSS",
    "react-native": "React Native",
    "graphql": "GraphQL",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "torch": "PyTorch",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "scikit-learn",
    "pandas": "pandas",
    "numpy": "NumPy",
}


def _is_fork(repository: dict) -> bool:
    return bool(repository.get("fork"))


def analyze_skills(
    repositories: list[dict],
    include_forks: bool = False,
    repo_details: dict[str, dict] | None = None,
) -> dict:
    """Build a skill list from a user's repositories.

    repo_details maps a repo full_name to optional extra data fetched separately:
    {"languages": {"Python": 1234}, "dependencies": ["react", "next"]}.
    Missing details are fine, the repo then only contributes its main language and topics.
    """
    repo_details = repo_details or {}
    analyzed = [r for r in repositories if include_forks or not _is_fork(r)]

    languages = Counter()
    frameworks = Counter()

    for repository in analyzed:
        details = repo_details.get(repository.get("full_name") or "", {})
        repo_languages = details.get("languages") or {}

        # /languages knows about every language in the repo, not just the main one.
        if repo_languages:
            for language in repo_languages:
                languages[language] += 1
        elif repository.get("language"):
            languages[repository["language"]] += 1

        repo_skills = set()

        for dependency in details.get("dependencies") or []:
            skill = DEPENDENCY_SKILLS.get(str(dependency).lower())
            if skill:
                repo_skills.add(skill)

        for topic in repository.get("topics") or []:
            skill = TOPIC_SKILLS.get(str(topic).lower())
            if skill:
                repo_skills.add(skill)

        # A repo counts once per skill, even if both a dependency and a topic point at it.
        for skill in repo_skills:
            frameworks[skill] += 1

    language_total = sum(languages.values())
    skills = []

    for name, count in languages.most_common():
        skills.append(
            {
                "name": name,
                "type": "language",
                "repository_count": count,
                "percentage": round((count / language_total) * 100, 2),
            }
        )

    for name, count in frameworks.most_common():
        skills.append(
            {
                "name": name,
                "type": "framework",
                "repository_count": count,
                "percentage": round((count / len(analyzed)) * 100, 2),
            }
        )

    max_count = max((s["repository_count"] for s in skills), default=0)

    for skill in skills:
        skill["weight"] = round(skill["repository_count"] / max_count, 2)

    return {
        "skills": skills,
        "total_repositories_analyzed": len(analyzed),
    }
