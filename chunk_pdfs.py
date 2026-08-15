import os
import json
import re

def chunk_text_with_source(text, source, page, chunk_size=800, overlap=200):
    text = re.sub(r'\s+', ' ', text).strip()
    words = text.split()
    chunks = []
    if not words:
        return chunks
    if len(words) <= chunk_size:
        chunks.append({
            'text': ' '.join(words),
            'source': source,
            'page': page
        })
    else:
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            chunks.append({
                'text': ' '.join(chunk_words),
                'source': source,
                'page': page
            })
    return chunks

def main():
    if not os.path.exists('extracted_texts.json'):
        print("❌ extracted_texts.json not found!")
        print("Run: python extract_local_pdfs.py first")
        return
    
    with open('extracted_texts.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not data:
        print("❌ No data in extracted_texts.json")
        return
    
    all_chunks = []
    print(f"📚 Processing {len(data)} PDFs...")
    for item in data:
        filename = item['filename']
        print(f"  📄 {filename}")
        for page_info in item['pages']:
            page_num = page_info['page']
            text = page_info['text']
            if not text.strip():
                continue
            chunks = chunk_text_with_source(text, filename, page_num)
            all_chunks.extend(chunks)
    
    for i, chunk in enumerate(all_chunks, 1):
        chunk['id'] = f"chunk_{i}"
    
    print(f"\n✅ Created {len(all_chunks)} chunks")
    with open('chunks.json', 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    print("📄 Saved: chunks.json")

if __name__ == '__main__':
    main()
