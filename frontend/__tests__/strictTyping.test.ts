/**
 * Unit tests verifying TypeScript Strict Mode compliance and type narrowing guards (Issue #139).
 */

import {
  ApiClientError,
  ApiTimeoutError,
  isAbortError,
} from "../utils/apiClient";
import {
  type GitHubUserProfile,
  type UserSkillsResponse,
  type MatchedIssuesResponse,
  type SkillItem,
  type AsyncState,
  assertNonNull,
  isDefined,
  hasProperty,
  safeParseInt,
  safeTrim,
} from "../types/api";
import { type Profile, normalizeWebsiteUrl } from "../components/ProfileCard";

describe("TypeScript Strict Mode Narrowing & Safety Checks (Issue #139)", () => {
  describe("Type guard predicates with unknown inputs", () => {
    it("safely narrows ApiClientError instances from unknown error types", () => {
      const err: unknown = new ApiClientError("Validation failed", 422, "VALIDATION_ERROR");

      if (err instanceof ApiClientError) {
        expect(err.status).toBe(422);
        expect(err.code).toBe("VALIDATION_ERROR");
        expect(err.message).toBe("Validation failed");
      } else {
        throw new Error("Expected err to be recognized as ApiClientError");
      }
    });

    it("correctly handles ApiTimeoutError subclasses", () => {
      const timeoutErr: unknown = new ApiTimeoutError(5000, "/api/github/users/octocat");

      if (timeoutErr instanceof ApiTimeoutError) {
        expect(timeoutErr.status).toBe(408);
        expect(timeoutErr.code).toBe("TIMEOUT_ERROR");
        expect(timeoutErr.name).toBe("ApiTimeoutError");
      } else {
        throw new Error("Expected timeoutErr to be ApiTimeoutError");
      }
    });

    it("safely detects abort errors without any type casting", () => {
      const abortErr: unknown = new DOMException("The user aborted a request.", "AbortError");
      const regularErr: unknown = new Error("Regular network failure");

      expect(isAbortError(abortErr)).toBe(true);
      expect(isAbortError(regularErr)).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });

    it("validates isDefined and assertNonNull guards", () => {
      const val: string | null | undefined = "hello";
      expect(isDefined(val)).toBe(true);
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);

      expect(() => assertNonNull(null)).toThrow(TypeError);
      expect(() => assertNonNull(undefined)).toThrow(TypeError);
      expect(() => assertNonNull("valid")).not.toThrow();
    });

    it("checks strict hasProperty guard against arbitrary unknown objects", () => {
      const data: unknown = { name: "OpenSourceMate", active: true };
      expect(hasProperty(data, "name")).toBe(true);
      expect(hasProperty(data, "missing")).toBe(false);
      expect(hasProperty(null, "name")).toBe(false);
      expect(hasProperty("string", "name")).toBe(false);
    });

    it("evaluates safeParseInt and safeTrim utility helpers", () => {
      expect(safeParseInt("42")).toBe(42);
      expect(safeParseInt("invalid", 10)).toBe(10);
      expect(safeParseInt(null, 5)).toBe(5);
      expect(safeParseInt(12.8)).toBe(12);

      expect(safeTrim("  trimmed  ")).toBe("trimmed");
      expect(safeTrim(null)).toBe("");
      expect(safeTrim(undefined)).toBe("");
    });
  });

  describe("Typed models and nullability checks", () => {
    it("handles GitHubUserProfile objects without any null dereference errors", () => {
      const mockProfileData: GitHubUserProfile = {
        username: "octocat",
        name: null,
        bio: null,
        avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
        public_repositories: 8,
        followers: 12000,
        following: 9,
        profile_url: "https://github.com/octocat",
        company: null,
        location: null,
        blog: null,
        twitter_username: null,
      };

      expect(mockProfileData.username).toBe("octocat");
      expect(mockProfileData.name).toBeNull();
      expect(mockProfileData.bio).toBeNull();
    });

    it("handles UserSkillsResponse and SkillItem array indexing under strictNullChecks", () => {
      const skillsResponse: UserSkillsResponse = {
        username: "octocat",
        skills: [
          { name: "TypeScript", repository_count: 14, percentage: 50.0 },
          { name: "Python", repository_count: 14, percentage: 50.0 },
        ],
        total_repositories_analyzed: 28,
      };

      const skills: SkillItem[] = skillsResponse.skills;
      const firstSkill: SkillItem | undefined = skills[0];

      // Verification under noUncheckedIndexedAccess
      if (firstSkill) {
        expect(firstSkill.name).toBe("TypeScript");
        expect(firstSkill.repository_count).toBe(14);
      } else {
        throw new Error("firstSkill should be defined");
      }

      const outOfBoundsSkill: SkillItem | undefined = skills[99];
      expect(outOfBoundsSkill).toBeUndefined();
    });

    it("validates MatchedIssuesResponse interface with optional properties", () => {
      const matchResponse: MatchedIssuesResponse = {
        username: "octocat",
        recommendations: [
          {
            id: 101,
            title: "Fix strict typing in API client",
            url: "https://github.com/example/repo/issues/101",
            repository: "example/repo",
            state: "open",
            labels: ["good first issue", "typescript"],
            created_at: "2026-11-01T12:00:00Z",
            updated_at: "2026-11-02T12:00:00Z",
            comments: 2,
            score: 0.95,
            reasons: ["Strong TypeScript match"],
          },
        ],
        total: 1,
      };

      expect(matchResponse.total).toBe(1);
      const rec = matchResponse.recommendations[0];
      expect(rec?.score).toBe(0.95);
      expect(rec?.repository).toBe("example/repo");
    });

    it("verifies AsyncState discriminated union transitions", () => {
      const idleState: AsyncState<string> = { status: "idle" };
      const loadingState: AsyncState<string> = { status: "loading" };
      const successState: AsyncState<string> = { status: "success", data: "Data loaded" };
      const errorState: AsyncState<string> = { status: "error", error: new Error("Failed") };

      expect(idleState.status).toBe("idle");
      expect(loadingState.status).toBe("loading");
      if (successState.status === "success") {
        expect(successState.data).toBe("Data loaded");
      }
      if (errorState.status === "error") {
        expect(errorState.error.message).toBe("Failed");
      }
    });
  });

  describe("Utility functions null & undefined safety", () => {
    it("safely normalizes URLs with various falsy and valid inputs", () => {
      expect(normalizeWebsiteUrl("example.com")).toBe("https://example.com");
      expect(normalizeWebsiteUrl("https://github.com")).toBe("https://github.com");
      expect(normalizeWebsiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
      expect(normalizeWebsiteUrl(null)).toBeNull();
      expect(normalizeWebsiteUrl(undefined)).toBeNull();
      expect(normalizeWebsiteUrl("   ")).toBeNull();
    });

    it("verifies Profile interface compatibility", () => {
      const profile: Profile = {
        username: "developer",
        name: "Dev User",
        bio: "Code contributor",
        avatar_url: "https://example.com/avatar.png",
        public_repositories: 25,
        followers: 100,
        following: 50,
        profile_url: "https://github.com/developer",
      };

      expect(profile.username).toBe("developer");
      expect(profile.location).toBeUndefined();
    });
  });
});
