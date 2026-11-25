
import hashlib
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import init_db, get_connection
from evidence_engine.processor import process_evidence
from ai_engine import run_courtroom


app = FastAPI(
    title="AI-COURTROOM",
    description="AI-powered courtroom analysis system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# STARTUP
# --------------------------------------------------

@app.on_event("startup")
def startup():
    init_db()


# --------------------------------------------------
# CASE MODEL
# --------------------------------------------------

class CaseCreate(BaseModel):
    title: str
    description: str = ""
    allegation: str = ""


# --------------------------------------------------
# HOME AND HEALTH
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to AI-COURTROOM",
        "status": "Backend running successfully"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# --------------------------------------------------
# CASE MANAGEMENT
# --------------------------------------------------

@app.post("/cases")
def create_case(case: CaseCreate):

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO cases (title, description, allegation)
            VALUES (?, ?, ?)
            """,
            (case.title, case.description, case.allegation)
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

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM cases WHERE id = ?",
            (case_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return dict(row)


# --------------------------------------------------
# EVIDENCE STORAGE CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).parent

STORAGE_DIR = BASE_DIR / "storage" / "evidence"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".docx",
    ".csv",
    ".xlsx"
}


# --------------------------------------------------
# SHA-256 HASHING
# --------------------------------------------------

def calculate_sha256(file_path):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        for chunk in iter(
            lambda: file.read(1024 * 1024), b""
        ):
            sha256.update(chunk)

    return sha256.hexdigest()


# --------------------------------------------------
# EVIDENCE UPLOAD AND PROCESSING
# --------------------------------------------------

@app.post("/cases/{case_id}/evidence")
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
            detail="Unsupported file type"
        )

    case_folder = STORAGE_DIR / f"case_{case_id}"
    case_folder.mkdir(parents=True, exist_ok=True)

    saved_path = case_folder / (
        f"{uuid.uuid4().hex}{extension}"
    )

    size = 0

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
                (
                    case_id,
                    filename,
                    file_path,
                    file_type,
                    file_size,
                    sha256,
                    extracted_text
                )
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

        return {
            "message": "Evidence uploaded and processed successfully",
            "evidence_id": evidence_id,
            "evidence_tracking_id": evidence_tracking_id,
            "case_id": case_id,
            "filename": filename,
            "sha256": file_hash,
            "file_size": size,
            "extracted_text_length": len(extracted_text),
            "timeline": timeline_events,
            "processing_status": processing_result["processing_status"]
        }

    except HTTPException:
        saved_path.unlink(missing_ok=True)
        raise

    except Exception as error:
        print(f"Evidence processing error: {error}")

        saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail="Evidence upload or processing failed"
        )

    finally:
        await file.close()


# --------------------------------------------------
# GET CASE EVIDENCE
# --------------------------------------------------

@app.get("/cases/{case_id}/evidence")
def get_case_evidence(case_id: int):

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

        evidence = conn.execute(
            """
            SELECT
                id,
                case_id,
                filename,
                file_type,
                file_size,
                sha256,
                uploaded_at
            FROM evidence
            WHERE case_id = ?
            ORDER BY id
            """,
            (case_id,)
        ).fetchall()

    return [dict(item) for item in evidence]


# --------------------------------------------------
# EVIDENCE INTEGRITY VERIFICATION
# --------------------------------------------------

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
            (
                f"Integrity check "
                f"{'passed' if verified else 'failed'} "
                f"for {evidence['filename']}"
            )
        )

    return {
        "evidence_id": evidence_id,
        "case_id": evidence["case_id"],
        "filename": evidence["filename"],
        "verified": verified,
        "status": (
            "Integrity verified"
            if verified
            else "Integrity check failed"
        ),
        "original_sha256": expected_hash,
        "current_sha256": actual_hash
    }


# --------------------------------------------------
# AUDIT LOGGING
# --------------------------------------------------

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


# --------------------------------------------------
# VERITAS AI COURTROOM ANALYSIS
# --------------------------------------------------

@app.post("/cases/{case_id}/analyze")
def analyze_case(case_id: int):

    # Retrieve case and its evidence
    with get_connection() as conn:

        case = conn.execute(
            "SELECT * FROM cases WHERE id = ?",
            (case_id,)
        ).fetchone()

        if case is None:
            raise HTTPException(
                status_code=404,
                detail="Case not found"
            )

        evidence_rows = conn.execute(
            """
            SELECT
                id,
                filename,
                extracted_text,
                sha256,
                uploaded_at
            FROM evidence
            WHERE case_id = ?
            ORDER BY id
            """,
            (case_id,)
        ).fetchall()

        case_data = dict(case)

        evidence_list = [
            {
                "id": row["id"],
                "filename": row["filename"],
                "text": row["extracted_text"] or "",
                "sha256": row["sha256"],
                "uploaded_at": row["uploaded_at"]
            }
            for row in evidence_rows
        ]

    # Run VERITAS AI analysis
    result = run_courtroom(
        case_data,
        evidence_list
    )

    # Record analysis activity
    with get_connection() as conn:

        log_audit_action(
            conn,
            case_id,
            "AI_ANALYSIS_RUN",
            "VERITAS AI courtroom analysis executed"
        )

    return result
