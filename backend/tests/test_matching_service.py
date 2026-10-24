import unittest
from datetime import datetime, timedelta, timezone

from app.services.matching_service import calculate_issue_score


class TestMatchingService(unittest.TestCase):
    def test_skill_match_increases_score(self):
        issue = {
            "language": "Python",
            "labels": [],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "comments": 2,
        }

        result = calculate_issue_score(issue, ["Python", "TypeScript"])

        self.assertGreaterEqual(result["score"], 40)
        self.assertTrue(any("Python" in reason for reason in result["reasons"]))

    def test_good_first_issue_and_help_wanted_bonus(self):
        issue = {
            "language": None,
            "labels": ["good first issue", "help wanted"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "comments": 1,
        }

        result = calculate_issue_score(issue, ["Python"])

        self.assertGreaterEqual(result["score"], 40)
        self.assertTrue(
            any("good first issue" in reason for reason in result["reasons"])
        )
        self.assertTrue(
            any(
                "help wanted" in reason.lower()
                or "looking for contributors" in reason
                for reason in result["reasons"]
            )
        )

    def test_recent_activity_bonus(self):
        issue = {
            "language": None,
            "labels": [],
            "updated_at": (
                datetime.now(timezone.utc) - timedelta(days=5)
            ).isoformat().replace("+00:00", "Z"),
            "comments": 20,
        }

        result = calculate_issue_score(issue, ["Python"])

        self.assertGreaterEqual(result["score"], 10)
        self.assertTrue(
            any("active recently" in reason for reason in result["reasons"])
        )

    def test_score_never_exceeds_100(self):
        issue = {
            "language": "Python",
            "labels": ["good first issue", "help wanted"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "comments": 0,
        }

        result = calculate_issue_score(issue, ["Python"])

        self.assertLessEqual(result["score"], 100)

    def test_manageable_comment_count_bonus(self):
        issue = {
            "language": None,
            "labels": [],
            "updated_at": (
                datetime.now(timezone.utc) - timedelta(days=200)
            ).isoformat().replace("+00:00", "Z"),
            "comments": 3,
        }

        result = calculate_issue_score(issue, ["Go"])

        self.assertEqual(result["score"], 10)
        self.assertTrue(
            any(
                "manageable discussion" in reason
                for reason in result["reasons"]
            )
        )


if __name__ == "__main__":
    unittest.main()
