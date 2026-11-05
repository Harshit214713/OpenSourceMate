import type { GitHubUserProfile, SkillItem, UserSkillsResponse } from "./api";

/**
 * State representing an individual user's fetched profile and skill data in comparison mode.
 */
export interface UserComparisonState {
  username: string;
  loading: boolean;
  error: string | null;
  profile: GitHubUserProfile | null;
  skills: UserSkillsResponse | null;
}

/**
 * Detailed representation of a technical skill shared between two developers.
 */
export interface SharedSkillItem {
  name: string;
  user1RepositoryCount: number;
  user1Percentage: number;
  user2RepositoryCount: number;
  user2Percentage: number;
  totalCombinedRepositories: number;
  ratio: number; // user1 ratio vs user2 (e.g. 0.5 is equal, > 0.5 user1 dominant)
  dominantUser: "user1" | "user2" | "equal";
}

/**
 * Summary metrics and breakdown of two compared profiles.
 */
export interface ProfileComparisonSummary {
  user1: {
    username: string;
    totalRepositoriesAnalyzed: number;
    totalSkillsCount: number;
  };
  user2: {
    username: string;
    totalRepositoriesAnalyzed: number;
    totalSkillsCount: number;
  };
  sharedSkills: SharedSkillItem[];
  uniqueSkillsUser1: SkillItem[];
  uniqueSkillsUser2: SkillItem[];
  similarityScore: number; // 0 to 100 percentage
  totalUniqueSkillsCombined: number;
}
