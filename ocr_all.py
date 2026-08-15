import os
import json
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
import time

def extract_with_ocr(pdf_path, filename):
    """Extract text using OCR for scanned PDFs."""
    pages = []
    try:
        print(f"  🔍 Converting to images...")
        images = convert_from_path(pdf_path, dpi=150)
        print(f"  📄 OCR on {len(images)} pages...")
        
        for i, image in enumerate(images, 1):
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

def main():
    pdf_dir = 'pdfs'
    output_file = 'extracted_texts.json'
    
    # Get ALL PDFs
    pdf_files = sorted([f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')])
    
    print(f"📚 Found {len(pdf_files)} PDF files:")
    for i, f in enumerate(pdf_files, 1):
        print(f"  {i}. {f}")
    
    all_data = []
    total_pages = 0
    
    for i, filename in enumerate(pdf_files, 1):
        print(f"\n📥 [{i}/{len(pdf_files)}] Processing: {filename}")
        pdf_path = os.path.join(pdf_dir, filename)
        
        pages = extract_with_ocr(pdf_path, filename)
        
        if pages:
            all_data.append({
                'filename': filename,
                'pages': pages
            })
            total_pages += len(pages)
            print(f"  ✅ Extracted {len(pages)} pages (Total: {total_pages})")
            
            # Save after each PDF
            with open(output_file, 'w', encoding='utf-8') as out:
                json.dump(all_data, out, ensure_ascii=False, indent=2)
            print(f"  💾 Progress saved: {i}/{len(pdf_files)} PDFs done")
        else:
            print(f"  ❌ Failed to extract text from {filename}")
    
    print(f"\n🎉 All done! Extracted {len(all_data)} PDFs → {output_file}")

if __name__ == '__main__':
    main()
