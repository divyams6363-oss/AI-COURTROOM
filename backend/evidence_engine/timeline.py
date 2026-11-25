
import re
from datetime import datetime
from dateutil import parser


DATE_PATTERNS = [
    r"\b\d{4}-\d{2}-\d{2}\b",
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
    r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b",
]


def extract_dates(text: str) -> list:
    """Extract dates and their surrounding evidence context."""

    events = []

    for pattern in DATE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            date_text = match.group()

            try:
                parsed_date = parser.parse(
                    date_text,
                    fuzzy=False
                )

                start = max(0, match.start() - 100)
                end = min(len(text), match.end() + 100)

                events.append({
                    "date": parsed_date.date().isoformat(),
                    "original_date": date_text,
                    "description": text[start:end].strip()
                })

            except (ValueError, OverflowError):
                continue

    # Remove duplicate date occurrences
    unique_events = {
        (event["date"], event["original_date"], event["description"]): event
        for event in events
    }

    return sorted(
        unique_events.values(),
        key=lambda event: event["date"]
    )


def generate_timeline(documents: list) -> list:
    """Generate a chronological timeline from evidence documents."""

    timeline = []

    for document in documents:
        text = document.get("text", "")
        evidence_id = document.get("evidence_id", "")

        for event in extract_dates(text):
            event["evidence_id"] = evidence_id
            timeline.append(event)

    return sorted(
        timeline,
        key=lambda event: event["date"]
    )
