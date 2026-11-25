
from .reasoning import (
    get_evidence_text,
    get_evidence_name
)


def analyze_defence(allegation, evidence_list):

    questions = [

        {
            "question": "Has the source of the evidence been verified?",

            "reason": (
                "An unverified source may affect "
                "the reliability of the evidence."
            )
        },

        {
            "question": "Is there independent corroboration?",

            "reason": (
                "Multiple independent sources can "
                "strengthen an account."
            )
        },

        {
            "question": "Could there be an alternative explanation?",

            "reason": (
                "The same event may have more than "
                "one possible explanation."
            )
        },

        {
            "question": "Are the timestamps consistent?",

            "reason": (
                "Conflicting dates or times need "
                "further investigation."
            )
        },

        {
            "question": "Does the evidence identify who performed the action?",

            "reason": (
                "Evidence of an event does not automatically "
                "identify the person responsible."
            )
        },

        {
            "question": "Has the original document been examined?",

            "reason": (
                "A copy or extracted text may omit "
                "important information."
            )
        }
    ]

    relevant_items = []

    for item in evidence_list:

        text = get_evidence_text(item)

        if text.strip():

            relevant_items.append({

                "filename": get_evidence_name(item),

                "observation": (
                    "Review this item for context, authenticity, "
                    "possible alternative explanations "
                    "and limitations."
                )
            })

    return {

        "title": "Defence Analysis",

        "summary": (
            "Identified questions and potential weaknesses "
            "that require investigation before accepting "
            "the allegation."
        ),

        "questions": questions,

        "evidence_to_review": relevant_items,

        "disclaimer": (
            "These are investigative questions, "
            "not findings that the allegation is false."
        )
    }
