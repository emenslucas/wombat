'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Verify by calling the users endpoint — if it works, password is correct
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-token': password },
      })

      if (!res.ok) {
        toast.error('Contraseña incorrecta')
        return
      }

      // Store token in sessionStorage for the admin panel session
      sessionStorage.setItem('admin_token', password)
      router.push('/superadmin')
    } catch {
      toast.error('Error al conectar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 opacity-0 animate-fade-in">
          <ShieldCheck className="w-10 h-10 mx-auto text-foreground/80 mb-5" />
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground/70 mt-2 text-[15px]">Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 opacity-0 animate-slide-up stagger-2">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground/80">Contraseña de administrador</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-12 bg-card/50 border-border/50 focus:border-foreground/30 transition-colors duration-200"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full text-[15px]"
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </main>
  )
}
