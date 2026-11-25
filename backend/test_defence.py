
from ai_engine.defence import analyze_defence


allegation = (
    "A bank transaction was made "
    "without authorization."
)


evidence = [

    {
        "id": 1,
        "filename": "bank_statement.txt",
        "text": (
            "A bank transaction of INR 500000 "
            "was recorded on 12 November."
        )
    },

    {
        "id": 2,
        "filename": "employee_statement.txt",
        "text": (
            "I did not authorize the transaction."
        )
    },

    {
        "id": 3,
        "filename": "approval_record.txt",
        "text": (
            "The approval document requires "
            "verification by the finance department."
        )
    }
]


result = analyze_defence(allegation, evidence)


print("\n===== DEFENCE AI =====")

print("\nSUMMARY:")
print(result["summary"])

print("\nDEFENCE QUESTIONS:")

for item in result["questions"]:

    print("\nQuestion:", item["question"])

    print("Reason:", item["reason"])


print("\nEVIDENCE TO REVIEW:")

for item in result["evidence_to_review"]:

    print("\nFilename:", item["filename"])

    print("Observation:", item["observation"])


print("\nDISCLAIMER:")
print(result["disclaimer"])
