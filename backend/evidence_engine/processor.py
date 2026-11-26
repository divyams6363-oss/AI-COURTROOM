
from pathlib import Path

try:
    from .extractor import extract_file
    from .metadata import create_metadata
    from .timeline import extract_dates
    from .graph import build_evidence_graph
    from .audit import record_activity
except ImportError:
    from extractor import extract_file
    from metadata import create_metadata
    from timeline import extract_dates
    from graph import build_evidence_graph
    from audit import record_activity


def process_evidence(
    file_path: str,
    performed_by: str = "system",
    evidence_id: str = None
) -> dict:

    path = Path(file_path)

    if not path.is_file():
        raise FileNotFoundError(str(path))

    # Extract evidence content
    extracted = extract_file(str(path))
    extracted_text = extracted["text"]

    # Generate metadata using the database ID
    metadata = create_metadata(
        str(path),
        evidence_id=evidence_id
    )

    # Extract timeline events
    timeline_events = extract_dates(extracted_text)

    # Build initial evidence graph
    graph = build_evidence_graph([
        {
            "evidence_id": metadata["evidence_id"],
            "filename": metadata["filename"],
            "text": extracted_text
        }
    ])

    # Record chain of custody
    if metadata["evidence_id"]:
        record_activity(
            evidence_id=metadata["evidence_id"],
            action="UPLOAD_AND_PROCESS",
            performed_by=performed_by,
            details=f"Processed {path.name}"
        )

    return {
        "metadata": metadata,
        "extracted_text": extracted_text,
        "timeline": timeline_events,
        "graph": graph,
        "processing_status": "success",
        "warning": extracted.get("warning")
    }
