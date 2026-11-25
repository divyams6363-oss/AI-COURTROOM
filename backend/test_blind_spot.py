
from ai_engine.blind_spot import detect_blind_spots


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
    }

]


result = detect_blind_spots(allegation, evidence)


print("\n===== BLIND SPOT DETECTOR =====")

print("\nSUMMARY:")
print(result["summary"])

print("\nPOTENTIAL GAPS:")

for gap in result["potential_gaps"]:

    print("\nItem:", gap["item"])

    print("Status:", gap["status"])

    print("Recommendation:", gap["recommendation"])


print("\nMENTIONED CATEGORIES:")

for item in result["mentioned_categories"]:

    print(item)


print("\nLIMITATION:")
print(result["important_limitation"])
