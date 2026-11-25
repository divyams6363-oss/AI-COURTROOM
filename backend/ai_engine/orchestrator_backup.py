
from .prosecutor import analyze_prosecution
from .defence import analyze_defence
from .devil_advocate import analyze_devils_advocate
from .blind_spot import detect_blind_spots
from .judge import assess_case


def run_courtroom(case, evidence_list):

    # Get the allegation
    allegation = (
        case.get("allegation")
        or case.get("description")
        or "No allegation supplied."
    )

    # 1. Prosecution AI
    prosecution = analyze_prosecution(
        allegation,
        evidence_list
    )

    # 2. Defence AI
    defence = analyze_defence(
        allegation,
        evidence_list
    )

    # 3. Devil's Advocate AI
    devil_advocate = analyze_devils_advocate(
        allegation,
        evidence_list
    )

    # 4. Blind Spot Detector
    blind_spots = detect_blind_spots(
        allegation,
        evidence_list
    )

    # 5. AI Judge
    judge = assess_case(
        allegation,
        evidence_list,
        prosecution,
        defence,
        devil_advocate,
        blind_spots
    )

    # Combine all results
    return {

        "case_id": case.get("id"),

        "case_title": case.get("title"),

        "prosecution": prosecution,

        "defence": defence,

        "devil_advocate": devil_advocate,

        "blind_spots": blind_spots,

        "judge": judge,

        "engine": {

            "name": "VERITAS AI Reasoning Engine",

            "version": "1.0",

            "mode": "offline_heuristic",

            "model_based": False
        },

        "disclaimer": (
            "Automated analysis is for investigative "
            "assistance only. It does not establish facts "
            "or determine legal guilt."
        )
    }
