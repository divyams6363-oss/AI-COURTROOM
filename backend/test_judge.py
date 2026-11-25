
from ai_engine.judge import assess_case


case_allegation = (
    "A bank transaction was made "
    "without authorization."
)


evidence = [

    {
        "id": 1,
        "filename": "bank_statement.txt",
        "text": "A bank transaction was recorded."
    },

    {
        "id": 2,
        "filename": "employee_statement.txt",
        "text": "I did not authorize the transaction."
    }
]


prosecution = {
    "summary": "Two potentially relevant items identified."
}


defence = {
    "summary": "Several verification questions identified."
}


devil_advocate = {
    "summary": "Alternative explanations need investigation."
}


blind_spots = {
    "potential_gaps": [
        {"item": "Original approval record"},
        {"item": "Independent audit record"}
    ]
}


result = assess_case(
    case_allegation,
    evidence,
    prosecution,
    defence,
    devil_advocate,
    blind_spots
)


print("\n===== VERITAS AI JUDGE =====")

print("\nSTATUS:")
print(result["status"])

print("\nSUMMARY:")
print(result["summary"])

print("\nCASE STATISTICS:")
print(result["case_statistics"])

print("\nPROSECUTION:")
print(result["prosecution_summary"])

print("\nDEFENCE:")
print(result["defence_summary"])

print("\nDEVIL'S ADVOCATE:")
print(result["devil_advocate_summary"])

print("\nHUMAN REVIEW REQUIREMENTS:")

for item in result["issues_requiring_human_review"]:
    print("-", item)

print("\nFINAL NOTICE:")
print(result["final_notice"])
