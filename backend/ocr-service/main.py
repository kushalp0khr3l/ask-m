from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from r2 import download_from_r2
from ocr_pipeline import run_ocr

app = FastAPI(title="Ask-M OCR Backend")

class OCRRequest(BaseModel):
    bucket: str = "ask-m-notes"
    file_key: str 

@app.post("/process-ocr")
async def process_ocr(req: OCRRequest):
    try:
        # 1. Fetch file (PDF or Image) from R2
        file_bytes = download_from_r2(req.bucket, req.file_key)
        
        # 2. Run the pipeline (now handles PDF pages automatically)
        extracted_text = run_ocr(file_bytes, req.file_key)
        
        return {
            "status": "success",
            "file_key": req.file_key,
            "raw_text": extracted_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Failed: {str(e)}")