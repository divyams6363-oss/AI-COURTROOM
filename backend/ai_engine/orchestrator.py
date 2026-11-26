
from .prosecutor import analyze_prosecution
from .defence import analyze_defence
from .devil_advocate import analyze_devils_advocate
from .blind_spot import detect_blind_spots
from .judge import assess_case
from .ollama_client import generate_ai_analysis


def run_courtroom(case, evidence_list):

    allegation = (
        case.get("allegation")
        or case.get("description")
        or "No allegation supplied."
    )

    # 1. Prosecution Analysis
    prosecution = analyze_prosecution(
        allegation,
        evidence_list
    )

    # 2. Defence Analysis
    defence = analyze_defence(
        allegation,
        evidence_list
    )

    # 3. Devil's Advocate Analysis
    devil_advocate = analyze_devils_advocate(
        allegation,
        evidence_list
    )

    # 4. Blind Spot Detection
    blind_spots = detect_blind_spots(
        allegation,
        evidence_list
    )

    # 5. Judge Assessment
    judge = assess_case(
        allegation,
        evidence_list,
        prosecution,
        defence,
        devil_advocate,
        blind_spots
    )

    # 6. Local Qwen AI Analysis
    llm_analysis = generate_ai_analysis(
        allegation,
        evidence_list
    )

    return {
        "case_id": case.get("id"),
        "case_title": case.get("title"),

        "prosecution": prosecution,
        "defence": defence,
        "devil_advocate": devil_advocate,
        "blind_spots": blind_spots,
        "judge": judge,

        "llm_analysis": llm_analysis,

        "engine": {
            "name": "VERITAS AI Reasoning Engine",
            "version": "1.1",
            "mode": "hybrid_local_llm_and_heuristic",
            "model_based": True,
            "llm_model": "qwen3.5:4b",
            "heuristic_modules": True
        },

        "disclaimer": (
            "Automated analysis is for investigative "
            "assistance only. AI-generated observations "
            "require human verification. They do not "
            "establish facts or determine legal guilt."
        )
    }
