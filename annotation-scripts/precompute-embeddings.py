"""
Pre-compute SBERT embeddings for all microcontents and save them into the JSON file.

This script uses the same model (all-MiniLM-L6-v2) and the same text-building 
logic as the microcontent-service, so that embeddings are identical to what 
would be computed at runtime.

Usage:
  pip install sentence-transformers
  python annotation-scripts/precompute-embeddings.py

The updated JSON is written back to annotation-scripts/output/microcontents-real.json
with 'embedding' and 'embeddingCalculated' fields added to every microcontent.
"""

import json
import os
from sentence_transformers import SentenceTransformer

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(SCRIPT_DIR, 'output', 'microcontents-real.json')

def build_embedding_text(mc):
    """Replicate the JS buildEmbeddingText method."""
    text = mc.get('title', '')

    outcomes = mc.get('learningOutcomes', [])
    if outcomes:
        text += ' ' + ' '.join(outcomes)

    keywords = mc.get('semanticKeywords', [])
    if keywords:
        text += ' ' + ' '.join(keywords[:5])

    return text


def main():
    # Load JSON
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    microcontents = data.get('microcontents', [])
    print(f"Found {len(microcontents)} microcontents")

    # Load SBERT model (same as sbert_service.py)
    print("Loading SBERT model (all-MiniLM-L6-v2) ...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded")

    # Build texts and encode in batch for speed
    texts = [build_embedding_text(mc) for mc in microcontents]
    print("Computing embeddings …")
    embeddings = model.encode(texts, show_progress_bar=True)

    # Attach embeddings to each microcontent
    for mc, emb in zip(microcontents, embeddings):
        mc['embedding'] = emb.tolist()
        mc['embeddingCalculated'] = True

    # Write back
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"✅ Embeddings saved to {JSON_PATH}")
    print(f"   Each embedding has {len(microcontents[0]['embedding'])} dimensions")


if __name__ == '__main__':
    main()
