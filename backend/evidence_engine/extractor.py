
from pathlib import Path

from pypdf import PdfReader
from docx import Document
import pandas as pd


SUPPORTED_FORMATS = {
    ".pdf", ".docx", ".txt", ".csv", ".xlsx",
    ".png", ".jpg", ".jpeg"
}


def extract_file(file_path: str) -> dict:
    """Extract text from supported evidence documents."""

    path = Path(file_path)

    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Evidence file not found: {path}")

    extension = path.suffix.lower()

    if extension not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported evidence format: {extension}")

    result = {"text": "", "pages": [], "warning": None}

    if extension == ".pdf":
        reader = PdfReader(str(path))
        pages = []

        for number, page in enumerate(reader.pages, start=1):
            pages.append({
                "page": number,
                "text": page.extract_text() or ""
            })

        result["pages"] = pages
        result["text"] = "\n".join(p["text"] for p in pages)

    elif extension == ".docx":
        document = Document(str(path))

        paragraphs = [
            p.text for p in document.paragraphs if p.text.strip()
        ]

        tables = [
            " | ".join(cell.text for cell in row.cells)
            for table in document.tables
            for row in table.rows
        ]

        result["text"] = "\n".join(paragraphs + tables)

    elif extension == ".txt":
        result["text"] = path.read_text(
            encoding="utf-8", errors="replace"
        )

    elif extension == ".csv":
        result["text"] = pd.read_csv(
            path, encoding="utf-8-sig"
        ).to_string(index=False)

    elif extension == ".xlsx":
        sheets = pd.read_excel(path, sheet_name=None)

        result["text"] = "\n".join(
            f"SHEET: {name}\n{data.to_string(index=False)}"
            for name, data in sheets.items()
        )

    elif extension in {".png", ".jpg", ".jpeg"}:
        try:
            from PIL import Image
            import pytesseract

            with Image.open(path) as image:
                result["text"] = pytesseract.image_to_string(image)
                result["ocr_used"] = True

        except ImportError:
            result["warning"] = "OCR libraries are not installed."

        except Exception as error:
            result["warning"] = f"OCR unavailable: {error}"

    result["filename"] = path.name
    result["file_type"] = extension

    return result


def extract_text(file_path: str) -> str:
    """Backward-compatible text extraction function."""
    return extract_file(file_path)["text"]
