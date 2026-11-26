
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from database import init_db, get_connection
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI-COURTROOM",
    description="AI-powered courtroom analysis system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    print("VERITAS AI backend initialized successfully!")


class CaseCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = ""
    allegation: str = ""


@app.get("/")
def home():
    return {
        "message": "Welcome to VERITAS AI",
        "status": "Backend running successfully",
        "version": "2.1.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/cases")
def create_case(case: CaseCreate):

    title = case.title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Case title cannot be empty"
        )

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO cases
            (title, description, allegation)
            VALUES (?, ?, ?)
            """,
            (
                title,
                case.description,
                case.allegation
            )
        )

        case_id = cursor.lastrowid

        log_audit_action(
            conn,
            case_id,
            "CASE_CREATED",
            "New case created"
        )

    return {
        "message": "Case created successfully",
        "case_id": case_id
    }


@app.get("/cases")
def get_cases():

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM cases ORDER BY id DESC"
        ).fetchall()

    return [dict(row) for row in rows]


@app.get("/cases/{case_id}")
def get_case(case_id: int):
    return get_existing_case(case_id)


# --------------------------------------------------
# AI COURTROOM - FIVE AI MODULES
# --------------------------------------------------

@app.post("/cases/{case_id}/courtroom")
def analyze_courtroom(case_id: int):

    # 1. Get case details
    case = get_existing_case(case_id)

    # 2. Get all evidence
    evidence_records = get_evidence_records(case_id)

    # 3. Convert database evidence into AI engine format
    evidence_list = []

    for item in evidence_records:
        evidence_list.append({
            "id": item["id"],
            "evidence_id": item["id"],
            "filename": item["filename"],
            "text": item.get("extracted_text") or "",
            "extracted_text": item.get("extracted_text") or "",
            "file_type": item["file_type"],
            "sha256": item["sha256"],
            "uploaded_at": item["uploaded_at"]
        })

    # 4. Run all five AI modules
    try:
        result = run_courtroom(
            case,
            evidence_list
        )

        # 5. Save audit log
        with get_connection() as conn:
            log_audit_action(
                conn,
                case_id,
                "COURTROOM_ANALYSIS",
                "AI Courtroom analysis completed"
            )

        return {
            "success": True,
            "message": "Courtroom analysis completed successfully",
            **result
        }

    except Exception as error:
        print("COURTROOM ERROR:", str(error))

        with get_connection() as conn:
            log_audit_action(
                conn,
                case_id,
                "COURTROOM_ANALYSIS_FAILED",
                str(error)
            )

        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return dict(row)
import hashlib
import uuid
from pathlib import Path

from fastapi import UploadFile, File, HTTPException
# Evidence storage location
BASE_DIR = Path(__file__).parent
STORAGE_DIR = BASE_DIR / "storage" / "evidence"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf", ".txt", ".docx",
    ".png", ".jpg", ".jpeg"
}


def calculate_sha256(file_path):
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            sha256.update(chunk)

    return sha256.hexdigest()


@app.post("/cases/{case_id}/evidence", status_code=201)
async def upload_evidence(
    case_id: int,
    file: UploadFile = File(...)
):
    with get_connection() as conn:
        case = conn.execute(
            "SELECT id FROM cases WHERE id = ?",
            (case_id,)
        ).fetchone()

    if case is None:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    filename = Path(file.filename or "").name

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required"
        )

    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format"
        )

    case_folder = STORAGE_DIR / f"case_{case_id}"
    case_folder.mkdir(parents=True, exist_ok=True)

    saved_path = case_folder / f"{uuid.uuid4().hex}{extension}"
    size = 0
    evidence_id = None

    try:

        # Save uploaded file in chunks
        with saved_path.open("wb") as destination:

            while True:

                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File exceeds 25 MB limit"
                    )

                destination.write(chunk)

        if size == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file"
            )

        # Process uploaded evidence
        processing_result = process_evidence(
            str(saved_path),
            performed_by="system"
        )

        file_hash = processing_result["metadata"]["sha256"]

        extracted_text = processing_result["extracted_text"]

        evidence_tracking_id = (
            processing_result["metadata"]["evidence_id"]
        )

        timeline_events = processing_result["timeline"]

        # Store evidence details in SQLite
        with get_connection() as conn:

            cursor = conn.execute(
                """
                INSERT INTO evidence
                (case_id, filename, file_path, file_type,
                 file_size, sha256, extracted_text)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    case_id,
                    filename,
                    str(saved_path),
                    extension,
                    size,
                    file_hash,
                    extracted_text
                )
            )

            evidence_id = cursor.lastrowid

            log_audit_action(
                conn,
                case_id,
                "EVIDENCE_UPLOADED",
                f"Evidence uploaded: {filename}"
            )

        processing_result = None
        processing_error = None

        try:
            processing_result = process_evidence(
                str(saved_path),
                performed_by="system",
                evidence_id=evidence_id
            )

            extracted_text = (
                processing_result.get("extracted_text", "")
                if isinstance(processing_result, dict)
                else ""
            )

            with get_connection() as conn:
                conn.execute(
                    """
                    UPDATE evidence
                    SET extracted_text = ?
                    WHERE id = ?
                    """,
                    (extracted_text, evidence_id)
                )

                log_audit_action(
                    conn,
                    case_id,
                    "EVIDENCE_PROCESSED",
                    f"Evidence processed: {filename}"
                )

        except Exception as error:
            processing_error = str(error)

            with get_connection() as conn:
                log_audit_action(
                    conn,
                    case_id,
                    "PROCESSING_FAILED",
                    f"Processing failed for {filename}: {processing_error}"
                )

        return {
            "message": "Evidence uploaded and processed successfully",
            "evidence_id": evidence_id,
            "evidence_tracking_id": evidence_tracking_id,
            "case_id": case_id,
            "filename": filename,
            "file_type": extension,
            "file_size": size,
            "sha256": file_hash,
            "file_size": size
        }

    except HTTPException:
        if evidence_id is None:
            saved_path.unlink(missing_ok=True)
        raise

    except Exception:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="Evidence upload failed"
        )

    finally:
        await file.close()

@app.get("/cases/{case_id}/evidence")
def get_case_evidence(case_id: int):
    with get_connection() as conn:
        case = conn.execute(
            "SELECT id FROM cases WHERE id = ?", (case_id,)
        ).fetchone()

        if case is None:
            raise HTTPException(
                status_code=404,
                detail="Case not found"
            )

        evidence = conn.execute(
            """
            SELECT id, case_id, filename, file_type,
                   file_size, sha256, uploaded_at
            FROM evidence
            WHERE case_id = ?
            """,
            (case_id,)
        ).fetchall()

    return [dict(item) for item in evidence]

@app.get("/evidence/{evidence_id}/integrity")
def verify_evidence_integrity(evidence_id: int):

    with get_connection() as conn:

        evidence = conn.execute(
            """
            SELECT id, case_id, filename, file_path, sha256
            FROM evidence
            WHERE id = ?
            """,
            (evidence_id,)
        ).fetchone()

    if evidence is None:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found"
        )

    file_path = Path(evidence["file_path"])

    if not file_path.is_file():
        return {
            "evidence_id": evidence_id,
            "verified": False,
            "status": "File not found"
        }

    actual_hash = calculate_sha256(file_path)
    expected_hash = evidence["sha256"]

    verified = actual_hash == expected_hash
    with get_connection() as conn:

        log_audit_action(
            conn,
            evidence["case_id"],
            "INTEGRITY_CHECKED",
            f"Integrity check {'passed' if verified else 'failed'} for {evidence['filename']}"
        )

    return {
        "evidence_id": evidence_id,
        "case_id": evidence["case_id"],
        "filename": evidence["filename"],
        "verified": verified,
        "status": "Integrity verified" if verified else "Integrity check failed",
        "original_sha256": expected_hash,
        "current_sha256": actual_hash
    }
def log_audit_action(conn, case_id, action, details):
    conn.execute(
        """
        INSERT INTO audit_logs (case_id, action, details)
        VALUES (?, ?, ?)
        """,
        (case_id, action, details)
    )
@app.get("/cases/{case_id}/audit-logs")
def get_audit_logs(case_id: int):

    get_existing_case(case_id)

    with get_connection() as conn:
        case = conn.execute(
            "SELECT id FROM cases WHERE id = ?",
            (case_id,)
        ).fetchone()

        if case is None:
            raise HTTPException(
                status_code=404,
                detail="Case not found"
            )

        logs = conn.execute(
            """
            SELECT id, case_id, action, details, created_at
            FROM audit_logs
            WHERE case_id = ?
            ORDER BY id DESC
            """,
            (case_id,)
        ).fetchall()

    return [dict(log) for log in logs]