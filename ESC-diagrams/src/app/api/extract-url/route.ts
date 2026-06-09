export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

/**
 * Fetches a URL and attempts to extract the first meaningful image
 * (ESC guideline pages often have diagrams as PNG/JPG in figures)
 * Returns the image as base64 for the extraction pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    // Fetch the page HTML
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ESCStudy/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!pageRes.ok) throw new Error(`Could not fetch URL: ${pageRes.status}`)

    const html = await pageRes.text()

    // Find all image srcs in the HTML
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    const srcs: string[] = []
    let match
    while ((match = imgSrcRegex.exec(html)) !== null) {
      const src = match[1]
      // Prefer larger images (likely diagrams) — filter tiny icons
      if (src && (src.includes('.png') || src.includes('.jpg') || src.includes('.jpeg') || src.includes('.webp'))) {
        const absUrl = src.startsWith('http') ? src : new URL(src, url).toString()
        srcs.push(absUrl)
      }
    }

    if (srcs.length === 0) {
      return NextResponse.json({
        error: 'No images found on that page. Try uploading the screenshot directly instead.',
      }, { status: 422 })
    }

    // Return list for user to pick, or just try the first one
    return NextResponse.json({
      message: 'Images found on page',
      images: srcs.slice(0, 10),
      firstImage: srcs[0],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
