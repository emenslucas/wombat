import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const MAX_AUDIO_SIZE = 50 * 1024 * 1024  // 50 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5 MB

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'audio' | 'cover'

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    if (type === 'audio') {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/flac']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Formato de audio no válido. Solo MP3, WAV y FLAC.' },
          { status: 400 }
        )
      }
      if (file.size > MAX_AUDIO_SIZE) {
        return NextResponse.json({ error: 'El archivo de audio supera el límite de 50 MB' }, { status: 400 })
      }
    } else if (type === 'cover') {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Formato de imagen no válido. Solo JPG, PNG y WebP.' },
          { status: 400 }
        )
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'La imagen supera el límite de 5 MB' }, { status: 400 })
      }
    }

    const ext = file.name.split('.').pop()
    const filename = `${user.username}/${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const blob = await put(filename, file, { access: 'public' })

    return NextResponse.json({ url: blob.url, pathname: blob.pathname, size: file.size })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
