"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useContexto } from "@/lib/useContexto";
import { precio, type ItemStock } from "@/lib/tipos";

// La lista de precios para clientes: fotos y precios de contado,
// con el logo del concesionario. Sin costos, sin datos internos.
// "Imprimir" en el navegador = Guardar como PDF.
export default function ListaPrecios() {
  const { supabase, ctx } = useContexto();
  const [items, setItems] = useState<ItemStock[]>([]);

  useEffect(() => {
    if (!ctx?.concesionario) return;
    (async () => {
      const { data } = await supabase.rpc("mi_stock");
      setItems(((data as ItemStock[]) || []).filter((i) => i.estado === "disponible"));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  const conc = ctx?.concesionario;
  const hoy = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-white max-w-3xl mx-auto px-6 py-8">
      {/* Controles (no salen en el PDF) */}
      <div className="no-imprimir flex items-center gap-3 mb-6">
        <Link href="/stock" className="text-sm font-semibold text-gris hover:text-azul">
          ← Volver al stock
        </Link>
        <button onClick={() => window.print()}
          className="ml-auto bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-5 py-2.5 text-sm">
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      {/* Encabezado con el logo del concesionario */}
      <header className="flex items-center gap-4 border-b-2 border-tinta pb-4">
        {conc?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={conc.logo_url} alt="" className="h-20 w-auto max-w-[280px] object-contain" />
        )}
        <div>
          <h1 className="font-titulos font-black text-2xl tracking-tight">{conc?.nombre}</h1>
          <p className="text-sm text-gris">Lista de precios · {hoy}</p>
        </div>
      </header>

      {/* Las motos */}
      <div className="mt-5 flex flex-col divide-y divide-linea">
        {items.map((it) => (
          <div key={it.id} className="py-3.5 flex items-center gap-4">
            {it.fotos?.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.fotos[0]} alt="" className="w-24 h-[68px] rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-24 h-[68px] rounded-lg bg-fondo border border-linea shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-titulos font-extrabold text-[15px]">
                {it.marca} {it.modelo} · {it.anio}
              </p>
              <p className="text-[13px] text-gris">
                {Number(it.km).toLocaleString("es-AR")} km
                {it.categoria ? ` · ${it.categoria}` : ""}
                {it.sucursal ? ` · ${it.sucursal}` : ""}
              </p>
            </div>
            <p className="font-titulos font-black text-lg shrink-0">
              {precio(it.precio_contado ?? it.precio_permuta, it.moneda)}
            </p>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-sm text-gris text-center">No hay motos disponibles para listar.</p>
        )}
      </div>

      <footer className="mt-6 pt-3 border-t border-linea text-[11px] text-gris">
        Precios de contado, sujetos a cambio sin previo aviso. Tomamos tu usada en parte
        de pago. · Lista generada con MotoStock.
      </footer>
    </main>
  );
}
