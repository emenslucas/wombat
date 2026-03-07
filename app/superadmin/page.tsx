'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShieldCheck, Trash2, LogOut, Users, HardDrive, Music } from 'lucide-react'
import type { AdminUserRow } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [token, setToken] = useState('')

  const fetchUsers = useCallback(async (adminToken: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-token': adminToken },
      })
      if (res.status === 401) {
        router.push('/superadmin/login')
        return
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    const adminToken = sessionStorage.getItem('admin_token')
    if (!adminToken) {
      router.push('/superadmin/login')
      return
    }
    setToken(adminToken)
    fetchUsers(adminToken)
  }, [fetchUsers, router])

  const handleDelete = async (userId: string) => {
    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al eliminar')
        return
      }
      toast.success('Cuenta eliminada correctamente')
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch {
      toast.error('Error al eliminar la cuenta')
    } finally {
      setDeletingId(null)
    }
  }

  const totalStorage = users.reduce((acc, u) => acc + Number(u.total_size), 0)
  const totalTracks = users.reduce((acc, u) => acc + u.track_count, 0)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-foreground/70" />
            <span className="font-semibold tracking-tight">Panel de Administración</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => {
              sessionStorage.removeItem('admin_token')
              router.push('/superadmin/login')
            }}
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground/60 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Usuarios</span>
            </div>
            <p className="text-3xl font-semibold">{users.length}</p>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground/60 mb-2">
              <Music className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Tracks totales</span>
            </div>
            <p className="text-3xl font-semibold">{totalTracks}</p>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground/60 mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Almacenamiento</span>
            </div>
            <p className="text-3xl font-semibold">{formatBytes(totalStorage)}</p>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30">
            <h2 className="font-semibold text-foreground/90">Cuentas de usuarios</h2>
            <p className="text-sm text-muted-foreground/60 mt-0.5">Ordenadas por uso de almacenamiento</p>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center text-muted-foreground/50">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center text-muted-foreground/50">No hay usuarios registrados</div>
          ) : (
            <div className="divide-y divide-border/30">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-accent/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-foreground truncate">@{user.username}</p>
                      <span className="text-xs text-muted-foreground/50 truncate hidden sm:block">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                      <span>{user.track_count} {user.track_count === 1 ? 'track' : 'tracks'}</span>
                      <span>{formatBytes(Number(user.total_size))}</span>
                      <span className="hidden sm:block">Registrado {formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Storage bar */}
                  <div className="hidden md:block w-32">
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/40 rounded-full transition-all"
                        style={{ width: `${Math.min((Number(user.total_size) / (500 * 1024 * 1024)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-1 text-right">
                      {((Number(user.total_size) / (500 * 1024 * 1024)) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={deletingId === user.id}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Eliminar cuenta</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border/40">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar cuenta de @{user.username}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground/70">
                          Esta acción eliminará permanentemente la cuenta, todos sus tracks ({user.track_count}) y archivos en almacenamiento ({formatBytes(Number(user.total_size))}). No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary border-border/40">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(user.id)}
                        >
                          Eliminar cuenta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
