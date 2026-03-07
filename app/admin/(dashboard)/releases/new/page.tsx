'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Disc3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function NewReleasePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [releaseType, setReleaseType] = useState('album')
  const [releaseDate, setReleaseDate] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  const handleCoverUpload = useCallback(async (file: File) => {
    setIsUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await res.json()
      setCoverUrl(url)
      toast.success('Portada subida')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir portada')
    } finally {
      setIsUploadingCover(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          release_type: releaseType,
          release_date: releaseDate || null,
          cover_url: coverUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al crear lanzamiento')
        return
      }

      toast.success('¡Lanzamiento creado!')
      router.push(`/admin/releases/${data.release.id}`)
    } catch {
      toast.error('Algo salió mal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Panel
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Nuevo Lanzamiento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover upload */}
        <div>
          <Label className="mb-2 block">Portada</Label>
          <div className="flex items-start gap-4">
            <div className="w-40 h-40 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
              {coverUrl ? (
                <div className="relative w-full h-full group">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                  {isUploadingCover ? (
                    <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Subir imagen</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCoverUpload(file)
                    }}
                    disabled={isUploadingCover}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recomendado: Imagen cuadrada, mínimo 500x500px. JPG, PNG o WebP.
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del álbum"
            required
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Tipo de Lanzamiento</Label>
          <Select value={releaseType} onValueChange={setReleaseType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="album">Álbum</SelectItem>
              <SelectItem value="ep">EP</SelectItem>
              <SelectItem value="single">Single</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="releaseDate">Fecha de Lanzamiento</Label>
          <Input
            id="releaseDate"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuenta a tus oyentes sobre este lanzamiento..."
            rows={4}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading || !title}>
            {isLoading ? 'Creando...' : 'Crear Lanzamiento'}
          </Button>
          <Link href="/admin">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
