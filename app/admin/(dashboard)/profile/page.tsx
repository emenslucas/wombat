'use client'

import { useState, useEffect } from 'react'
import { Upload, User, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Artist {
  id: number
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
}

export default function ProfilePage() {
  const [artist, setArtist] = useState<Artist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setArtist(data.artist)
    } catch {
      toast.error('Error al cargar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (type === 'avatar') setIsUploadingAvatar(true)
    else setIsUploadingBanner(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const { url } = await uploadRes.json()

      const updateData = type === 'avatar' 
        ? { avatar_url: url } 
        : { banner_url: url }

      const updateRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!updateRes.ok) throw new Error('Update failed')

      const { artist: updated } = await updateRes.json()
      setArtist(updated)
      toast.success(type === 'avatar' ? 'Foto de perfil actualizada' : 'Banner actualizado')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false)
      else setIsUploadingBanner(false)
    }
  }

  const handleSave = async () => {
    if (!artist) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: artist.name,
          bio: artist.bio,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!artist) return null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-8">
        Editar Perfil
      </h1>

      {/* Banner */}
      <div className="mb-8">
        <Label className="mb-3 block">Banner</Label>
        <div className="relative aspect-[3/1] bg-secondary/30 rounded-xl overflow-hidden ring-1 ring-border/30">
          {artist.banner_url ? (
            <img 
              src={artist.banner_url} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground/50 text-sm">Sin banner</span>
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            {isUploadingBanner ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex flex-col items-center text-white">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-sm">Cambiar banner</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file, 'banner')
              }}
              disabled={isUploadingBanner}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Recomendado: 1500x500px. JPG, PNG o WebP.
        </p>
      </div>

      {/* Avatar */}
      <div className="mb-8">
        <Label className="mb-3 block">Foto de Perfil</Label>
        <div className="flex items-end gap-6">
          <div className="relative w-32 h-32">
            <div className="w-full h-full rounded-full overflow-hidden bg-secondary/30 ring-2 ring-border/30">
              {artist.avatar_url ? (
                <img 
                  src={artist.avatar_url} 
                  alt={artist.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              {isUploadingAvatar ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file, 'avatar')
                }}
                disabled={isUploadingAvatar}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Recomendado: 500x500px
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="mb-6">
        <Label htmlFor="name" className="mb-2 block">Nombre Artístico</Label>
        <Input
          id="name"
          value={artist.name}
          onChange={(e) => setArtist({ ...artist, name: e.target.value })}
          className="h-12 bg-card/50 border-border/50"
        />
      </div>

      {/* Bio */}
      <div className="mb-6">
        <Label htmlFor="bio" className="mb-2 block">Biografía</Label>
        <Textarea
          id="bio"
          value={artist.bio || ''}
          onChange={(e) => setArtist({ ...artist, bio: e.target.value })}
          placeholder="Cuéntale al mundo sobre ti y tu música..."
          rows={4}
          className="bg-card/50 border-border/50"
        />
      </div>

      {/* Public URL */}
      <div className="mb-8 p-4 bg-secondary/30 rounded-xl ring-1 ring-border/30">
        <p className="text-xs text-muted-foreground/60 mb-1">Tu página pública:</p>
        <code className="text-sm text-foreground">
          {typeof window !== 'undefined' ? window.location.origin : ''}/{artist.slug}
        </code>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="rounded-full px-8"
      >
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  )
}
