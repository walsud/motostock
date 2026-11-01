"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { LogoMS, WordmarkMS } from "@/components/LogoMS";
import { PROVINCIAS } from "@/lib/tipos";

// La cuenta es la misma de Motocambio: si te invitaron a un equipo,
// con crearla alcanza — la invitación se activa sola al entrar.
export default function Registro() {
  const supabase = crearClienteNavegador();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [provincia, setProvincia] = useState("Buenos Aires");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!acepta) {
      setError("Tenés que aceptar los Términos y Condiciones de Motocambio.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setCargando(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, provincia },
        emailRedirectTo: `${location.origin}/login?confirmado=1`,
      },
    });
    setCargando(false);
    if (err) {
      setError(
        err.message.includes("already registered")
          ? "Ese mail ya tiene cuenta: probá entrar directamente."
          : "No pudimos crear la cuenta: " + err.message
      );
      return;
    }
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError("Ese mail ya tiene cuenta: probá entrar directamente.");
      return;
    }
    router.push("/verificar?email=" + encodeURIComponent(email));
  }

  return (
    <main className="min-h-screen bg-tinta flex flex-col items-center px-5 py-12">
      <div className="flex items-center gap-3 mb-8">
        <LogoMS tamano={42} />
        <WordmarkMS claro />
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-7">
        <h1 className="font-titulos font-black text-2xl tracking-tight">Creá tu cuenta</h1>
        <p className="text-sm text-gris mt-1">
          Si te invitaron a un equipo, usá el mail al que te invitaron: al entrar,
          tu lugar se activa solo.
        </p>
        <form onSubmit={crear} className="mt-5 flex flex-col gap-3.5">
          <label className="text-sm font-semibold">
            Tu nombre
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
          </label>
          <label className="text-sm font-semibold">
            Provincia
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)}
              className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul bg-white">
              {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
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
          <label className="flex items-start gap-2 text-[13px] text-tinta2">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5" />
            <span>
              Acepto los{" "}
              <a href="https://motocambio.com.ar/terminos" target="_blank" rel="noopener noreferrer"
                className="text-azul font-semibold underline">Términos y Condiciones de Motocambio</a>.
            </span>
          </label>
          {error && <p className="text-sm font-semibold text-rojo-mc">{error}</p>}
          <button disabled={cargando}
            className="bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60">
            {cargando ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
        <p className="text-[13px] text-gris mt-4">
          ¿Ya tenés cuenta? <Link href="/login" className="text-azul font-semibold underline">Entrá acá</Link>
        </p>
      </div>
    </main>
  );
}
