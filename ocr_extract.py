import os
import json
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
import tempfile
import time

def extract_with_ocr(pdf_path, filename):
    """Extract text using OCR for scanned PDFs."""
    pages = []
    try:
        print(f"  🔍 Converting PDF to images (this may take a while)...")
        images = convert_from_path(pdf_path, dpi=150)
        print(f"  📄 Converting {len(images)} pages to text...")
        
        for i, image in enumerate(images, 1):
            # OCR the image
            text = pytesseract.image_to_string(image, lang='ben+eng')
            pages.append({
                'page': i,
                'text': text.strip() if text else ''
            })
            if i % 10 == 0:
                print(f"    Processed {i}/{len(images)} pages")
        
        return pages
    except Exception as e:
        print(f"  ❌ OCR Error: {e}")
        return None

def extract_with_pdfplumber(pdf_path, filename):
    """Extract text using pdfplumber for text-based PDFs."""
    pages = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text:
                    pages.append({'page': page_num, 'text': text.strip()})
                else:
                    pages.append({'page': page_num, 'text': ''})
        return pages
    except Exception as e:
        print(f"  ⚠️ pdfplumber error: {e}")
        return None

def main():
    pdf_dir = 'pdfs'
    output_file = 'extracted_texts.json'
    
    # Get list of PDFs to process
    pdf_files = [
        'BGS.pdf',
        'English Grammar and Composition.pdf',
        'Chemistry.pdf',
        'Bangla Sahitto.pdf',
        'Islam.pdf',
        'Physics.pdf',
        'Bangla Sohopath.pdf',
        'Higher Math.pdf',
        'Bangla Grammar.pdf',
        'Biology.pdf'
    ]
    
    # Load existing data
    existing_data = []
    processed_files = set()
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            processed_files = {item['filename'] for item in existing_data}
        print(f"✅ Found {len(existing_data)} already processed PDFs")
    
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
        print(f"\n📥 Processing: {filename}")
        pdf_path = os.path.join(pdf_dir, filename)
        
        # Try pdfplumber first
        pages = extract_with_pdfplumber(pdf_path, filename)
        
        # If pdfplumber fails or returns empty pages, use OCR
        if pages is None or all(p['text'] == '' for p in pages):
            print(f"  ⚠️ No text found with pdfplumber, trying OCR...")
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
