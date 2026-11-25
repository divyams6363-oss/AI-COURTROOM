
def assess_case(
    allegation,
    evidence_list,
    prosecution,
    defence,
    devil_advocate,
    blind_spots
):

    # Count evidence records
    total = len(evidence_list)

    # Identify records containing extracted text
    readable = [
        item for item in evidence_list
        if str(item.get("text") or "").strip()
    ]

    unreadable = total - len(readable)

    # Get potential information gaps
    potential_gaps = blind_spots.get(
        "potential_gaps", []
    )

    # Determine assessment status
    if total == 0 or len(readable) == 0:

        status = "insufficient_evidence"

        summary = (
            "There is insufficient readable evidence "
            "to meaningfully assess the allegation."
        )

    elif len(readable) < 2 or len(potential_gaps) >= 4:

        status = "inconclusive"

        summary = (
            "Some material is available, but the investigation "
            "has substantial information gaps."
        )

    else:

        status = "requires_human_review"

        summary = (
            "Multiple evidence items are available for examination. "
            "Their authenticity, context, independence and relevance "
            "must be reviewed by a qualified human."
        )

    return {

        "title": "AI Judge Assessment",

        "status": status,

        "summary": summary,

        "case_statistics": {

            "total_evidence": total,

            "readable_evidence": len(readable),

            "unreadable_evidence": unreadable,

            "potential_information_gaps": len(potential_gaps)
        },

        "prosecution_summary": prosecution.get("summary"),

        "defence_summary": defence.get("summary"),

        "devil_advocate_summary": devil_advocate.get("summary"),

        "issues_requiring_human_review": [

            "Verify original evidence sources.",

            "Examine authenticity and integrity.",

            "Check whether sources are independent.",

            "Investigate alternative explanations.",

            "Review missing and conflicting information."
        ],

        "final_notice": (
            "This is an automated investigative assessment, "
            "not a judicial verdict or determination of guilt, "
            "innocence or legal liability."
        )
    }
