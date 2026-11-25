
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch

from .extractor import extract_text
from .hashing import calculate_hash
from .integrity import verify_integrity
from .metadata import create_metadata
from .timeline import extract_dates
from .graph import build_evidence_graph
from .audit import record_activity, get_audit_history, verify_audit_log
from .processor import process_evidence

class TestEvidenceEngine(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_file = Path(self.temp_dir.name) / "evidence.txt"
        self.test_file.write_text(
            "Court evidence recorded on January 15, 2025.",
            encoding="utf-8"
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_text_extraction(self):
        result = extract_text(str(self.test_file))
        self.assertIn("Court evidence", result)

    def test_sha256_hash(self):
        result = calculate_hash(str(self.test_file))
        self.assertEqual(len(result), 64)

    def test_integrity_verification(self):
        original_hash = calculate_hash(str(self.test_file))
        result = verify_integrity(str(self.test_file), original_hash)
        self.assertTrue(result["verified"])

    def test_modified_evidence(self):
        original_hash = calculate_hash(str(self.test_file))
        self.test_file.write_text("Modified evidence")
        result = verify_integrity(str(self.test_file), original_hash)
        self.assertFalse(result["verified"])

    def test_metadata(self):
        result = create_metadata(str(self.test_file))
        self.assertIn("evidence_id", result)
        self.assertEqual(result["filename"], "evidence.txt")

    def test_timeline(self):
        result = extract_dates(
            "Incident happened on January 15, 2025."
        )
        self.assertEqual(len(result), 1)

    def test_evidence_graph(self):
        documents = [
            {
                "evidence_id": "E1",
                "filename": "one.txt",
                "text": "contract payment invoice"
            },
            {
                "evidence_id": "E2",
                "filename": "two.txt",
                "text": "invoice payment agreement"
            }
        ]

        result = build_evidence_graph(documents)
        self.assertEqual(len(result["nodes"]), 2)
        self.assertEqual(len(result["edges"]), 1)

    def test_audit_log(self):
         with tempfile.TemporaryDirectory() as folder:
            audit_path = Path(folder) / "audit.json"
            audit_path.parent.mkdir(parents=True, exist_ok=True)

            with patch("evidence_engine.audit.AUDIT_FILE", audit_path):
                record_activity("E001", "UPLOAD", "Member3")
                history = get_audit_history("E001")

                self.assertEqual(len(history), 1)
                self.assertTrue(verify_audit_log())

    def test_complete_processing(self):
        with tempfile.TemporaryDirectory() as folder:
            audit_path = Path(folder) / "audit.json"
            audit_path.parent.mkdir(parents=True, exist_ok=True)

            with patch("evidence_engine.audit.AUDIT_FILE", audit_path): 
                result = process_evidence(
                    str(self.test_file),
                    "Member3"
                )

                self.assertEqual(
                    result["processing_status"], "success"
                )
                self.assertIn("sha256", result["metadata"])
                self.assertIn("extracted_text", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
