
import unittest

from ai_engine import run_courtroom


class TestAICourtroom(unittest.TestCase):

    def setUp(self):
        self.case = {
            "id": 1,
            "title": "Unauthorized Transaction",
            "allegation": (
                "A bank transaction was made "
                "without authorization."
            )
        }

        self.evidence = [
            {
                "id": 1,
                "filename": "bank_statement.txt",
                "text": (
                    "A bank transaction was recorded "
                    "without approval."
                )
            },
            {
                "id": 2,
                "filename": "employee_statement.txt",
                "text": (
                    "I was not informed about the payment."
                )
            }
        ]

    def test_analysis_returns_all_modules(self):
        result = run_courtroom(self.case, self.evidence)

        expected_modules = [
            "prosecution",
            "defence",
            "devil_advocate",
            "blind_spots",
            "judge"
        ]

        for module in expected_modules:
            self.assertIn(module, result)

    def test_case_details_are_preserved(self):
        result = run_courtroom(self.case, self.evidence)

        self.assertEqual(result["case_id"], 1)
        self.assertEqual(
            result["case_title"],
            "Unauthorized Transaction"
        )

    def test_engine_metadata(self):
        result = run_courtroom(self.case, self.evidence)

        self.assertEqual(
            result["engine"]["name"],
            "VERITAS AI Reasoning Engine"
        )

        self.assertFalse(
            result["engine"]["model_based"]
        )

    def test_disclaimer_is_present(self):
        result = run_courtroom(self.case, self.evidence)

        self.assertIn("disclaimer", result)
        self.assertTrue(result["disclaimer"])

    def test_empty_evidence_does_not_crash(self):
        result = run_courtroom(self.case, [])

        self.assertIn("judge", result)
        self.assertIn("prosecution", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
