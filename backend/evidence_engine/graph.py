import re
import networkx as nx

STOP_WORDS = {
    "the", "and", "for", "that", "this", "with", "from",
    "was", "were", "are", "has", "had", "have", "not",
    "but", "you", "your", "his", "her", "they", "their",
    "then", "than", "into", "about", "also"
}


def get_keywords(text):
    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
    return {word for word in words if word not in STOP_WORDS}


def build_evidence_graph(documents, min_shared_terms=2):
    graph = nx.Graph()

    for document in documents:
        evidence_id = document.get("evidence_id")
        if evidence_id:
            graph.add_node(
                evidence_id,
                filename=document.get("filename", "Unknown")
            )

    valid_documents = [
        doc for doc in documents if doc.get("evidence_id")
    ]

    for i in range(len(valid_documents)):
        for j in range(i + 1, len(valid_documents)):
            doc_a = valid_documents[i]
            doc_b = valid_documents[j]

            words_a = get_keywords(doc_a.get("text", ""))
            words_b = get_keywords(doc_b.get("text", ""))
            shared = words_a.intersection(words_b)

            if len(shared) >= min_shared_terms:
                graph.add_edge(
                    doc_a["evidence_id"],
                    doc_b["evidence_id"],
                    shared_terms=sorted(shared),
                    similarity=round(
                        len(shared) / len(words_a.union(words_b)), 3
                    ) if words_a.union(words_b) else 0
                )

    return {
        "nodes": [
            {"evidence_id": node, **data}
            for node, data in graph.nodes(data=True)
        ],
        "edges": [
            {"source": source, "target": target, **data}
            for source, target, data in graph.edges(data=True)
        ],
        "note": "Links indicate shared keywords, not proven legal relationships."
    }
