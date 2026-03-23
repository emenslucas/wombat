import Link from 'next/link'
import { Disc3, ArrowRight, Music, Share2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/30">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 opacity-0 animate-fade-in">
            <Image src="/icons/wombat.svg" alt="Wombat" width={20} height={20} />
            <span className="font-semibold tracking-tight">Wombat</span>
          </Link>
          <div className="flex items-center gap-3 opacity-0 animate-fade-in stagger-1">
            <Link href="/admin/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/admin/register">
              <Button size="sm" className="rounded-full px-5">Comenzar</Button>
            </Link>
          </div>

        </nav>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-28 md:py-40 text-center">
        <h1 className="text-5xl md:text-6xl font-semibold text-foreground tracking-tight text-balance leading-[1.1] opacity-0 animate-fade-in stagger-2">
          Una página hecha por y para
          <br />
          <span className="text-muted-foreground/60">Wombats</span>
        </h1>
        <p className="mt-8 text-lg text-muted-foreground/80 max-w-xl mx-auto leading-relaxed opacity-0 animate-fade-in stagger-3">
          Compartí tu música con otros wombats alrededor del mundo.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-slide-up stagger-4">
          <Link href="/admin/register">
            <Button size="lg" className="min-w-[220px] rounded-full h-12 text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
              Crear tu página
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/30">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            <div className="opacity-0 animate-slide-up stagger-5">
              <div className="w-14 h-14 bg-secondary/50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-border/30">
                <Music className="w-6 h-6 text-foreground/80" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Sube tus tracks
              </h3>
              <p className="text-muted-foreground/70 leading-relaxed">
                Soporte para archivos MP3 y WAV. Organiza tu música en álbumes, EPs y singles.
              </p>
            </div>
            <div className="opacity-0 animate-slide-up stagger-6">
              <div className="w-14 h-14 bg-secondary/50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-border/30">
                <Share2 className="w-6 h-6 text-foreground/80" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Comparte con cualquiera
              </h3>
              <p className="text-muted-foreground/70 leading-relaxed">
                Obtén un link limpio y compartible de tu música. Perfecto para enviar a fans, sellos o colaboradores.
              </p>
            </div>
            <div className="opacity-0 animate-slide-up stagger-7">
              <div className="w-14 h-14 bg-secondary/50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-border/30">
                <Smartphone className="w-6 h-6 text-foreground/80" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Escucha en cualquier lugar
              </h3>
              <p className="text-muted-foreground/70 leading-relaxed">
                Un reproductor elegante que funciona en escritorio y móvil. Tus oyentes pueden disfrutar tu música donde sea.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-muted-foreground/60">
            <Disc3 className="w-4 h-4" />
            <span className="text-sm">Wombat</span>
          </div>
          <p className="text-sm text-muted-foreground/50">
            Para artistas, por artistas.
          </p>
        </div>
      </footer>
    </main>
  )
}
