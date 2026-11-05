# Beginner's Guide to Your First Contribution

Welcome to **OpenSourceMate**! If this is your first time contributing to an open-source project or using Git and GitHub, you are in the right place. This step-by-step tutorial will guide you through the entire process—from finding an issue to getting your pull request reviewed and merged.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Step 1: Find an Issue to Work On](#step-1-find-an-issue-to-work-on)
3. [Step 2: Fork the Repository](#step-2-fork-the-repository)
4. [Step 3: Clone Your Fork Locally](#step-3-clone-your-fork-locally)
5. [Step 4: Configure Upstream Remote](#step-4-configure-upstream-remote)
6. [Step 5: Create a New Branch](#step-5-create-a-new-branch)
7. [Step 6: Make Your Changes](#step-6-make-your-changes)
8. [Step 7: Verify and Test Your Changes](#step-7-verify-and-test-your-changes)
9. [Step 8: Stage and Commit Your Changes](#step-8-stage-and-commit-your-changes)
10. [Step 9: Push to Your Fork](#step-9-push-to-your-fork)
11. [Step 10: Open a Pull Request](#step-10-open-a-pull-request)
12. [Step 11: Respond to Code Review](#step-11-respond-to-code-review)
13. [Common Mistakes & Troubleshooting](#common-mistakes--troubleshooting)
    - [How to Sync Your Fork with Upstream](#how-to-sync-your-fork-with-upstream)
    - [How to Resolve a Merge Conflict](#how-to-resolve-a-merge-conflict)
    - [Accidentally Committed to Main](#accidentally-committed-to-main)

---

## 1. Prerequisites

Before starting, make sure you have:
* A [GitHub Account](https://github.com/).
* **Git** installed on your computer. Verify by opening a terminal and running:
  ```bash
  git --version
  ```
* A code editor (such as [Visual Studio Code](https://code.visualstudio.com/)).
* Git configured with your name and email:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your-email@example.com"
  ```

---

## Step 1: Find an Issue to Work On

1. Browse the [OpenSourceMate Issues](https://github.com/Muskankr/OpenSourceMate/issues).
2. Look for issues labeled [`good first issue`](https://github.com/Muskankr/OpenSourceMate/labels/good%20first%20issue) or [`documentation`](https://github.com/Muskankr/OpenSourceMate/labels/documentation). Read the [Label Guide](docs/LABELS.md) for details on label meanings.
3. Leave a polite comment expressing your interest:
   > *"Hi @maintainer! I would love to work on this issue as my first contribution. Could you please assign it to me?"*
4. Once assigned by a maintainer, you are ready to begin!

---

## Step 2: Fork the Repository

A **fork** is your personal copy of the repository on GitHub under your account.

1. Navigate to the official repository: [https://github.com/Muskankr/OpenSourceMate](https://github.com/Muskankr/OpenSourceMate).
2. Click the **Fork** button in the top-right corner.
3. Keep the default settings and click **Create fork**.
4. You will be redirected to your fork at `https://github.com/YOUR_USERNAME/OpenSourceMate`.

---

## Step 3: Clone Your Fork Locally

Download your copy of the repository to your local computer:

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/OpenSourceMate.git
cd OpenSourceMate
```

---

## Step 4: Configure Upstream Remote

To keep your fork in sync with new changes from the original repository (called `upstream`), configure an upstream remote:

```bash
git remote add upstream https://github.com/Muskankr/OpenSourceMate.git
```

Verify your remotes by running:
```bash
git remote -v
```

You should see:
```text
origin    https://github.com/YOUR_USERNAME/OpenSourceMate.git (fetch)
origin    https://github.com/YOUR_USERNAME/OpenSourceMate.git (push)
upstream  https://github.com/Muskankr/OpenSourceMate.git (fetch)
upstream  https://github.com/Muskankr/OpenSourceMate.git (push)
```

---

## Step 5: Create a New Branch

**Never make changes directly on the `main` branch.** Always create a descriptive branch for your issue:

```bash
# Make sure you are on main and up to date
git checkout main
git pull upstream main

# Create and switch to a new branch (e.g., docs/fix-readme-typo or feat/new-button)
git checkout -b docs/fix-first-contribution-guide
```

Branch naming convention:
- `docs/your-topic` for documentation updates
- `fix/your-topic` for bug fixes
- `feat/your-topic` for new features

---

## Step 6: Make Your Changes

Open the project in your code editor and make your edits. For a first contribution, you might:
- Fix typos or clarify instructions in documentation.
- Improve formatting or fix dead links.
- Add small missing unit tests.

> **Tip**: Keep your pull request focused on solving one specific issue. Avoid making unrelated formatting changes to existing code.

---

## Step 7: Verify and Test Your Changes

Run checks locally to make sure everything passes before submitting:

### If you edited Documentation:
Verify markdown formatting, preview the document in your editor, and check that links work.

### If you edited Backend (Python):
```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

### If you edited Frontend (Next.js/React):
```bash
cd frontend
npm install
npm test
npm run lint
```

---

## Step 8: Stage and Commit Your Changes

Check which files you modified:
```bash
git status
```

Stage the modified files:
```bash
git add docs/example-file.md
```

Commit your changes with a clear message:
```bash
git commit -m "docs: improve first contribution instructions (fixes #127)"
```

### Commit Message Guidelines
We follow Conventional Commits:
- `docs: update documentation`
- `fix: resolve bug in username validation`
- `feat: add new profile badge component`
- `test: add unit tests for skill calculator`

---

## Step 9: Push to Your Fork

Push your feature branch to your GitHub fork:

```bash
git push -u origin docs/fix-first-contribution-guide
```

---

## Step 10: Open a Pull Request

1. Visit your fork on GitHub: `https://github.com/YOUR_USERNAME/OpenSourceMate`.
2. You will see a banner with **Compare & pull request**. Click it!
3. Ensure:
   - **Base repository**: `Muskankr/OpenSourceMate`, **base branch**: `main`
   - **Head repository**: `YOUR_USERNAME/OpenSourceMate`, **compare branch**: `docs/fix-first-contribution-guide`
4. Fill out the pull request template:
   - **Title**: Short and descriptive (e.g., `docs: add step-by-step FIRST_CONTRIBUTION.md for Git beginners (#127)`)
   - **Description**: Explain what changes you made and why.
   - **Issue Reference**: Include `Fixes #127` or `Closes #127` to automatically link the issue.
   - **Checklist**: Check off the applicable review items.
5. Click **Create pull request**.

---

## Step 11: Respond to Code Review

Once submitted:
1. Automated CI tests will run on your PR (linting, tests, build).
2. A maintainer will review your pull request and might request small tweaks or approve it.
3. If changes are requested, simply make the edits on your local branch, commit them, and push:
   ```bash
   git add .
   git commit -m "docs: address maintainer feedback"
   git push origin docs/fix-first-contribution-guide
   ```
   The pull request updates automatically!

Once approved, a maintainer will merge your PR. **Congratulations on your open-source contribution! 🎉**

---

## Common Mistakes & Troubleshooting

### How to Sync Your Fork with Upstream

Before starting a new branch or before submitting your PR, always bring your local `main` up to date with the latest changes:

```bash
# Switch to main
git checkout main

# Fetch latest changes from the official repo
git fetch upstream

# Fast-forward your local main
git merge upstream/main

# Push updated main to your GitHub fork
git push origin main
```

### How to Resolve a Merge Conflict

If another PR was merged while you were working, GitHub may report a merge conflict:

```bash
# On your feature branch:
git checkout docs/your-branch-name

# Merge the latest upstream main into your branch
git fetch upstream
git merge upstream/main
```

1. Git will mark conflicting files. Open the conflicting files in your editor (VS Code highlights conflicts with "Accept Current", "Accept Incoming", or "Accept Both").
2. Resolve the differences, removing conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Save the files, test, and commit the resolution:
   ```bash
   git add resolved-file.md
   git commit -m "chore: resolve merge conflicts with upstream main"
   git push origin docs/your-branch-name
   ```

### Accidentally Committed to Main

If you accidentally committed changes to your local `main` branch instead of a new feature branch:

```bash
# 1. Create a new branch carrying your commits
git branch feat/my-changes

# 2. Reset your local main to match upstream main
git reset --hard upstream/main

# 3. Switch to your new branch and continue working
git checkout feat/my-changes
```

---

## Where to Go Next

- Review [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.
- Explore [ARCHITECTURE.md](ARCHITECTURE.md) to understand how OpenSourceMate is built.
- Check [docs/LABELS.md](docs/LABELS.md) to pick your next task!
