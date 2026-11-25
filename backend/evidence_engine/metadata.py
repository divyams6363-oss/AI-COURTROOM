
from pathlib import Path
from datetime import datetime, timezone

try:
    from .hashing import calculate_hash
except ImportError:
    from hashing import calculate_hash


def create_metadata(
    file_path: str,
    status: str = "processed",
    evidence_id: str = None
) -> dict:

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Evidence file not found: {path}")

    return {
        "evidence_id": evidence_id,
        "filename": path.name,
        "file_size_bytes": path.stat().st_size,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "sha256": calculate_hash(str(path)),
        "processing_status": status,
        "file_type": path.suffix.lower()
    }
