import zipfile
import xml.etree.ElementTree as ET
import os

def docx_to_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Look for paragraph elements
            paragraphs = []
            for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {path}: {e}"

files = [
    "Money Lenders improved saas.docx",
    "SAAS Sacco System Review (1).docx",
]

for f in os.listdir('.'):
    if f.endswith('.docx') and f not in files:
        files.append(f)

with open("docx_outputs.txt", "w", encoding="utf-8") as out:
    for f in files:
        if os.path.exists(f):
            out.write(f"\n============= {f} =============\n")
            out.write(docx_to_text(f))
            out.write("\n\n")

print("Done! Extracted text to docx_outputs.txt")
