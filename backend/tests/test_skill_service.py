import unittest

from app.services.skill_service import analyze_skills


class TestSkillService(unittest.TestCase):
    def test_analyze_skills_aggregates_languages(self):
        repositories = [
            {"language": "Python"},
            {"language": "Python"},
            {"language": "TypeScript"},
            {"language": None},
        ]

        result = analyze_skills(repositories)

        self.assertEqual(result["total_repositories_analyzed"], 4)
        self.assertEqual(result["skills"][0]["name"], "Python")
        self.assertEqual(result["skills"][0]["repository_count"], 2)
        self.assertEqual(result["skills"][0]["percentage"], 66.67)
        self.assertEqual(result["skills"][1]["name"], "TypeScript")
        self.assertEqual(result["skills"][1]["repository_count"], 1)

    def test_analyze_skills_with_empty_repositories(self):
        result = analyze_skills([])

        self.assertEqual(result["skills"], [])
        self.assertEqual(result["total_repositories_analyzed"], 0)

    def test_analyze_skills_with_no_languages(self):
        repositories = [
            {"language": None},
            {"language": None},
        ]

        result = analyze_skills(repositories)

        self.assertEqual(result["skills"], [])
        self.assertEqual(result["total_repositories_analyzed"], 2)


if __name__ == "__main__":
    unittest.main()
