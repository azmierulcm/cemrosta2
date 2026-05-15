from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pdfplumber
import io
import re

app = FastAPI(title="Cemrosta Parsing Service")

class DutyEvent(BaseModel):
    type: str # 'FLIGHT', 'STANDBY', 'LAYOVER'
    date: str # YYYY-MM-DD
    flight_number: Optional[str] = None
    dep_port: Optional[str] = None
    arr_port: Optional[str] = None
    std_utc: Optional[str] = None # ISO format UTC
    sta_utc: Optional[str] = None # ISO format UTC
    sign_on_utc: Optional[str] = None
    sign_off_utc: Optional[str] = None

class RosterData(BaseModel):
    events: List[DutyEvent]
    month: str
    year: str

@app.post("/parse-roster", response_model=RosterData)
async def parse_roster(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file format. PDF required.")

    content = await file.read()
    
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += page.extract_text() or ""
        
        # Robust Regex Parsing Logic (Python is significantly more reliable for this)
        # TODO: Implement the production-grade state machine parser
        return perform_extraction(full_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

def perform_extraction(text: str) -> RosterData:
    # Placeholder for the robust state machine logic
    # This will be calibrated with the 50+ rosters
    return RosterData(
        month="May",
        year="2026",
        events=[]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
