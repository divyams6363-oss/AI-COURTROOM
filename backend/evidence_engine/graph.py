
import re

STOP_WORDS = {
    "the", "and", "for", "that", "this", "with",
    "from", "was", "were", "are", "has", "had",
    "have", "not", "but", "you", "your", "his",
    "her", "they", "their", "then", "than", "into",
    "about", "also", "document", "file"
}


def get_keywords(text):
    words = re.findall(
        r"\b[a-zA-Z0-9]{3,}\b",
        str(text).lower()
    )
    return {w for w in words if w not in STOP_WORDS}


def build_evidence_graph(documents, min_shared_terms=2):
    nodes = []
    edges = []
    evidence_terms = {}

    for index, document in enumerate(documents):
        evidence_id = document.get("evidence_id")

        if evidence_id is None:
            continue

        node_id = str(evidence_id)
        filename = document.get("filename", "Unknown")

        evidence_terms[node_id] = get_keywords(
            document.get("text", "")
        )

        nodes.append({
            "id": node_id,
            "type": "default",
            "position": {
                "x": (index % 3) * 280,
                "y": (index // 3) * 180
            },
            "data": {
                "label": filename
            }
        })

    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            id_a = nodes[i]["id"]
            id_b = nodes[j]["id"]

            shared = (
                evidence_terms[id_a]
                & evidence_terms[id_b]
            )

            if len(shared) >= min_shared_terms:
                edges.append({
                    "id": f"edge-{id_a}-{id_b}",
                    "source": id_a,
                    "target": id_b,
                    "label": "Potential textual link",
                    "animated": False,
                    "data": {
                        "relationship": "keyword_overlap",
                        "shared_terms": sorted(shared)[:10],
                        "human_verified": False
                    }
                })

    return {
        "nodes": nodes,
        "edges": edges,
        "relationship_count": len(edges),
        "note": (
            "Shared keywords indicate potential textual "
            "relationships, not proven legal connections."
        )
    }
