import os
import json
import requests
import time
import shutil

def get_embedding(text, api_key):
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, headers=headers, json={"inputs": text})
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"⚠️ Embedding error: {e}")
        return None

def main():
    print("🔑 Enter your Hugging Face API key:")
    api_key = input("> ").strip()
    if not api_key:
        print("❌ API key required!")
        return
    if not os.path.exists('chunks.json'):
        print("❌ chunks.json not found!")
        print("Run: python chunk_pdfs.py first")
        return
    with open('chunks.json', 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    if not chunks:
        print("❌ No chunks in chunks.json")
        return
    print(f"📚 Processing {len(chunks)} chunks...")
    for i, chunk in enumerate(chunks, 1):
        print(f"⏳ {i}/{len(chunks)}: {chunk.get('source', 'unknown')} (page {chunk.get('page', '?')})")
        embedding = get_embedding(chunk['text'], api_key)
        if embedding:
            chunk['embedding'] = embedding
        else:
            print(f"⚠️ Failed to get embedding for chunk {i}")
        time.sleep(0.3)
    output_file = 'chunks_with_embeddings.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Saved: {output_file}")
    worker_path = 'sohopathi-worker/src/chunks.json'
    try:
        os.makedirs('sohopathi-worker/src', exist_ok=True)
        shutil.copy(output_file, worker_path)
        print(f"✅ Copied to: {worker_path}")
    except Exception as e:
        print(f"⚠️ Could not copy: {e}")

if __name__ == '__main__':
    main()
