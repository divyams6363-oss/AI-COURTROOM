
from ai_engine.prosecutor import analyze_prosecution


allegation = (
    "A bank transaction was made "
    "without authorization"
)


evidence = [

    {
        "id": 1,
        "filename": "bank_statement.txt",
        "text": (
            "A bank transaction was recorded "
            "without approval."
        )
    },

    {
        "id": 2,
        "filename": "employee_statement.txt",
        "text": (
            "I was not informed about the payment."
        )
    },

    {
        "id": 3,
        "filename": "holiday_notice.txt",
        "text": (
            "The office will remain closed "
            "during the upcoming holidays."
        )
    }
]


result = analyze_prosecution(allegation, evidence)

print("\n===== PROSECUTION AI =====\n")

print("SUMMARY:")
print(result["summary"])

print("\nRELEVANT EVIDENCE:")

for item in result["relevant_evidence"]:

    print("\nFilename:", item["filename"])

    print("Relevance:", item["relevance_score"])

    print("Analysis:", item["analysis"])

    print("Limitation:", item["limitation"])
