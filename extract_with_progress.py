import os
import json
import pdfplumber

def extract_pdf(pdf_path, filename):
    """Extract text from a PDF with page numbers."""
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
        print(f"  ❌ Error: {e}")
        return None

def main():
    pdf_dir = 'pdfs'
    output_file = 'extracted_texts.json'
    
    # Check if pdfs folder exists
    if not os.path.exists(pdf_dir):
        print(f"❌ '{pdf_dir}' folder not found!")
        return
    
    # Get all PDF files
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"❌ No PDF files found in '{pdf_dir}' folder.")
        return
    
    print(f"📚 Found {len(pdf_files)} PDF files:")
    for i, f in enumerate(pdf_files, 1):
        print(f"  {i}. {f}")
    
    print("\n📝 Enter numbers (comma separated) or 'all':")
    selection = input("> ").strip()
    
    if selection.lower() == 'all':
        selected = pdf_files
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            selected = [pdf_files[i] for i in indices if 0 <= i < len(pdf_files)]
        except:
            print("❌ Invalid selection.")
            return
    
    if not selected:
        print("No files selected.")
        return
    
    all_data = []
    total_pages = 0
    
    for i, filename in enumerate(selected, 1):
        print(f"\n📥 [{i}/{len(selected)}] Processing: {filename}")
        pdf_path = os.path.join(pdf_dir, filename)
        
        pages = extract_pdf(pdf_path, filename)
        
        if pages:
            all_data.append({
                'filename': filename,
                'pages': pages
            })
            total_pages += len(pages)
            print(f"  ✅ Extracted {len(pages)} pages (Total: {total_pages} pages)")
            
            # SAVE AFTER EACH PDF - so you can track progress!
            with open(output_file, 'w', encoding='utf-8') as out:
                json.dump(all_data, out, ensure_ascii=False, indent=2)
            print(f"  💾 Progress saved: {len(all_data)}/{len(selected)} PDFs done")
        else:
            print(f"  ⚠️ No text extracted from {filename}")
    
    print(f"\n🎉 All done! Extracted {len(all_data)} PDFs → {output_file}")
    print(f"📊 Total pages: {total_pages}")

if __name__ == '__main__':
    main()
