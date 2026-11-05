# OpenSourceMate Roadmap

This document outlines the product roadmap, development milestones, feature statuses, and community planning for **OpenSourceMate**.

---

## 🧭 Product Vision

OpenSourceMate aims to eliminate the friction developers face when getting started in open source. By analyzing a developer's public GitHub history, technical proficiencies, and contribution preferences, OpenSourceMate intelligently pairs contributors with open-source issues that match their skills.

---

## 🚀 Milestones & Feature Status

| Status | Legend |
|---|---|
| 🟢 **Completed** | Implemented, tested, and shipped |
| 🟡 **In Progress** | Actively under development |
| 🔵 **Planned** | Scoped and prioritized for upcoming iterations |
| ⚪ **Future Exploration** | Under evaluation and architectural research |

---

### Phase 1: Developer Profiling & Skill Intelligence (🟢 Completed)

Foundational data ingestion and developer skill analysis:

- 🟢 **GitHub Profile Analysis**: Public user metadata retrieval (repositories, follower stats, bio, avatar).
- 🟢 **Technical Skill Extraction**: Aggregate language bytes across non-fork repositories and compute proportional distribution.
- 🟢 **Skill Grouping & Noise Filtering**: Group related technologies and filter boilerplate noise files (`HTML`, `CSS`, config files).
- 🟢 **Proficiency Tier Calculation**: Categorize detected skills into Beginner, Intermediate, and Advanced tiers.
- 🟢 **Analysis Export**: One-click download of profile and skill analysis in JSON and Markdown formats.
- 🟢 **Recent Searches**: Client-side query caching in `localStorage` for rapid navigation.
- 🟢 **In-Memory TTL Caching**: High-performance backend caching minimizing GitHub API rate limits.

---

### Phase 2: Contribution Discovery & Issue Matching (🟡 In Progress)

Connecting developer skill profiles to curated open GitHub issues:

- 🟢 **Starter Contribution Comment Generator**: One-click claim template tailored to matched languages.
- 🟢 **Issue Bookmarking & Saved Issues Drawer**: Save recommended issues locally for later follow-up.
- 🟢 **Freshness Indicator**: Detect and flag stale issues with no activity for >60 days.
- 🟡 **Skill-Based Issue Matching**: Search open issues tagged `good first issue` matching the developer's top technologies.
- 🟡 **Composite Compatibility Score**: Combine TF-IDF term weighting, language overlap, and difficulty bonuses into a 0–100% score.
- 🟡 **AI-Powered Match Explanations**: Contextual summaries explaining *why* an issue matches the user's skill set.
- 🔵 **Advanced Issue Filters**: Multi-select filtering by difficulty, label, repository size, and license.

---

### Phase 3: Community & Collaboration Hub (🔵 Planned)

Empowering contributors and maintainers to collaborate effectively:

- 🔵 **GitHub Discussions Integration**:
  - **Q&A**: Technical troubleshooting and development help.
  - **Ideas & RFCs**: Community proposals and architectural discussions.
  - **Show & Tell**: Contributors showcase merged pull requests and milestones.
- 🔵 **GitHub Projects Board**: Public triage board visualizing `Backlog`, `Ready for Dev`, `In Progress`, `Under Review`, and `Done`.
- 🔵 **Repository Health & Maintainer Responsiveness Score**: Metrics indicating average review time and response activity on issues.
- 🔵 **Issue Difficulty Estimator**: Automated labeling of issue complexity based on issue description length, linked files, and historical PR turnaround.

---

### Phase 4: Intelligent Agent & Contributor Growth (⚪ Future Exploration)

- ⚪ **Skills to Learn Next Engine**: Recommending complementary frameworks based on detected skills.
- ⚪ **Automated PR Review Assistant**: Linting, style, and testing feedback provided directly in contributor PR drafts.
- ⚪ **Vector Semantic Search**: High-dimensional vector embeddings powered by Sentence Transformers for deep semantic issue matching.

---

## 💬 Community Setup & Discussions Guide

### GitHub Discussions Categories

When GitHub Discussions is enabled for this repository, the following structure is used:

1. **💡 Ideas**: Share feature proposals, UI enhancements, and algorithmic improvements.
2. **🙏 Q&A**: Get help setting up local environments, debugging backend/frontend, or understanding APIs.
3. **🙌 Show and Tell**: Showcase pull requests you've opened or merged using OpenSourceMate recommendations.
4. **📢 Announcements**: Project release updates, milestones, and community news.

#### Welcome Post Template for Maintainers:
```markdown
### Welcome to OpenSourceMate Discussions! 👋

We are thrilled to welcome you to our community! Whether you are a first-time contributor or an experienced open-source maintainer, this space is for you.

- **Have a question?** Start a thread in [Q&A](https://github.com/Muskankr/OpenSourceMate/discussions/categories/q-a).
- **Have an idea or feature request?** Post in [Ideas](https://github.com/Muskankr/OpenSourceMate/discussions/categories/ideas).
- **Want to share your contribution?** We'd love to see it in [Show and Tell](https://github.com/Muskankr/OpenSourceMate/discussions/categories/show-and-tell)!

Please remember to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Happy contributing! 🚀
```

---

## 📋 Projects Board Triage Workflow

A public GitHub Projects board helps track features across release cycles:

1. **📥 Inbox / Triage**: Newly submitted issues awaiting review and triage labels.
2. **🎯 Ready for Dev**: Triaged issues with clear descriptions and labels ready to be claimed.
3. **🏃 In Progress**: Assigned issues actively being worked on by contributors.
4. **🔍 Under Review**: Open pull requests undergoing review and CI verification.
5. **✅ Done**: Merged pull requests and closed issues.
