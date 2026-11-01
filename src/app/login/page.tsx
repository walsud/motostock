"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { LogoMS, WordmarkMS } from "@/components/LogoMS";

export default function Login() {
  const supabase = crearClienteNavegador();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (err) {
      setError(
        err.message.includes("Invalid login")
          ? "Mail o contraseña incorrectos."
          : err.message.includes("not confirmed")
          ? "Tenés que confirmar tu mail primero: revisá tu casilla (y spam)."
          : "No pudimos iniciar sesión: " + err.message
      );
      return;
    }
    router.push("/stock");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-tinta flex flex-col items-center px-5 py-12">
      <div className="flex items-center gap-3 mb-8">
        <LogoMS tamano={42} />
        <WordmarkMS claro />
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-7">
        <h1 className="font-titulos font-black text-2xl tracking-tight">Entrá a tu gestor</h1>
        <p className="text-sm text-gris mt-1">
          El stock de tu concesionario, al día y en todas partes — conectado a Motocambio.
        </p>
        <form onSubmit={entrar} className="mt-5 flex flex-col gap-3.5">
          <label className="text-sm font-semibold">
            Mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
          </label>
          <label className="text-sm font-semibold">
            Contraseña
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
          </label>
          {error && <p className="text-sm font-semibold text-rojo-mc">{error}</p>}
          <button disabled={cargando}
            className="bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60">
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-[13px] text-gris mt-4">
          Es la misma cuenta de Motocambio.{" "}
          <a href="https://motocambio.com.ar/recuperar" className="text-azul font-semibold underline">
            ¿Olvidaste la contraseña?
          </a>
        </p>
        <p className="text-[13px] text-gris mt-1.5">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-azul font-semibold underline">Creala acá</Link>
        </p>
      </div>
    </main>
  );
}
