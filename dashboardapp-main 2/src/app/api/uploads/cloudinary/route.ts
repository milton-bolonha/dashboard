import { NextRequest } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing Cloudinary credentials' }),
        { status: 500 }
      )
    }

    const form = await req.formData()
    const file = form.get('file') as Blob | null
    const folder = (form.get('folder') as string) || undefined
    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing file' }), { status: 400 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    // Build signature string per Cloudinary rules
    // Include only parameters you send (alphabetically). Here: folder (optional), timestamp
    const signatureBase = `${folder ? `folder=${folder}&` : ''}timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(signatureBase).digest('hex')

    const cloudForm = new FormData()
    cloudForm.append('file', file)
    cloudForm.append('api_key', apiKey)
    cloudForm.append('timestamp', String(timestamp))
    cloudForm.append('signature', signature)
    if (folder) cloudForm.append('folder', folder)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: cloudForm,
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Cloudinary upload failed', details: data }), { status: res.status })
    }

    return new Response(JSON.stringify(data), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Upload error', message: e?.message || String(e) }), { status: 500 })
  }
}


