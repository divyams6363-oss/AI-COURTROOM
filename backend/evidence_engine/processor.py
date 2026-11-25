from pathlib import Path

try:
    from .extractor import extract_text
    from .metadata import create_metadata
    from .timeline import extract_dates
    from .audit import record_activity
except ImportError:
    from extractor import extract_text
    from metadata import create_metadata
    from timeline import extract_dates
    from audit import record_activity


def process_evidence(file_path: str, performed_by: str = "system") -> dict:
    path = Path(file_path)

    # Extract document text
    extracted_text = extract_text(str(path))

    # Generate evidence metadata and SHA-256 hash
    metadata = create_metadata(str(path))

    # Extract dates for the timeline
    timeline_events = extract_dates(extracted_text)

    # Record chain-of-custody activity
    record_activity(
        evidence_id=metadata["evidence_id"],
        action="UPLOAD_AND_PROCESS",
        performed_by=performed_by,
        details=f"Processed file: {path.name}"
    )

    return {
        "metadata": metadata,
        "extracted_text": extracted_text,
        "timeline": timeline_events,
        "processing_status": "success"
    }