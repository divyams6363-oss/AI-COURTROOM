
from .reasoning import (
    get_evidence_text,
    get_evidence_name
)


def analyze_devils_advocate(allegation, evidence_list):

    challenges = []

    # Challenge 1: Is evidence sufficient?
    if not evidence_list:

        challenges.append({
            "issue": "No evidence supplied",

            "challenge": (
                "The allegation cannot be meaningfully "
                "evaluated without supporting evidence."
            ),

            "severity": "high"
        })

    else:

        # Challenge 2: Alternative explanations
        challenges.append({
            "issue": "Alternative explanation",

            "challenge": (
                "Could the observed event have occurred "
                "for a legitimate reason unrelated "
                "to the allegation?"
            ),

            "severity": "medium"
        })

        # Challenge 3: Source independence
        challenges.append({
            "issue": "Source independence",

            "challenge": (
                "Do multiple documents originate from "
                "the same person, database or original source?"
            ),

            "severity": "high"
        })

        # Challenge 4: Missing context
        challenges.append({
            "issue": "Context omission",

            "challenge": (
                "Could surrounding documents, conversations "
                "or transaction history change the interpretation?"
            ),

            "severity": "medium"
        })

        # Challenge 5: Identity assumption
        challenges.append({
            "issue": "Identity assumption",

            "challenge": (
                "Does the evidence identify who performed "
                "the action, or only show that an event occurred?"
            ),

            "severity": "high"
        })

        # Challenge 6: Timeline
        challenges.append({
            "issue": "Chronology",

            "challenge": (
                "Are event times supported by original records "
                "and consistent with one another?"
            ),

            "severity": "medium"
        })

    # Identify evidence items with no extracted text
    empty_items = []

    for item in evidence_list:

        text = get_evidence_text(item)

        if not text.strip():

            empty_items.append(
                get_evidence_name(item)
            )

    if empty_items:

        challenges.append({
            "issue": "Unreadable evidence",

            "challenge": (
                "These items have no extracted text "
                "and require manual inspection: "
                + ", ".join(empty_items)
            ),

            "severity": "high"
        })

    return {

        "title": "Devil's Advocate",

        "summary": (
            "Identified assumptions, alternative explanations "
            "and potential weaknesses that should be examined "
            "before reaching a conclusion."
        ),

        "challenges": challenges,

        "disclaimer": (
            "These challenges are possibilities to investigate, "
            "not proof that the allegation is true or false."
        )
    }
