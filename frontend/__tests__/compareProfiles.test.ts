import {
  computeProfileComparison,
  normalizeSkillName,
} from "../utils/compareProfiles";
import type { UserSkillsResponse } from "../types/api";

describe("compareProfiles utility", () => {
  describe("normalizeSkillName", () => {
    it("lowercases and trims skill names", () => {
      expect(normalizeSkillName("  TypeScript  ")).toBe("typescript");
      expect(normalizeSkillName("PYTHON")).toBe("python");
      expect(normalizeSkillName("Next.js")).toBe("next.js");
    });
  });

  describe("computeProfileComparison", () => {
    it("handles null or undefined inputs safely", () => {
      const result = computeProfileComparison("user1", null, "user2", undefined);

      expect(result.user1.username).toBe("user1");
      expect(result.user2.username).toBe("user2");
      expect(result.sharedSkills).toHaveLength(0);
      expect(result.uniqueSkillsUser1).toHaveLength(0);
      expect(result.uniqueSkillsUser2).toHaveLength(0);
      expect(result.similarityScore).toBe(0);
      expect(result.totalUniqueSkillsCombined).toBe(0);
    });

    it("correctly identifies shared and unique skills with case insensitivity", () => {
      const skills1: UserSkillsResponse = {
        username: "alice",
        total_repositories_analyzed: 10,
        skills: [
          { name: "TypeScript", repository_count: 8, percentage: 80 },
          { name: "React", repository_count: 6, percentage: 60 },
          { name: "Rust", repository_count: 2, percentage: 20 },
        ],
      };

      const skills2: UserSkillsResponse = {
        username: "bob",
        total_repositories_analyzed: 15,
        skills: [
          { name: "typescript", repository_count: 12, percentage: 80 },
          { name: "Python", repository_count: 10, percentage: 66 },
          { name: "React", repository_count: 3, percentage: 20 },
        ],
      };

      const result = computeProfileComparison("alice", skills1, "bob", skills2);

      // Shared skills should be TypeScript and React
      expect(result.sharedSkills).toHaveLength(2);
      const tsSkill = result.sharedSkills.find(
        (s) => s.name.toLowerCase() === "typescript"
      );
      expect(tsSkill).toBeDefined();
      expect(tsSkill?.user1RepositoryCount).toBe(8);
      expect(tsSkill?.user2RepositoryCount).toBe(12);
      expect(tsSkill?.totalCombinedRepositories).toBe(20);
      expect(tsSkill?.dominantUser).toBe("user2");

      const reactSkill = result.sharedSkills.find(
        (s) => s.name.toLowerCase() === "react"
      );
      expect(reactSkill).toBeDefined();
      expect(reactSkill?.user1RepositoryCount).toBe(6);
      expect(reactSkill?.user2RepositoryCount).toBe(3);
      expect(reactSkill?.dominantUser).toBe("user1");

      // Unique to Alice: Rust
      expect(result.uniqueSkillsUser1).toHaveLength(1);
      expect(result.uniqueSkillsUser1[0].name).toBe("Rust");

      // Unique to Bob: Python
      expect(result.uniqueSkillsUser2).toHaveLength(1);
      expect(result.uniqueSkillsUser2[0].name).toBe("Python");

      // Total union = 2 (shared) + 1 (unique1) + 1 (unique2) = 4
      expect(result.totalUniqueSkillsCombined).toBe(4);
      // Similarity: 2 shared / 4 total = 50%
      expect(result.similarityScore).toBe(50);
    });

    it("calculates 100% similarity when skills match completely", () => {
      const skills: UserSkillsResponse = {
        username: "dev1",
        total_repositories_analyzed: 5,
        skills: [
          { name: "Go", repository_count: 4, percentage: 80 },
          { name: "Docker", repository_count: 3, percentage: 60 },
        ],
      };

      const result = computeProfileComparison("dev1", skills, "dev2", skills);

      expect(result.sharedSkills).toHaveLength(2);
      expect(result.uniqueSkillsUser1).toHaveLength(0);
      expect(result.uniqueSkillsUser2).toHaveLength(0);
      expect(result.similarityScore).toBe(100);
    });

    it("calculates 0% similarity when skills are completely disjoint", () => {
      const skills1: UserSkillsResponse = {
        username: "frontend_dev",
        total_repositories_analyzed: 5,
        skills: [{ name: "CSS", repository_count: 5, percentage: 100 }],
      };

      const skills2: UserSkillsResponse = {
        username: "backend_dev",
        total_repositories_analyzed: 5,
        skills: [{ name: "C++", repository_count: 5, percentage: 100 }],
      };

      const result = computeProfileComparison(
        "frontend_dev",
        skills1,
        "backend_dev",
        skills2
      );

      expect(result.sharedSkills).toHaveLength(0);
      expect(result.uniqueSkillsUser1).toHaveLength(1);
      expect(result.uniqueSkillsUser2).toHaveLength(1);
      expect(result.similarityScore).toBe(0);
    });

    it("sorts shared skills by total combined repositories descending", () => {
      const skills1: UserSkillsResponse = {
        username: "dev1",
        total_repositories_analyzed: 10,
        skills: [
          { name: "HTML", repository_count: 2, percentage: 20 },
          { name: "Python", repository_count: 10, percentage: 100 },
        ],
      };

      const skills2: UserSkillsResponse = {
        username: "dev2",
        total_repositories_analyzed: 10,
        skills: [
          { name: "HTML", repository_count: 1, percentage: 10 },
          { name: "Python", repository_count: 8, percentage: 80 },
        ],
      };

      const result = computeProfileComparison("dev1", skills1, "dev2", skills2);

      expect(result.sharedSkills[0].name).toBe("Python");
      expect(result.sharedSkills[0].totalCombinedRepositories).toBe(18);
      expect(result.sharedSkills[1].name).toBe("HTML");
      expect(result.sharedSkills[1].totalCombinedRepositories).toBe(3);
    });
  });
});
