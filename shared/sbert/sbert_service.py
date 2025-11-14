from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

app = Flask(__name__)
model = None

def get_model():
    global model
    if model is None:
        print("Loading SBERT model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded")
    return model

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/embedding', methods=['POST'])
def calculate_embedding():
    try:
        data = request.get_json()
        text = data.get('text')
        
        if not text:
            return jsonify({"error": "text is required"}), 400
        
        m = get_model()
        embedding = m.encode([text])[0]
        
        return jsonify({"embedding": embedding.tolist()})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    try:
        data = request.get_json()
        text1 = data.get('text1')
        text2 = data.get('text2')
        
        if not text1 or not text2:
            return jsonify({"error": "text1 and text2 are required"}), 400
        
        m = get_model()
        embeddings = m.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        return jsonify({"similarity": float(similarity)})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get('SBERT_SERVICE_PORT', 3005))
    app.run(host='0.0.0.0', port=port)