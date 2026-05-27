import { NextRequest, NextResponse } from 'next/server'

function parseAnswerKeyFromText(text: string): Record<string, { answer: string }> {
  const key: Record<string, { answer: string }> = {}

  // Normalize whitespace
  const norm = text.replace(/\s+/g, ' ')

  // Pattern: number followed by single letter A-E (handles "1. A", "1) A", "1 A", "1.A")
  const re = /\b(\d{1,3})[.):\s]*([A-Ea-e])(?=\s|\b|$)/g
  let m
  while ((m = re.exec(norm)) !== null) {
    const q = parseInt(m[1])
    if (q >= 1 && q <= 400 && !key[String(q)]) {
      key[String(q)] = { answer: m[2].toUpperCase() }
    }
  }

  return key
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Dynamic import — avoids bundler issues and works in Node.js runtime
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as string)

    // Text extraction only — no canvas/rendering needed
    const loadingTask = (pdfjsLib as any).getDocument({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    })
    const pdf = await loadingTask.promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = (content.items as any[])
        .filter(item => 'str' in item)
        .map(item => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }

    const answerKey = parseAnswerKeyFromText(fullText)
    const count = Object.keys(answerKey).length

    if (count === 0) {
      return NextResponse.json(
        { error: 'No answers found in PDF. Make sure the PDF contains text (not a scanned image) with question numbers and letter answers (A–E).' },
        { status: 422 }
      )
    }

    return NextResponse.json({ answerKey, count })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Extraction failed' }, { status: 500 })
  }
}
