import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const images: string[] = body.images || (body.image ? [body.image] : [])

    if (images.length === 0) {
      return NextResponse.json({ error: 'Missing image content' }, { status: 400 })
    }

    // Call the Python PaddleOCR FastAPI microservice
    const ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://localhost:5050/ocr'

    try {
      const response = await fetch(ocrServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: images[0] }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Python OCR service returned an error:', errText)
        return NextResponse.json(
          { error: 'AI reading temporarily unavailable.' },
          { status: 503 }
        )
      }

      const ocrResult = await response.json()
      
      // Return details in unified format
      return NextResponse.json({
        text: ocrResult.rawText,
        reading: ocrResult.reading,
        engine: ocrResult.engine,
        confidence: ocrResult.confidence,
        processingTimeMs: ocrResult.processingTimeMs,
        displayModel: ocrResult.displayModel
      })

    } catch (fetchErr: any) {
      console.error('Failed to communicate with Python OCR microservice:', fetchErr)
      return NextResponse.json(
        { error: 'AI reading temporarily unavailable.' },
        { status: 503 }
      )
    }

  } catch (error: any) {
    console.error('OCR route handler failure:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
