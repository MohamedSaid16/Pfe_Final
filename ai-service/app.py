from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from services.ai_service import analyze_text
from services.ocr_service import extract_text_from_image
from services.pdf_service import extract_text_from_pdf
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": "AI Service Running"}


@app.post("/analyze/text")
async def analyze_text_api(text: str = Form(...)):
    result = analyze_text(text)
    return result


@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    filepath = f"{UPLOAD_DIR}/{file.filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_image(filepath)
    result = analyze_text(text)

    os.remove(filepath)

    return {
        "extracted_text": text,
        "analysis": result
    }


@app.post("/analyze/pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    filepath = f"{UPLOAD_DIR}/{file.filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(filepath)
    result = analyze_text(text)

    os.remove(filepath)

    return {
        "extracted_text": text,
        "analysis": result
    }
