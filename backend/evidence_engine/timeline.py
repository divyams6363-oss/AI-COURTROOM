

import re
from dateutil import parser


DATE_PATTERNS = [
    # YYYY-MM-DD
    r"\b\d{4}-\d{2}-\d{2}\b",

    # DD/MM/YYYY or MM/DD/YYYY
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",

    # November 12, 2026
    r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b",

    # 12 November 2026
    r"\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b",
]


def extract_dates(text: str) -> list:
    """Extract dates and their surrounding evidence context."""

    events = []

    for pattern in DATE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):

            date_text = match.group()

            try:
                parsed_date = parser.parse(date_text)

                start = max(0, match.start() - 100)
                end = min(len(text), match.end() + 100)

                events.append({
                    "date": parsed_date.date().isoformat(),
                    "original_date": date_text,
                    "description": text[start:end].strip()
                })

            except (ValueError, OverflowError):
                continue

    unique_events = {}

    for event in events:
        key = (
            event["date"],
            event["original_date"],
            event["description"]
        )
        unique_events[key] = event

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

            timeline.append({
                **event,
                "evidence_id": evidence_id
            })

    return sorted(
        timeline,
        key=lambda event: event["date"]
    )
