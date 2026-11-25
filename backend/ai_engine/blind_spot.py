
from .reasoning import get_evidence_text


def detect_blind_spots(allegation, evidence_list):

    # Combine all extracted evidence text
    all_text = " ".join(
        get_evidence_text(item)
        for item in evidence_list
    ).lower()

    # Categories to investigate
    checks = [

        {
            "name": "Original transaction record",

            "keywords": [
                "transaction", "bank", "transfer", "payment"
            ],

            "recommendation": (
                "Obtain and verify the original transaction record."
            )
        },

        {
            "name": "Authorization record",

            "keywords": [
                "approval", "authorized",
                "authorization", "approved"
            ],

            "recommendation": (
                "Obtain the relevant approval or authorization trail."
            )
        },

        {
            "name": "Identity information",

            "keywords": [
                "account holder", "employee",
                "identity", "user id"
            ],

            "recommendation": (
                "Verify who had access to the relevant account or system."
            )
        },

        {
            "name": "Timestamp information",

            "keywords": [
                "timestamp", "date", "time", "created at"
            ],

            "recommendation": (
                "Verify original event timestamps and time zones."
            )
        },

        {
            "name": "Independent corroboration",

            "keywords": [
                "audit", "independent",
                "verification", "log"
            ],

            "recommendation": (
                "Look for an independent audit trail or corroborating source."
            )
        },

        {
            "name": "Witness information",

            "keywords": [
                "witness", "statement",
                "testimony", "observed"
            ],

            "recommendation": (
                "Check whether a direct witness account is available."
            )
        }
    ]

    missing = []
    mentioned = []

    # Examine each category
    for check in checks:

        found = any(
            word in all_text
            for word in check["keywords"]
        )

        if found:

            mentioned.append(check["name"])

        else:

            missing.append({

                "item": check["name"],

                "recommendation": check["recommendation"],

                "status": "Not found in extracted text"
            })

    return {

        "title": "Blind Spot Detection",

        "summary": (
            f"Identified {len(missing)} investigation areas "
            "not found in the extracted evidence text."
        ),

        "potential_gaps": missing,

        "mentioned_categories": mentioned,

        "important_limitation": (
            "A keyword not being found does not prove that "
            "the information is absent. It may exist in an image, "
            "unextracted file or different wording."
        )
    }
