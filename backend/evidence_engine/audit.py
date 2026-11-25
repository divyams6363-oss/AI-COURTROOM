
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4


AUDIT_FILE = Path(__file__).parent / "audit_log.json"


def record_activity(
    evidence_id: str,
    action: str,
    performed_by: str = "system",
    details: str = ""
) -> dict:
    """Record an evidence activity in the audit log."""

    records = []

    if AUDIT_FILE.exists():
        try:
            records = json.loads(
                AUDIT_FILE.read_text(encoding="utf-8")
            )
        except json.JSONDecodeError:
            raise ValueError("Audit log is corrupted.")

    previous_hash = (
        records[-1]["record_hash"] if records else "GENESIS"
    )

    record = {
        "record_id": str(uuid4()),
        "evidence_id": evidence_id,
        "action": action,
        "performed_by": performed_by,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "previous_hash": previous_hash
    }

    record_string = json.dumps(
        record, sort_keys=True
    )

    record["record_hash"] = hashlib.sha256(
        record_string.encode("utf-8")
    ).hexdigest()

    records.append(record)

    AUDIT_FILE.write_text(
        json.dumps(records, indent=4),
        encoding="utf-8"
    )

    return record


def get_audit_history(evidence_id: str) -> list:
    """Retrieve all activities for one evidence item."""

    if not AUDIT_FILE.exists():
        return []

    records = json.loads(
        AUDIT_FILE.read_text(encoding="utf-8")
    )

    return [
        record for record in records
        if record["evidence_id"] == evidence_id
    ]


def verify_audit_log() -> bool:
    """Check the hash chain for modifications or reordering."""

    if not AUDIT_FILE.exists():
        return True

    records = json.loads(
        AUDIT_FILE.read_text(encoding="utf-8")
    )

    previous_hash = "GENESIS"

    for record in records:
        if record["previous_hash"] != previous_hash:
            return False

        original_hash = record["record_hash"]

        data = {
            key: value
            for key, value in record.items()
            if key != "record_hash"
        }

        record_string = json.dumps(data, sort_keys=True)

        calculated_hash = hashlib.sha256(
            record_string.encode("utf-8")
        ).hexdigest()

        if calculated_hash != original_hash:
            return False

        previous_hash = original_hash

    return True
