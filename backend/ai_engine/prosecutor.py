
from .reasoning import (
    get_relevance,
    get_evidence_text,
    get_evidence_name,
    get_evidence_id
)


def analyze_prosecution(allegation, evidence_list):

    results = []

    for evidence in evidence_list:

        text = get_evidence_text(evidence)

        if not text.strip():
            continue

        score = get_relevance(allegation, text)

        if score >= 0.15:

            results.append({
                "evidence_id": get_evidence_id(evidence),

                "filename": get_evidence_name(evidence),

                "relevance_score": score,

                "analysis": (
                    "This document shares terminology with "
                    "the allegation and may be relevant "
                    "for further examination."
                ),

                "limitation": (
                    "Vocabulary overlap does not establish "
                    "that the allegation is true."
                )
            })

    results.sort(
        key=lambda item: item["relevance_score"],
        reverse=True
    )

    return {
        "title": "Prosecution Analysis",

        "summary": (
            f"Identified {len(results)} potentially relevant "
            "evidence items for further examination."
        ),

        "relevant_evidence": results,

        "disclaimer": (
            "Relevance is based on text overlap, not proof."
        )
    }
