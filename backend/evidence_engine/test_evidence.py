
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch

from backend.evidence_engine.extractor import extract_file
from backend.evidence_engine.hashing import calculate_hash
from backend.evidence_engine.integrity import verify_integrity
from backend.evidence_engine.metadata import create_metadata
from backend.evidence_engine.timeline import extract_dates
from backend.evidence_engine.graph import build_evidence_graph
from backend.evidence_engine.audit import (
    record_activity,
    get_audit_history,
    verify_audit_log
)
from backend.evidence_engine.processor import process_evidence


class TestEvidenceEngine(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_file = Path(self.temp_dir.name) / "sample.txt"

        self.test_file.write_text(
            "Court evidence recorded on 15 January 2025.",
            encoding="utf-8"
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    # 1. Text extraction
    def test_text_extraction(self):
        result = extract_file(str(self.test_file))

        self.assertIn("Court evidence", result["text"])
        self.assertEqual(result["filename"], "sample.txt")
        self.assertEqual(result["file_type"], ".txt")

    # 2. SHA256 hashing
    def test_sha256_hash(self):
        result = calculate_hash(str(self.test_file))

        self.assertEqual(len(result), 64)
        self.assertTrue(
            all(c in "0123456789abcdef" for c in result)
        )

    # 3. Integrity verification
    def test_integrity_verification(self):
        original_hash = calculate_hash(str(self.test_file))

        result = verify_integrity(
            str(self.test_file),
            original_hash
        )

        self.assertTrue(result["verified"])

    # 4. Modified evidence detection
    def test_modified_evidence(self):
        original_hash = calculate_hash(str(self.test_file))

        self.test_file.write_text(
            "Modified courtroom evidence.",
            encoding="utf-8"
        )

        result = verify_integrity(
            str(self.test_file),
            original_hash
        )

        self.assertFalse(result["verified"])
        self.assertEqual(result["status"], "MODIFIED")

    # 5. Metadata creation
    def test_metadata(self):
        metadata = create_metadata(
            str(self.test_file),
            evidence_id="E001"
        )

        self.assertEqual(metadata["evidence_id"], "E001")
        self.assertEqual(metadata["filename"], "sample.txt")
        self.assertEqual(metadata["processing_status"], "processed")
        self.assertEqual(len(metadata["sha256"]), 64)

    # 6. Timeline extraction
    def test_timeline(self):
        text = (
            "Payment recorded on 12 November 2026. "
            "Approval received on 13 November 2026."
        )

        result = extract_dates(text)

        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 2)

    # 7. Evidence graph
    def test_evidence_graph(self):
        documents = [
            {
                "evidence_id": "E001",
                "filename": "bank.txt",
                "text": "Transaction TX500 payment approval"
            },
            {
                "evidence_id": "E002",
                "filename": "email.txt",
                "text": "Transaction TX500 payment approval"
            }
        ]

        result = build_evidence_graph(documents)

        self.assertEqual(len(result["nodes"]), 2)
        self.assertEqual(len(result["edges"]), 1)

    # 8. Audit log
    def test_audit_log(self):
        audit_path = Path(self.temp_dir.name) / "audit.json"

        with patch(
            "backend.evidence_engine.audit.AUDIT_FILE",
            audit_path
        ):
            record_activity("E001", "UPLOAD", "Member3")
            history = get_audit_history("E001")

            self.assertEqual(len(history), 1)
            self.assertTrue(verify_audit_log())

    # 9. Complete evidence processing
    def test_complete_processing(self):
        audit_path = Path(self.temp_dir.name) / "audit.json"

        with patch(
            "backend.evidence_engine.audit.AUDIT_FILE",
            audit_path
        ):
            result = process_evidence(
                str(self.test_file),
                "Member3",
                "E001"
            )

        self.assertEqual(
            result["processing_status"],
            "success"
        )

        self.assertEqual(
            result["metadata"]["evidence_id"],
            "E001"
        )

        self.assertIn("sha256", result["metadata"])
        self.assertIn("extracted_text", result)
        self.assertIn("timeline", result)
        self.assertIn("graph", result)


if __name__ == "__main__":
    unittest.main()
