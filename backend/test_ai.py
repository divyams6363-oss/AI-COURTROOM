
from ai_engine import run_courtroom


case = {

    "id": 1,

    "title": "The Missing Transaction",

    "description": "Investigation of a bank transaction.",

    "allegation": (
        "A transaction of INR 500000 "
        "was made without authorization."
    )
}


evidence = [

    {
        "id": 1,

        "filename": "bank_statement.txt",

        "text": (
            "A bank transaction of INR 500000 "
            "was recorded on 12 November."
        ),

        "sha256": "abc123"
    },

    {
        "id": 2,

        "filename": "employee_statement.txt",

        "text": (
            "I did not authorize the payment. "
            "I was not informed about the transaction."
        ),

        "sha256": "def456"
    },

    {
        "id": 3,

        "filename": "approval_record.txt",

        "text": (
            "The approval document requires "
            "verification by the finance department."
        ),

        "sha256": "ghi789"
    }
]


result = run_courtroom(case, evidence)


print("\n========== VERITAS AI ==========")

print("\nCASE:", result["case_title"])

print("\n--- PROSECUTION ---")
print(result["prosecution"])

print("\n--- DEFENCE ---")
print(result["defence"])

print("\n--- DEVIL'S ADVOCATE ---")
print(result["devil_advocate"])

print("\n--- BLIND SPOTS ---")
print(result["blind_spots"])

print("\n--- AI JUDGE ---")
print(result["judge"])

print("\n--- ENGINE ---")
print(result["engine"])
