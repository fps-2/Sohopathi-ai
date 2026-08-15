import os
import json
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
import time

def extract_with_ocr(pdf_path, filename):
    """Extract text using OCR with progress."""
    pages = []
    try:
        print(f"  🔍 Converting to images...")
        images = convert_from_path(pdf_path, dpi=150)
        total = len(images)
        print(f"  📄 OCR on {total} pages...")
        
        for i, image in enumerate(images, 1):
            text = pytesseract.image_to_string(image, lang='ben+eng')
            pages.append({
                'page': i,
                'text': text.strip() if text else ''
            })
            # Show progress every 5 pages
            if i % 5 == 0 or i == total:
                print(f"    Processed {i}/{total} pages ({int(i/total*100)}%)")
        
        return pages
    except Exception as e:
        print(f"  ❌ OCR Error: {e}")
        return None

def main():
    pdf_dir = 'pdfs'
    output_file = 'extracted_texts.json'
    
    # Load existing data
    existing_data = []
    processed_files = set()
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            processed_files = {item['filename'] for item in existing_data}
        print(f"✅ Found {len(existing_data)} already processed PDFs")
    
    # Get all PDFs
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    
    # Filter out already processed
    remaining = [f for f in pdf_files if f not in processed_files]
    
    if not remaining:
        print("✅ All PDFs already processed!")
        return
    
    print(f"\n📚 Processing {len(remaining)} remaining PDFs:")
    for i, f in enumerate(remaining, 1):
        print(f"  {i}. {f}")
    
    total_pages = sum(len(item['pages']) for item in existing_data)
    
    for filename in remaining:
        print(f"\n📥 [{remaining.index(filename)+1}/{len(remaining)}] Processing: {filename}")
        pdf_path = os.path.join(pdf_dir, filename)
        
        pages = extract_with_ocr(pdf_path, filename)
        
        if pages:
            existing_data.append({
                'filename': filename,
                'pages': pages
            })
            total_pages += len(pages)
            print(f"  ✅ Extracted {len(pages)} pages (Total: {total_pages})")
            
            with open(output_file, 'w', encoding='utf-8') as out:
                json.dump(existing_data, out, ensure_ascii=False, indent=2)
            print(f"  💾 Progress saved: {len(existing_data)}/13 PDFs done")
        else:
            print(f"  ❌ Failed to extract text from {filename}")
    
    print(f"\n🎉 All done! Extracted {len(existing_data)} PDFs → {output_file}")

if __name__ == '__main__':
    main()
