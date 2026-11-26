
@app.post("/cases/{case_id}/evidence", status_code=201)
async def upload_evidence(
    case_id: int,
    file: UploadFile = File(...)
):
    saved_path = None
    evidence_id = None

    try:
        # Check whether case exists
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

        # Validate filename and extension
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

        # Create case storage folder
        case_folder = STORAGE_DIR / f"case_{case_id}"
        case_folder.mkdir(parents=True, exist_ok=True)

        saved_path = case_folder / f"{uuid.uuid4().hex}{extension}"

        # Save file
        size = 0

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

        # Process evidence
        processing_result = process_evidence(
            str(saved_path),
            performed_by="system"
        )

        if not isinstance(processing_result, dict):
            raise ValueError("Evidence processor returned invalid result")

        metadata = processing_result.get("metadata", {})

        file_hash = metadata.get("sha256")
        evidence_tracking_id = metadata.get("evidence_id")
        extracted_text = processing_result.get("extracted_text", "")

        if not file_hash:
            raise ValueError("SHA-256 hash missing from processing result")

        # Save evidence in database
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

        # Run evidence processing with database evidence ID
        try:
            second_result = process_evidence(
                str(saved_path),
                performed_by="system",
                evidence_id=evidence_id
            )

            if isinstance(second_result, dict):
                extracted_text = second_result.get(
                    "extracted_text",
                    extracted_text
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

        except Exception as processing_error:
            print(
                "SECOND PROCESSING ERROR:",
                repr(processing_error)
            )

            with get_connection() as conn:
                log_audit_action(
                    conn,
                    case_id,
                    "PROCESSING_FAILED",
                    f"Processing failed: {str(processing_error)}"
                )

        return {
            "message": "Evidence uploaded successfully",
            "evidence_id": evidence_id,
            "evidence_tracking_id": evidence_tracking_id,
            "case_id": case_id,
            "filename": filename,
            "file_type": extension,
            "file_size": size,
            "sha256": file_hash
        }

    except HTTPException:
        if evidence_id is None and saved_path and saved_path.exists():
            saved_path.unlink(missing_ok=True)
        raise

    except Exception as error:
        import traceback

        print("EVIDENCE UPLOAD ERROR:", repr(error))
        traceback.print_exc()

        if evidence_id is None and saved_path and saved_path.exists():
            saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail="Evidence upload failed"
        )

    finally:
        await file.close()
