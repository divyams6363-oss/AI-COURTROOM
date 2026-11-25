
from ai_engine.devil_advocate import analyze_devils_advocate


allegation = (
    "A bank transaction of INR 500000 "
    "was made without authorization."
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
        "filename": "scanned_document.pdf",
        "text": ""
    }
]


result = analyze_devils_advocate(
    allegation,
    evidence
)


print("\n===== DEVIL'S ADVOCATE AI =====")

print("\nSUMMARY:")
print(result["summary"])

print("\nCHALLENGES:")

for challenge in result["challenges"]:

    print("\nIssue:", challenge["issue"])

    print("Challenge:", challenge["challenge"])

    print("Severity:", challenge["severity"])


print("\nDISCLAIMER:")
print(result["disclaimer"])
