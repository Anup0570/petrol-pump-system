# Walkthrough — AI Meter Reading OCR System (Version 2) Modifications

We have successfully addressed the web environment limits of Google ML Kit, fixed the character resolution scaling bug, refined auto-cropping to exclude plastic bezels, added a toggleable Engine Diagnostic Console, and verified the build.

---

## Key Solutions Implemented

### 1. Hybrid Web Production OCR (Google Cloud Vision API)
- **Technical Limitation**: Google ML Kit is a mobile-only native library (Android/iOS) and does not work client-side in a web browser.
- **Solution**: We created a server-side route [app/api/ocr/route.ts](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/app/api/ocr/route.ts) that forwards base64 crop image data to the **Google Cloud Vision API** when the environment variable `GOOGLE_CLOUD_VISION_API_KEY` is present.
- **Fallback**: If the API key is not configured, the network is offline, or the API call fails, the client falls back to local client-side **Tesseract.js WASM** (which acts as the development and offline web driver). The UI explicitly displays the active engine (e.g. `Google Vision (Cloud)` or `Tesseract.js (Local Fallback)`).

### 2. Resolution Normalization Bug Fix (Root Cause of '1' Readings)
- **Root Cause**: Mobile cameras produce high-resolution photos (e.g., 4032x3024). Cropping a region and scaling by `scale: 2` produced canvas outputs up to 3000px wide. Because standard OCR engines are trained on text sizes of 20-80px, they were unable to parse digits of this size, returning empty results or single digits like "1".
- **Solution**: We modified `preprocessImage` in [imagePreprocessor.ts](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/utils/imagePreprocessor.ts) to normalize the output canvas height to exactly **160 pixels** (scaling the width proportionally). This guarantees digit height is always in the optimal range (~60-80px) for OCR engines, resulting in high accuracy.

### 3. Exclude Plastic LCD Bezels
- **Solution**: Modified `autoDetectLcdScreen` in [imagePreprocessor.ts](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/utils/imagePreprocessor.ts) to apply a **10% margin inset** to the detected Sobel edge bounding box. This excludes the plastic bezel/frame, keypads, and surrounding pump metal, zooming directly into the active LCD glass display.

### 4. 5-Pane Diagnostic Debug Dashboard
- Added a **Debug Mode** toggle button (with a Bug icon) inside [ReadingOCRModal.tsx](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/components/ocr/ReadingOCRModal.tsx).
- When toggled, the modal expands its layout width and displays the 5 diagnostic panes:
  1. **Original Image**: Displays the photo with the interactive, resizable crop bounding box overlay.
  2. **Cropped LCD (No Filters)**: Canvas rendering the raw cropped display.
  3. **Processed OCR Input (160px H)**: Canvas showing the binarized, sharpened, and normalized output sent to the OCR engine.
  4. **Raw OCR Characters**: Monospace text box displaying the exact characters output by the OCR engine.
  5. **Parsed Output**: Displays the parsed reading alongside the layout classification (Model 1 vs Model 2) and active driver.

---

## File Modifications Summary

- [app/api/ocr/route.ts](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/app/api/ocr/route.ts) **[NEW]**: Implemented Next.js POST handler routing base64 images to Google Cloud Vision API.
- [utils/imagePreprocessor.ts](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/utils/imagePreprocessor.ts) **[MODIFY]**: Applied 10% insets in LCD auto-detection and normalized target canvas height to `160px`.
- [components/ocr/OCRProcessor.ts](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/components/ocr/OCRProcessor.ts) **[MODIFY]**: Configured the processor to query the `/api/ocr` API route on web before falling back to local Tesseract.js.
- [components/ocr/ReadingOCRModal.tsx](file:///Users/anupraghavan/Petrol%20pump/petrol-pump/components/ocr/ReadingOCRModal.tsx) **[MODIFY]**: Expanded UI to support toggleable Debug Mode showing raw/processed canvases and text consoles.
