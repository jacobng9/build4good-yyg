from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import fitz  # PyMuPDF
import uuid
import base64
from typing import Optional

router = APIRouter()

@router.post("/api/parse")
async def parse_file(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Parse uploaded file or raw text to extract raw text content.
    Supports PDF (text extraction), JPG/PNG (returns base64 encoded bytes), and plain text.
    Returns session_id, raw_text, and file_type.
    """
    session_id = str(uuid.uuid4())

    # Handle file upload
    if file:
        # Get file extension and content type
        filename = file.filename.lower() if file.filename else ""
        content_type = file.content_type

        # Read file content
        content = await file.read()

        # Process based on file type
        if filename.endswith('.pdf') or content_type == 'application/pdf':
            try:
                # Extract text from PDF using PyMuPDF
                pdf_document = fitz.open(stream=content, filetype="pdf")
                raw_text = ""
                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    raw_text += page.get_text()
                pdf_document.close()
                file_type = "pdf"
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

        elif filename.endswith(('.jpg', '.jpeg', '.png')) or content_type in ['image/jpeg', 'image/png']:
            # For images, return base64 encoded raw bytes
            raw_text = base64.b64encode(content).decode('utf-8')
            file_type = "image"

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported types: PDF, JPG, PNG. Received: {filename}"
            )

    # Handle raw text input
    elif text is not None:
        raw_text = text
        file_type = "text"

    else:
        raise HTTPException(
            status_code=400,
            detail="Either a file or text must be provided"
        )

    return {
        "session_id": session_id,
        "raw_text": raw_text,
        "file_type": file_type
    }