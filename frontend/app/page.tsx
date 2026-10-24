"use client";

import { useState, useMemo } from "react";
import GitHubLink from "../components/GitHubLink";

type Profile = {
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repositories: number;
  followers: number;
  following: number;
  profile_url: string;
};

type Skill = {
  name: string;
  repository_count: number;
  percentage: number;
};

type SkillsData = {
  skills: Skill[];
  total_repositories_analyzed: number;
};

type Recommendation = {
  id: number;
  title: string;
  repository: string;
  url: string;
  state: string;
  labels: string[];
  comments: number;
  created_at: string;
  updated_at: string;
  language: string;
  score: number;
  reasons: string[];
};

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMatching, setLoadingMatching] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<SkillsData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [error, setError] = useState("");
  const [matchingError, setMatchingError] = useState("");
  const [rateLimitedNotice, setRateLimitedNotice] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter states
  const [languageFilter, setLanguageFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const analyzeProfile = async () => {
    const cleanUsername = username.trim().replace(/^@/, "");

    if (!cleanUsername) {
      setError("Please enter a GitHub username.");
      return;
    }

    const usernamePattern =
      /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

    if (!usernamePattern.test(cleanUsername)) {
      setError(
        "Invalid GitHub username. Use up to 39 letters, numbers, or single hyphens; don't start or end with a hyphen."
      );
      return;
    }

    if (loading) return;

    setUsername(cleanUsername);
    setLoading(true);
    setError("");
    setMatchingError("");
    setRateLimitedNotice(false);

    try {
      if (!API_URL) {
        throw new Error(
          "The analyzer is not configured right now. Please try again later."
        );
      }

      // 1. Fetch Profile
      const profileResponse = await fetch(
        `${API_URL}/api/github/users/${encodeURIComponent(cleanUsername)}`
      );

      if (profileResponse.status === 404) {
        setError("GitHub user not found. Check the username and try again.");
        return;
      }

      if (profileResponse.status === 429) {
        setError(
          "GitHub API rate limit reached. Please try again in a few minutes."
        );
        return;
      }

      if (!profileResponse.ok) {
        const errorJson = await profileResponse.json().catch(() => null);
        if (
          errorJson?.detail &&
          typeof errorJson.detail === "string" &&
          errorJson.detail.toLowerCase().includes("rate limit")
        ) {
          setError(
            "GitHub API rate limit reached. Please try again in a few minutes."
          );
          return;
        }
        throw new Error(
          "Unable to retrieve this GitHub profile. Please try again."
        );
      }

      const profileData: Profile = await profileResponse.json();

      // 2. Fetch Skills
      const skillsResponse = await fetch(
        `${API_URL}/api/github/users/${encodeURIComponent(cleanUsername)}/skills`
      );

      if (skillsResponse.status === 429) {
        setError(
          "GitHub API rate limit reached. Please try again in a few minutes."
        );
        return;
      }

      if (!skillsResponse.ok) {
        const errorJson = await skillsResponse.json().catch(() => null);
        if (
          errorJson?.detail &&
          typeof errorJson.detail === "string" &&
          errorJson.detail.toLowerCase().includes("rate limit")
        ) {
          setError(
            "GitHub API rate limit reached. Please try again in a few minutes."
          );
          return;
        }
        throw new Error(
          "Unable to analyze this profile's skills. Please try again."
        );
      }

      const skillsData: SkillsData = await skillsResponse.json();

      // Set profile and skills on success
      setProfile(profileData);
      setSkills(skillsData);

      // 3. Fetch Recommendations
      fetchMatchedIssues(cleanUsername);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Unable to connect to server. Check your connection and ensure the backend is running."
        );
      } else if (err instanceof Error) {
        if (err.message.toLowerCase().includes("rate limit")) {
          setError(
            "GitHub API rate limit reached. Please try again in a few minutes."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedIssues = async (targetUsername: string) => {
    setLoadingMatching(true);
    setMatchingError("");
    setRateLimitedNotice(false);

    try {
      const matchResponse = await fetch(
        `${API_URL}/api/matching/users/${encodeURIComponent(targetUsername)}/issues`
      );

      if (matchResponse.status === 429) {
        setRateLimitedNotice(true);
        setMatchingError(
          "GitHub API rate limit reached while searching for issues. Recommendations could not be loaded."
        );
        return;
      }

      if (!matchResponse.ok) {
        const errorJson = await matchResponse.json().catch(() => null);
        if (
          errorJson?.detail &&
          typeof errorJson.detail === "string" &&
          errorJson.detail.toLowerCase().includes("rate limit")
        ) {
          setRateLimitedNotice(true);
          setMatchingError(
            "GitHub API rate limit reached while searching for issues. Try again in a few minutes."
          );
          return;
        }
        setMatchingError(
          "Unable to load matched issues right now. Please try again later."
        );
        return;
      }

      const matchData = await matchResponse.json();
      setRecommendations(matchData.recommendations || []);
      if (matchData.rate_limited) {
        setRateLimitedNotice(true);
      }
    } catch (mErr) {
      if (mErr instanceof TypeError) {
        setMatchingError(
          "Unable to connect to the issue matching service. Check your connection."
        );
      } else {
        setMatchingError(
          "Unable to load matching issues. Please try again later."
        );
      }
    } finally {
      setLoadingMatching(false);
    }
  };

  // Filter calculation
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    recommendations.forEach((rec) => {
      if (rec.language) langs.add(rec.language);
    });
    return Array.from(langs).sort();
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      if (
        languageFilter !== "all" &&
        rec.language?.toLowerCase() !== languageFilter.toLowerCase()
      ) {
        return false;
      }

      if (labelFilter === "good-first-issue") {
        const hasGFI = rec.labels?.some((l) =>
          l.toLowerCase().includes("good first issue")
        );
        if (!hasGFI) return false;
      } else if (labelFilter === "help-wanted") {
        const hasHW = rec.labels?.some((l) =>
          l.toLowerCase().includes("help wanted")
        );
        if (!hasHW) return false;
      }

      if (rec.score < minScoreFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = rec.title?.toLowerCase().includes(q);
        const matchesRepo = rec.repository?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRepo) return false;
      }

      return true;
    });
  }, [
    recommendations,
    languageFilter,
    labelFilter,
    minScoreFilter,
    searchQuery,
  ]);

  const hasActiveFilters =
    languageFilter !== "all" ||
    labelFilter !== "all" ||
    minScoreFilter > 0 ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setLanguageFilter("all");
    setLabelFilter("all");
    setMinScoreFilter(0);
    setSearchQuery("");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
              ✦
            </div>

            <span className="text-lg font-semibold tracking-tight">
              OpenSourceMate
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>

            <a href="#analyzer" className="transition hover:text-white">
              Analyzer
            </a>

            <GitHubLink className="transition hover:text-white" />
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:bg-white/10 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#05070d]/95 px-6 py-4 shadow-2xl backdrop-blur-2xl md:hidden">
            <div className="flex flex-col gap-3 text-sm text-gray-300">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-white"
              >
                How it works
              </a>

              <a
                href="#analyzer"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-white"
              >
                Analyzer
              </a>

              <div
                className="rounded-xl px-3 py-2 transition hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <GitHubLink className="transition hover:text-white" />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-20 sm:pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Open-source contribution discovery
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Find the open-source issues
            <span className="block bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
              that fit your skills.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
            OpenSourceMate analyzes your GitHub profile and technical
            experience to help you discover meaningful open-source
            contribution opportunities.
          </p>
        </div>
      </section>

      {/* Analyzer */}
      <section id="analyzer" className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center rounded-2xl border border-white/10 bg-black/20 px-5">
                <span className="mr-3 text-gray-500">@</span>

                <input
                  type="text"
                  placeholder="Enter your GitHub username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      analyzeProfile();
                    }
                  }}
                  className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-gray-600 sm:text-base"
                />
              </div>

              <button
                onClick={analyzeProfile}
                disabled={loading}
                className="rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                {loading ? "Analyzing..." : "Analyze Profile"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-600">
            No GitHub login required • Public profile data only
          </p>
        </div>
      </section>

      {/* Results */}
      {(profile || skills) && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Section heading */}
            <div>
              <p className="text-sm font-medium text-purple-400">
                PROFILE ANALYSIS
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Your developer profile
              </h2>

              <p className="mt-2 text-gray-500">
                Here&apos;s what OpenSourceMate discovered from your GitHub activity.
              </p>
            </div>

            {/* Profile card */}
            {profile && (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5">
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="h-20 w-20 rounded-2xl border border-white/10 object-cover sm:h-24 sm:w-24"
                      />

                      <div>
                        <h3 className="text-xl font-bold sm:text-2xl">
                          {profile.name || profile.username}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          @{profile.username}
                        </p>

                        {profile.bio && (
                          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <a
                      href={profile.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      View GitHub ↗
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                      value={profile.public_repositories}
                      label="Repositories"
                    />

                    <StatCard
                      value={profile.followers}
                      label="Followers"
                    />

                    <StatCard
                      value={profile.following}
                      label="Following"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            {skills && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-medium text-purple-400">
                      TECHNICAL PROFILE
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      Your technical skills
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Detected from your public GitHub repositories.
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    {skills.total_repositories_analyzed} repositories analyzed
                  </div>
                </div>

                {skills.skills.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center">
                    <p className="text-gray-400">
                      We couldn&apos;t detect programming languages from this profile.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    {skills.skills.map((skill) => (
                      <SkillCard key={skill.name} skill={skill} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Section (Issues #40, #46, #47) */}
            <div id="recommendations" className="rounded-3xl border border-purple-500/20 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-300">
                    <span>🎯</span> RECOMMENDATIONS
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight">
                    Matched open-source issues
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm text-gray-400">
                    Opportunities matching your skills and experience, ranked by compatibility score.
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  {recommendations.length > 0 && (
                    <span>
                      Showing {filteredRecommendations.length} of {recommendations.length} issues
                    </span>
                  )}
                </div>
              </div>

              {/* Rate limit warning banner */}
              {rateLimitedNotice && (
                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 sm:text-sm">
                  ⚠️ <strong>GitHub API rate limit reached.</strong> Results may be partial or delayed. Add a <code className="rounded bg-black/40 px-1 py-0.5">GITHUB_TOKEN</code> to your backend environment to increase the rate limit.
                </div>
              )}

              {/* Loading State */}
              {loadingMatching && (
                <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-12 text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                  <p className="text-sm font-medium text-gray-300">
                    Searching GitHub for issues matching your skills...
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Analyzing open issues across repositories for compatibility
                  </p>
                </div>
              )}

              {/* Matching Error State */}
              {!loadingMatching && matchingError && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                  <p className="text-sm font-medium text-red-300">
                    {matchingError}
                  </p>
                  {profile && (
                    <button
                      onClick={() => fetchMatchedIssues(profile.username)}
                      className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                    >
                      Retry Issue Search
                    </button>
                  )}
                </div>
              )}

              {/* Filters Bar (Issue #47) */}
              {!loadingMatching && recommendations.length > 0 && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-black/30 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search issue title or repository..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none placeholder:text-gray-500 focus:border-purple-400/50 sm:text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Language filter */}
                      {availableLanguages.length > 0 && (
                        <select
                          value={languageFilter}
                          onChange={(e) => setLanguageFilter(e.target.value)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 outline-none hover:bg-white/10 sm:text-sm"
                        >
                          <option value="all" className="bg-[#0f121d] text-white">
                            All Languages
                          </option>
                          {availableLanguages.map((lang) => (
                            <option
                              key={lang}
                              value={lang}
                              className="bg-[#0f121d] text-white"
                            >
                              {lang}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Label / difficulty filter */}
                      <select
                        value={labelFilter}
                        onChange={(e) => setLabelFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 outline-none hover:bg-white/10 sm:text-sm"
                      >
                        <option value="all" className="bg-[#0f121d] text-white">
                          All Issue Types
                        </option>
                        <option value="good-first-issue" className="bg-[#0f121d] text-white">
                          Good First Issue
                        </option>
                        <option value="help-wanted" className="bg-[#0f121d] text-white">
                          Help Wanted
                        </option>
                      </select>

                      {/* Min score filter */}
                      <select
                        value={minScoreFilter}
                        onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 outline-none hover:bg-white/10 sm:text-sm"
                      >
                        <option value="0" className="bg-[#0f121d] text-white">
                          All Scores
                        </option>
                        <option value="40" className="bg-[#0f121d] text-white">
                          40%+ Match
                        </option>
                        <option value="60" className="bg-[#0f121d] text-white">
                          60%+ Match
                        </option>
                        <option value="75" className="bg-[#0f121d] text-white">
                          75%+ Match
                        </option>
                      </select>

                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-purple-300 transition hover:bg-white/10 hover:text-white"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Filtered Empty State */}
              {!loadingMatching &&
                !matchingError &&
                recommendations.length > 0 &&
                filteredRecommendations.length === 0 && (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                    <p className="text-sm text-gray-400">
                      No issues match the selected filters.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 inline-block rounded-xl bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

              {/* No recommendations found state */}
              {!loadingMatching &&
                !matchingError &&
                recommendations.length === 0 && (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                    <p className="text-gray-400">
                      No matching open issues found for the detected skills at this time.
                    </p>
                    <p className="mt-2 text-xs text-gray-600">
                      Try exploring other technologies or re-analyzing another username.
                    </p>
                  </div>
                )}

              {/* Recommendations List (Issue #40) */}
              {!loadingMatching && filteredRecommendations.length > 0 && (
                <div className="mt-6 space-y-4">
                  {filteredRecommendations.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-white/5 bg-white/[0.015] px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-medium text-purple-400">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From profile to contribution
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              A simple workflow designed to remove the guesswork from
              getting started with open source.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <StepCard
              number="01"
              icon="⌕"
              title="Analyze your profile"
              description="Connect your public GitHub profile and understand your existing technical experience."
            />

            <StepCard
              number="02"
              icon="✦"
              title="Understand your skills"
              description="OpenSourceMate analyzes your repositories to identify the technologies you already work with."
            />

            <StepCard
              number="03"
              icon="→"
              title="Find your match"
              description="Discover open-source issues that align with your skills and contribution goals."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-14 text-center sm:px-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-black">
            ✦
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Your next contribution is out there.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Stop scrolling through thousands of issues.
            Start contributing to projects where your skills can make an impact.
          </p>

          <button
            onClick={() => {
              document
                .getElementById("analyzer")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-8 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            Analyze My GitHub →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OpenSourceMate</p>

          <p>Built for the open-source community.</p>

          <GitHubLink className="transition hover:text-white">
            View Repository ↗
          </GitHubLink>
        </div>
      </footer>
    </main>
  );
}

/* ---------------------------------- */
/* Reusable Components                */
/* ---------------------------------- */

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
      <p className="text-2xl font-bold tracking-tight">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>
    </div>
  );
}

function SkillCard({
  skill,
}: {
  skill: Skill;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{skill.name}</h4>

          <p className="mt-1 text-xs text-gray-600">
            {skill.repository_count}{" "}
            {skill.repository_count === 1 ? "repository" : "repositories"}
          </p>
        </div>

        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
          {skill.percentage}%
        </span>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-700"
          style={{
            width: `${skill.percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function IssueCard({
  issue,
}: {
  issue: Recommendation;
}) {
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 70) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    }
    if (score >= 40) {
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    }
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  };

  const formattedDate = issue.updated_at
    ? new Date(issue.updated_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-black/30 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          {/* Header metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-purple-300">
              {issue.repository}
            </span>

            {issue.language && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-gray-300">
                {issue.language}
              </span>
            )}

            {formattedDate && (
              <span className="text-gray-500">Updated {formattedDate}</span>
            )}

            <span className="text-gray-500">
              💬 {issue.comments} {issue.comments === 1 ? "comment" : "comments"}
            </span>
          </div>

          {/* Issue title */}
          <h4 className="mt-2 text-base font-semibold leading-snug sm:text-lg">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-purple-300"
            >
              {issue.title}
            </a>
          </h4>

          {/* Labels */}
          {issue.labels && issue.labels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {issue.labels.slice(0, 6).map((label, idx) => {
                const isGoodFirst = label.toLowerCase().includes("good first issue");
                const isHelpWanted = label.toLowerCase().includes("help wanted");
                return (
                  <span
                    key={idx}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isGoodFirst
                        ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : isHelpWanted
                        ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                        : "border border-white/10 bg-white/5 text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Match reasons */}
          {issue.reasons && issue.reasons.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400">
              <p className="font-medium text-gray-300">Why this matches:</p>
              <ul className="mt-1.5 space-y-1">
                {issue.reasons.map((reason, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-purple-400">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right side: Match score badge and View button */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div
            className={`rounded-xl border px-3 py-1.5 text-center text-xs font-semibold tracking-wide ${getScoreBadgeStyle(
              issue.score
            )}`}
          >
            <span className="text-sm font-bold sm:text-base">{issue.score}%</span>
            <span className="block text-[10px] uppercase text-gray-400">
              Match
            </span>
          </div>

          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 transition hover:bg-white hover:text-black"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
          {icon}
        </div>

        <span className="text-xs font-medium tracking-widest text-gray-700">
          {number}
        </span>
      </div>

      <h3 className="mt-7 text-lg font-semibold">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}
