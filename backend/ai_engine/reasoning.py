
import re
from collections import Counter


STOPWORDS = {
    "the", "a", "an", "and", "or", "but",
    "is", "are", "was", "were", "be",
    "to", "of", "in", "on", "at", "for",
    "from", "by", "with", "it", "this",
    "that", "has", "have", "had"
}


def tokenize(text):
    """Convert text into meaningful lowercase words."""

    if not text:
        return []

    words = re.findall(r"[a-zA-Z0-9]+", str(text).lower())

    return [
        word for word in words
        if word not in STOPWORDS and len(word) > 1
    ]


def get_similarity(text_a, text_b):
    """Calculate word overlap using Jaccard similarity."""

    words_a = set(tokenize(text_a))
    words_b = set(tokenize(text_b))

    if not words_a or not words_b:
        return 0.0

    common = words_a.intersection(words_b)
    total = words_a.union(words_b)

    return round(len(common) / len(total), 3)


def get_relevance(claim, evidence_text):
    """Calculate how much of the claim vocabulary appears in evidence."""

    claim_words = set(tokenize(claim))
    evidence_words = set(tokenize(evidence_text))

    if not claim_words or not evidence_words:
        return 0.0

    common = claim_words.intersection(evidence_words)

    return round(len(common) / len(claim_words), 3)


def extract_sentences(text):
    """Separate text into sentences."""

    if not text:
        return []

    sentences = re.split(r"(?<=[.!?])\s+", str(text))

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


def get_top_terms(text, limit=10):
    """Find the most frequently used meaningful words."""

    words = tokenize(text)

    counts = Counter(words)

    return [
        word for word, count in counts.most_common(limit)
    ]


def get_evidence_text(evidence):
    """Extract text from an evidence record."""

    return str(evidence.get("text") or "")


def get_evidence_name(evidence):
    """Get the evidence filename."""

    return (
        evidence.get("filename")
        or f"Evidence {evidence.get('id', 'Unknown')}"
    )


def get_evidence_id(evidence):
    """Get the evidence ID."""

    return evidence.get("id")
