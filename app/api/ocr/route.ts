import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Missing image content' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Cloud Vision API Key is not configured' },
        { status: 501 }
      )
    }

    // Clean base64 string (remove data URL headers if present)
    const base64Content = image.split(',')[1] || image

    const requestPayload = {
      requests: [
        {
          image: {
            content: base64Content,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
            },
          ],
        },
      ],
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Vision API returned an error:', errorText)
      return NextResponse.json(
        { error: 'Failed to communicate with Google Cloud Vision API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const textAnnotations = data.responses?.[0]?.textAnnotations

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json({ text: '' })
    }

    // textAnnotations[0] contains the entire detected text block
    const detectedText = textAnnotations[0].description || ''

    return NextResponse.json({ text: detectedText })
  } catch (error: any) {
    console.error('OCR route handler failure:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
