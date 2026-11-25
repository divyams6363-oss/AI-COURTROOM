
from pathlib import Path
from .hashing import calculate_hash


def verify_integrity(
    file_path: str,
    original_hash: str
) -> dict:
    """
    Compare the current evidence hash
    with its originally recorded hash.
    """

    path = Path(file_path)

    if not path.exists():
        return {
            "verified": False,
            "status": "MISSING",
            "message": "Evidence file does not exist."
        }

    current_hash = calculate_hash(file_path)

    is_valid = current_hash == original_hash

    return {
        "verified": is_valid,
        "status": "UNCHANGED" if is_valid else "MODIFIED",
        "original_hash": original_hash,
        "current_hash": current_hash,
        "message": (
            "Evidence integrity verified."
            if is_valid
            else "WARNING: Evidence has been modified!"
        )
    }
