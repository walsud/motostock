"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { LogoMS, WordmarkMS } from "@/components/LogoMS";
import type { Contexto } from "@/lib/tipos";

// El marco de todas las pantallas: barra lateral en escritorio,
// barra inferior en el celular, y el logo del concesionario a la vista.
export function Shell({
  ctx,
  activo,
  children,
}: {
  ctx: Contexto | null;
  activo: "stock" | "equipo" | "ajustes" | "otro";
  children: React.ReactNode;
}) {
  const supabase = crearClienteNavegador();
  const router = useRouter();
  const conc = ctx?.concesionario;
  const esDueno = ctx?.rol === "dueno";

  async function salir() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const items: { href: string; icono: string; texto: string; clave: string; solo?: boolean }[] = [
    { href: "/stock", icono: "📋", texto: "Mi stock", clave: "stock" },
    { href: "/equipo", icono: "🧑‍🤝‍🧑", texto: "Equipo", clave: "equipo", solo: true },
    { href: "/ajustes", icono: "⚙️", texto: "Ajustes", clave: "ajustes", solo: true },
  ];
  const visibles = items.filter((i) => !i.solo || esDueno);

  return (
    <div className="min-h-screen flex">
      {/* ----- Barra lateral (escritorio) ----- */}
      <aside className="hidden md:flex w-56 shrink-0 bg-tinta text-white flex-col p-4 sticky top-0 h-screen">
        <Link href="/stock" className="flex items-center gap-2.5 px-1">
          <LogoMS tamano={38} />
          <WordmarkMS claro />
        </Link>

        {conc && (
          <div className="mt-4 bg-white rounded-xl p-2.5" title={conc.nombre}>
            {conc.logo_url ? (
              // El logo del concesionario, a todo el ancho de la tarjeta
              // (los logos reales suelen ser apaisados).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={conc.logo_url} alt={conc.nombre}
                className="w-full max-h-16 object-contain rounded-lg" />
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏍️</span>
                <span className="font-titulos font-extrabold text-[13px] leading-tight text-tinta">
                  {conc.nombre}
                </span>
              </div>
            )}
          </div>
        )}

        <nav className="mt-6 flex flex-col gap-1">
          {visibles.map((i) => (
            <Link key={i.clave} href={i.href}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                activo === i.clave ? "bg-azul text-white" : "text-[#C3CCD7] hover:bg-white/10"
              }`}>
              {i.icono} {i.texto}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="bg-white/10 rounded-xl p-3 text-[12px] leading-snug text-[#B9C3CE]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3DDC84] mr-1.5" />
            <b className="text-white">Conectado a Motocambio</b><br />
            Lo publicado entra solo a la vidriera y al matching.
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[12px] text-[#9AA6B4] truncate">
              {ctx?.nombre || ""} · {esDueno ? "Dueño" : ctx?.rol === "encargado" ? "Encargado" : "Vendedor"}
            </span>
            <button onClick={salir} className="text-[12px] font-bold text-[#C3CCD7] hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ----- Contenido ----- */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        {/* Barra superior (celular) */}
        <header className="md:hidden bg-tinta text-white px-4 py-3 flex items-center gap-2 sticky top-0 z-20">
          <LogoMS tamano={30} />
          <WordmarkMS claro />
          {conc?.logo_url ? (
            <span className="ml-auto bg-white rounded-md px-1.5 py-0.5 max-w-[40%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={conc.logo_url} alt={conc.nombre || ""} className="h-6 w-auto max-w-full object-contain" />
            </span>
          ) : (
            <span className="ml-auto text-[12px] text-[#9AA6B4] truncate max-w-[40%]">
              {conc?.nombre || ""}
            </span>
          )}
          <button onClick={salir} className="text-[12px] font-bold text-[#C3CCD7]">Salir</button>
        </header>

        <main className="flex-1 p-4 md:p-7 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* ----- Barra inferior (celular) ----- */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-linea flex z-20 pb-[env(safe-area-inset-bottom)]">
        {visibles.map((i) => (
          <Link key={i.clave} href={i.href}
            className={`flex-1 text-center py-2.5 text-[11px] font-semibold ${
              activo === i.clave ? "text-azul" : "text-gris"
            }`}>
            <span className="block text-lg leading-none mb-0.5">{i.icono}</span>
            {i.texto}
          </Link>
        ))}
      </nav>
    </div>
  );
}
