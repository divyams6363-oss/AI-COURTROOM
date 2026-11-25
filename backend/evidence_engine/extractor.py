
from pathlib import Path

from pypdf import PdfReader
from docx import Document
import pandas as pd


SUPPORTED_FORMATS = {
    ".pdf",
    ".docx",
    ".txt",
    ".csv",
    ".xlsx",
}


def extract_text(file_path: str) -> str:
    """
    Extract text from supported evidence documents.
    Original evidence files are never modified.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Evidence file not found: {path}"
        )

    extension = path.suffix.lower()

    if extension not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported evidence format: {extension}"
        )

    if extension == ".pdf":
        reader = PdfReader(str(path))

        return "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    elif extension == ".docx":
        document = Document(str(path))

        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
        )

    elif extension == ".txt":
        return path.read_text(
            encoding="utf-8",
            errors="replace"
        )

    elif extension == ".csv":
        dataframe = pd.read_csv(path)
        return dataframe.to_string(index=False)

    elif extension == ".xlsx":
        dataframe = pd.read_excel(path)
        return dataframe.to_string(index=False)

    return ""
