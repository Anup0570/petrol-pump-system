import os
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['HF_HUB_OFFLINE'] = '1'

import sys
import time
import base64
import re
import numpy as np
import cv2
from PIL import Image
import io

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from paddleocr import PaddleOCR

app = FastAPI(title="Sai Priya Fuels OCR Service")

# Initialize PaddleOCR once on startup
print("Initializing PaddleOCR model...")
ocr = PaddleOCR(lang='en')
print("Model initialized successfully.")

class OCRRequest(BaseModel):
    image: str  # Base64 data URI or raw base64 string

def detect_model(text):
    upper = text.upper()
    has_a = "A:" in upper or re.search(r'A\s*[:;]', upper) is not None
    has_v = "V:" in upper or re.search(r'V\s*[:;]', upper) is not None
    return 'MODEL_1' if (has_a and has_v) else 'MODEL_2'

def parse_digits(text, model):
    clean = text.strip()
    if model == 'MODEL_1':
        # Locate V value (Model 1)
        v_match = re.search(r'[Vv]\s*[:;]?\s*([0-9.]+)', clean)
        if v_match:
            return strip_leading_zeros(v_match.group(1))
        # Fallback split lines
        for line in clean.split('\n'):
            if 'v' in line.lower():
                digits = re.sub(r'[^0-9.]', '', line)
                if digits:
                    return strip_leading_zeros(digits)
    else:
        # Extract single decimal number (Model 2)
        matches = re.findall(r'\d+\.\d+', clean)
        if matches:
            return strip_leading_zeros(matches[0])
        # Fallback decimals
        decimals = re.findall(r'[0-9.]+', clean)
        if decimals:
            for d in decimals:
                if '.' in d:
                    return strip_leading_zeros(d)
            return strip_leading_zeros(decimals[0])
    return re.sub(r'[^0-9.]', '', clean)

def strip_leading_zeros(val):
    cleaned = re.sub(r'^0+(?=\d)', '', val)
    if cleaned.startswith('.'):
         return '0' + cleaned
    return cleaned

@app.get("/health")
def health():
    return {"status": "ok", "engine": "PaddleOCR"}

@app.post("/ocr")
async def perform_ocr(request: OCRRequest):
    t0 = time.time()
    try:
        # Decode base64 image
        img_data = request.image
        if ',' in img_data:
            img_data = img_data.split(',')[1]
            
        image_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
            
        # Minimal Preprocessing: Grayscale and Contrast Stretch
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        preprocessed = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        
        # Save temp file for PaddleOCR
        temp_path = f"temp_ocr_{int(time.time() * 1000)}.jpg"
        cv2.imwrite(temp_path, preprocessed)
        
        try:
            # Predict
            res = ocr.ocr(temp_path)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        # Parse output
        texts = []
        confidence_sum = 0
        confidence_count = 0
        
        if res and isinstance(res, list):
            if len(res) > 0 and isinstance(res[0], dict) and 'rec_texts' in res[0]:
                texts = res[0]['rec_texts']
                scores = res[0].get('rec_scores', [])
                if scores:
                    confidence_sum = sum(scores)
                    confidence_count = len(scores)
            elif len(res) > 0 and isinstance(res[0], list):
                for line in res[0]:
                    if isinstance(line, list) and len(line) > 1 and isinstance(line[1], tuple):
                        texts.append(line[1][0])
                        confidence_sum += line[1][1]
                        confidence_count += 1
                        
        raw_text = " ".join(texts)
        display_model = detect_model(raw_text)
        reading = parse_digits(raw_text, display_model)
        avg_confidence = (confidence_sum / confidence_count) if confidence_count > 0 else 0.0
        
        t_elapsed = (time.time() - t0) * 1000
        
        return {
            "success": True,
            "engine": "PaddleOCR",
            "rawText": raw_text,
            "displayModel": display_model,
            "reading": reading,
            "confidence": round(avg_confidence, 2),
            "processingTimeMs": round(t_elapsed)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
