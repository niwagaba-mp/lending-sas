import pypdf
import sys

def read_pdf(filename, outfile):
    outfile.write(f"============= {filename} =============" + "\n")
    try:
        reader = pypdf.PdfReader(filename)
        for i, page in enumerate(reader.pages):
            outfile.write(f"--- Page {i+1} ---" + "\n")
            outfile.write((page.extract_text() or "") + "\n")
    except Exception as e:
        outfile.write(f"Error reading {filename}: {e}" + "\n")

with open("pdf_outputs.txt", "w", encoding="utf-8") as f:
    read_pdf("OSCAR AUDIT REPORT.pdf", f)
    read_pdf("lends up luzira audit report.pdf", f)
    read_pdf("LEEWAY FINANCIAL SERVICES LIMITED AUDIT REPORT.pdf", f)
    read_pdf("loan statement felex.pdf", f)
    read_pdf("Musha Financial Services Loan Application.pdf", f)
    read_pdf("LOANS MANAGEMENT INDEPENDENT CONTRACTOR AGREEMENT.pdf", f)
    read_pdf("OFFICE MANAGEMENT INDEPENDENT CONTRACTOR AGREEMENT.pdf", f)


