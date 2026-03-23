"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error en el registro");
        return;
      }

      toast.success("¡Cuenta creada!");
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 opacity-0 animate-fade-in">
          <Disc3 className="w-10 h-10 mx-auto text-foreground/80 mb-5" />
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Crea tu cuenta
          </h1>
          <p className="text-muted-foreground/70 mt-2 text-[15px]">
            Empieza a compartir tu música
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 opacity-0 animate-slide-up stagger-2"
        >
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm text-muted-foreground/80"
            >
              Usuario
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="tu-usuario"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                )
              }
              required
              autoComplete="username"
              className="h-12 bg-card/50 border-border/50 focus:border-foreground/30 transition-colors duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm text-muted-foreground/80"
            >
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 bg-card/50 border-border/50 focus:border-foreground/30 transition-colors duration-200"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full text-[15px] hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground/60 mt-8 opacity-0 animate-fade-in stagger-4">
          {"¿Ya tienes cuenta? "}
          <Link
            href="/admin/login"
            className="text-foreground/80 hover:text-foreground transition-colors duration-200"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
