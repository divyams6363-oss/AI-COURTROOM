
import hashlib
from pathlib import Path


def calculate_hash(file_path: str) -> str:
    """
    Calculate the SHA-256 hash of an evidence file.
    Reads the file without modifying it.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Evidence file not found: {path}"
        )

    sha256 = hashlib.sha256()

    with path.open("rb") as evidence_file:
        for chunk in iter(
            lambda: evidence_file.read(4096),
            b""
        ):
            sha256.update(chunk)

    return sha256.hexdigest()
