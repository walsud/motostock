"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContexto } from "@/lib/useContexto";
import { LogoMS, WordmarkMS } from "@/components/LogoMS";

// Primera vez: el dueño crea el gestor de su concesionario.
// Solo para cuentas de concesionario aprobadas por Motocambio.
export default function Crear() {
  const { supabase, ctx, cargando } = useContexto();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreando(true);
    const { error: err } = await supabase.rpc("crear_concesionario", { p_nombre: nombre });
    setCreando(false);
    if (err) {
      setError(err.message);
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
        {cargando ? (
          <p className="text-sm text-gris">Cargando…</p>
        ) : ctx?.puede_crear ? (
          <>
            <h1 className="font-titulos font-black text-2xl tracking-tight">
              ¡Hola{ctx.nombre ? `, ${ctx.nombre}` : ""}! 👋
            </h1>
            <p className="text-sm text-tinta2 mt-2 leading-relaxed">
              Creá el gestor de tu concesionario: después invitás a tu equipo,
              cargás el stock y publicás en Motocambio con un botón.
            </p>
            <form onSubmit={crear} className="mt-5 flex flex-col gap-3.5">
              <label className="text-sm font-semibold">
                Nombre del concesionario
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Rodados del Sur"
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
              </label>
              {error && <p className="text-sm font-semibold text-rojo-mc">{error}</p>}
              <button disabled={creando}
                className="bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60">
                {creando ? "Creando…" : "Crear mi gestor →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-titulos font-black text-2xl tracking-tight">Falta un paso 🤏</h1>
            <p className="text-sm text-tinta2 mt-2 leading-relaxed">
              {ctx?.nombre ? `${ctx.nombre}, tu` : "Tu"} cuenta todavía no está habilitada
              para crear un gestor. Puede ser por dos motivos:
            </p>
            <p className="text-sm text-tinta2 mt-3 leading-relaxed">
              <b>¿Sos parte del equipo de un concesionario?</b> Pedile al dueño que te
              invite desde su pantalla de Equipo con este mail — al volver a entrar,
              tu lugar aparece solo.
            </p>
            <p className="text-sm text-tinta2 mt-3 leading-relaxed">
              <b>¿Sos el dueño?</b> Tu cuenta tiene que estar aprobada como concesionario
              en Motocambio (con CUIT verificado). Escribinos a{" "}
              <a href="mailto:contacto@motocambio.com.ar" className="text-azul font-semibold underline">
                contacto@motocambio.com.ar
              </a>{" "}
              y lo activamos en el día.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
