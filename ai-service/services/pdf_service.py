import pdfplumber

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF file using pdfplumber.
    It's lightweight and works well for text-based PDFs.
    """
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            # Only extract first 5 pages to prevent timeouts on CPU
            num_pages = min(5, len(pdf.pages))
            for i in range(num_pages):
                page = pdf.pages[i]
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        
    return text.strip()
