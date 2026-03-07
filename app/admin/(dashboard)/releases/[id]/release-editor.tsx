'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Disc3, Trash2, GripVertical, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Track {
  id: number
  title: string
  track_number: number
  duration: number | null
  file_url: string
  file_type: string
  is_public: boolean
  play_count: number
}

interface Release {
  id: number
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  release_type: string
  release_date: string | null
  is_public: boolean
}

interface ReleaseEditorProps {
  release: Record<string, unknown>
  tracks: Array<Record<string, unknown>>
  artistSlug: string
}

export function ReleaseEditor({ release: initialRelease, tracks: initialTracks, artistSlug }: ReleaseEditorProps) {
  const router = useRouter()
  const [release, setRelease] = useState<Release>(initialRelease as unknown as Release)
  const [tracks, setTracks] = useState<Track[]>(initialTracks as unknown as Track[])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [uploadingTracks, setUploadingTracks] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

      if (!res.ok) throw new Error('Upload failed')

      const { url } = await res.json()
      
      // Update release
      const updateRes = await fetch(`/api/releases/${release.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_url: url }),
      })

      if (!updateRes.ok) throw new Error('Failed to update')

      setRelease({ ...release, cover_url: url })
      toast.success('Portada actualizada')
    } catch {
      toast.error('Error al subir portada')
    } finally {
      setIsUploadingCover(false)
    }
  }, [release])

  const handleTrackUpload = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      const fileId = `${file.name}-${Date.now()}`
      setUploadingTracks(prev => [...prev, fileId])

      try {
        // Upload file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'audio')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json()
          throw new Error(data.error || 'Upload failed')
        }

        const { url } = await uploadRes.json()

        // Determine file type
        const ext = file.name.split('.').pop()?.toLowerCase()
        const fileType = ext === 'wav' ? 'wav' : 'mp3'

        // Get title from filename (without extension)
        const title = file.name.replace(/\.[^/.]+$/, '')

        // Create track
        const trackRes = await fetch('/api/tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            release_id: release.id,
            title,
            file_url: url,
            file_type: fileType,
          }),
        })

        if (!trackRes.ok) throw new Error('Failed to create track')

        const { track } = await trackRes.json()
        setTracks(prev => [...prev, track])
        toast.success(`Subido: ${title}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Error al subir ${file.name}`)
      } finally {
        setUploadingTracks(prev => prev.filter(id => id !== fileId))
      }
    }
  }, [release.id])

  const handleDeleteTrack = async (trackId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este track?')) return

    try {
      const res = await fetch(`/api/tracks/${trackId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      setTracks(prev => prev.filter(t => t.id !== trackId))
      toast.success('Track eliminado')
    } catch {
      toast.error('Error al eliminar track')
    }
  }

  const handleUpdateRelease = async (updates: Partial<Release>) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error('Failed to update')

      const { release: updated } = await res.json()
      setRelease(updated)
      toast.success('Lanzamiento actualizado')
      router.refresh()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteRelease = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lanzamiento y todos sus tracks?')) return

    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Lanzamiento eliminado')
      router.push('/admin')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newTracks = [...tracks]
    const [draggedTrack] = newTracks.splice(draggedIndex, 1)
    newTracks.splice(dragOverIndex, 0, draggedTrack)
    
    // Update track numbers
    const reorderedTracks = newTracks.map((track, index) => ({
      ...track,
      track_number: index + 1
    }))
    
    setTracks(reorderedTracks)
    setDraggedIndex(null)
    setDragOverIndex(null)

    // Save to server
    try {
      const res = await fetch('/api/tracks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: release.id,
          trackIds: reorderedTracks.map(t => t.id)
        }),
      })

      if (!res.ok) throw new Error('Failed to reorder')
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
      // Revert on error
      setTracks(tracks)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Left: Cover and info */}
      <div className="space-y-6">
        {/* Cover */}
        <div>
          <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
            {release.cover_url ? (
              <div className="relative w-full h-full group">
                <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm">Cambiar portada</span>
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
              </div>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                {isUploadingCover ? (
                  <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Subir portada</span>
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
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Título</Label>
          <Input
            value={release.title}
            onChange={(e) => setRelease({ ...release, title: e.target.value })}
            onBlur={() => handleUpdateRelease({ title: release.title })}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea
            value={release.description || ''}
            onChange={(e) => setRelease({ ...release, description: e.target.value })}
            onBlur={() => handleUpdateRelease({ description: release.description })}
            rows={3}
          />
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Público</Label>
            <p className="text-xs text-muted-foreground">Hacer visible este lanzamiento para todos</p>
          </div>
          <Switch
            checked={release.is_public}
            onCheckedChange={(checked) => handleUpdateRelease({ is_public: checked })}
          />
        </div>

        {/* Share link */}
        {release.is_public && (
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Enlace para compartir:</p>
            <code className="text-xs text-foreground break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/{artistSlug}/{release.slug}
            </code>
          </div>
        )}

        {/* Delete */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDeleteRelease}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar Lanzamiento
        </Button>
      </div>

      {/* Right: Tracks */}
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Tracks</h2>
          <div className="relative">
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp3,.mp3,.wav"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleTrackUpload(e.target.files)
                  e.target.value = ''
                }
              }}
              disabled={uploadingTracks.length > 0}
            />
            <Button size="sm" disabled={uploadingTracks.length > 0} className="pointer-events-none">
              <Upload className="w-4 h-4 mr-2" />
              Subir Tracks
            </Button>
          </div>
        </div>

        {/* Upload progress */}
        {uploadingTracks.length > 0 && (
          <div className="mb-4 p-3 bg-secondary rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Subiendo {uploadingTracks.length} {uploadingTracks.length === 1 ? 'track' : 'tracks'}...
              </span>
            </div>
          </div>
        )}

        {/* Track list */}
        {tracks.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">Aún no hay tracks</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sube archivos MP3 o WAV para agregar tracks
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 hover:bg-accent/30 transition-all cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-50 bg-accent/20' : ''
                } ${dragOverIndex === index && draggedIndex !== index ? 'border-t-2 border-primary' : ''}`}
              >
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>
                <span className="w-6 text-center text-sm text-muted-foreground tabular-nums">
                  {track.track_number}
                </span>
                <div className="flex-1 min-w-0">
                  <Input
                    value={track.title}
                    onChange={(e) => {
                      const newTracks = [...tracks]
                      newTracks[index] = { ...track, title: e.target.value }
                      setTracks(newTracks)
                    }}
                    onBlur={async () => {
                      await fetch(`/api/tracks/${track.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: track.title }),
                      })
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <span className="text-xs text-muted-foreground uppercase">
                  {track.file_type}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                  {formatDuration(track.duration)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                  {track.play_count.toLocaleString()} reproducciones
                </span>
                <button
                  onClick={() => handleDeleteTrack(track.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Formatos soportados: MP3, WAV. Tamaño máximo: 100MB por track.
        </p>
      </div>
    </div>
  )
}
