import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  if (!privateKey) {
    return NextResponse.json({ error: 'ImageKit is not configured' }, { status: 500 })
  }

  const incomingForm = await request.formData()
  const file = incomingForm.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const uploadForm = new FormData()
  uploadForm.append('file', file, file.name)
  uploadForm.append('fileName', file.name)
  uploadForm.append('folder', '/elite-hijab-products')
  uploadForm.append('useUniqueFileName', 'true')

  const auth = 'Basic ' + Buffer.from(privateKey + ':').toString('base64')

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: auth },
    body: uploadForm,
  })

  const data = await res.json()
  if (!res.ok || !data.url) {
    return NextResponse.json({ error: data.message || 'Upload failed' }, { status: 502 })
  }

  return NextResponse.json({ url: data.url })
}
