import os
import json
import pdfplumber

def extract_text_with_pages(pdf_path):
    text_by_page = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text:
                    text_by_page.append({
                        'page': page_num,
                        'text': text.strip()
                    })
                else:
                    text_by_page.append({
                        'page': page_num,
                        'text': ''
                    })
        return text_by_page
    except Exception as e:
        print(f"⚠️ pdfplumber error on {pdf_path}: {e}")
        try:
            import PyPDF2
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text_by_page = []
                for i, page in enumerate(reader.pages, start=1):
                    text = page.extract_text()
                    text_by_page.append({
                        'page': i,
                        'text': text.strip() if text else ''
                    })
            return text_by_page
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")
            return []

def main():
    pdf_dir = 'pdfs'
    if not os.path.exists(pdf_dir):
        print(f"❌ '{pdf_dir}' folder not found!")
        return
    
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
    for filename in selected:
        pdf_path = os.path.join(pdf_dir, filename)
        print(f"\n📥 Processing: {filename}")
        pages = extract_text_with_pages(pdf_path)
        if pages:
            all_data.append({
                'filename': filename,
                'pages': pages
            })
            print(f"✅ Extracted {len(pages)} pages")
        else:
            print(f"⚠️ No text extracted from {filename}")
    
    if all_data:
        with open('extracted_texts.json', 'w', encoding='utf-8') as out:
            json.dump(all_data, out, ensure_ascii=False, indent=2)
        print(f"\n✅ Extracted {len(all_data)} PDFs → extracted_texts.json")
    else:
        print("❌ No text extracted.")

if __name__ == '__main__':
    main()
