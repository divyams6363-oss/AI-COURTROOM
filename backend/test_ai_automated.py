
import unittest
from unittest.mock import patch

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

        self.mock_qwen = patch(
            "ai_engine.orchestrator.generate_ai_analysis",
            return_value={
                "available": True,
                "model": "qwen3.5:4b",
                "analysis": "Mock AI analysis for testing."
            }
        )

        self.mock_qwen.start()
        self.addCleanup(self.mock_qwen.stop)

    def test_analysis_returns_all_modules(self):

        result = run_courtroom(self.case, self.evidence)

        expected_modules = [
            "prosecution",
            "defence",
            "devil_advocate",
            "blind_spots",
            "judge",
            "llm_analysis"
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

        self.assertTrue(
            result["engine"]["model_based"]
        )

        self.assertEqual(
            result["engine"]["llm_model"],
            "qwen3.5:4b"
        )

    def test_disclaimer_is_present(self):

        result = run_courtroom(self.case, self.evidence)

        self.assertIn("disclaimer", result)
        self.assertTrue(result["disclaimer"])

    def test_empty_evidence_does_not_crash(self):

        result = run_courtroom(self.case, [])

        self.assertIn("judge", result)
        self.assertIn("prosecution", result)
        self.assertIn("llm_analysis", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
