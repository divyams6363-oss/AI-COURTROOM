
from ai_engine.reasoning import (
    tokenize,
    get_similarity,
    get_relevance,
    extract_sentences,
    get_top_terms
)

allegation = "A bank transaction was made without authorization"

evidence = "A bank transaction was recorded without approval."

print("TOKENS:")
print(tokenize(allegation))

print("\nSIMILARITY:")
print(get_similarity(allegation, evidence))

print("\nRELEVANCE:")
print(get_relevance(allegation, evidence))

print("\nSENTENCES:")
print(extract_sentences(evidence))

print("\nTOP TERMS:")
print(get_top_terms(evidence))
