"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useContexto } from "@/lib/useContexto";
import { Shell } from "@/components/Shell";
import { precio, fechaCorta, diasEnStock, type ItemStock } from "@/lib/tipos";

// La pantalla central: todo el stock, con sus dos precios, su estado
// y el puente con Motocambio a un toque.
export default function Stock() {
  const { supabase, ctx, cargando } = useContexto();
  const [items, setItems] = useState<ItemStock[]>([]);
  const [filtroSuc, setFiltroSuc] = useState<number | "todas">("todas");
  const [filtroEstado, setFiltroEstado] = useState<"activas" | "senadas" | "vendidas">("activas");
  const [busqueda, setBusqueda] = useState("");
  const [vendiendo, setVendiendo] = useState<ItemStock | null>(null);
  const [ventaCanal, setVentaCanal] = useState("mostrador");
  const [ventaPrecio, setVentaPrecio] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.rpc("mi_stock");
    if (!error) setItems((data as ItemStock[]) || []);
  }, [supabase]);

  useEffect(() => {
    if (ctx?.concesionario) cargar();
  }, [ctx, cargar]);

  function avisar(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 3500);
  }

  async function accion(item: ItemStock, rpc: string, args: Record<string, unknown> = {}) {
    if (ocupado) return;
    setOcupado(item.id);
    const { error } = await supabase.rpc(rpc, { p_item: item.id, ...args });
    if (error) avisar(error.message);
    await cargar();
    setOcupado(null);
  }

  async function confirmarVenta(e: React.FormEvent) {
    e.preventDefault();
    if (!vendiendo) return;
    const it = vendiendo;
    setVendiendo(null);
    await accion(it, "vender_stock_item", {
      p_canal: ventaCanal,
      p_precio: ventaPrecio ? Number(ventaPrecio.replace(/\./g, "")) : null,
      p_moneda: it.moneda,
    });
    setVentaPrecio("");
  }

  function compartir(it: ItemStock) {
    const link = `https://motocambio.com.ar/moto/${it.moto_id}`;
    const texto = `¡Mirá esta ${it.marca} ${it.modelo} ${it.anio}! ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  async function copiarLink(it: ItemStock) {
    const link = `https://motocambio.com.ar/moto/${it.moto_id}`;
    try {
      await navigator.clipboard.writeText(link);
      avisar("🔗 Link copiado — pegalo donde quieras: " + link);
    } catch {
      avisar("El link es: " + link);
    }
  }

  async function exportarExcel() {
    const XLSX = await import("xlsx");
    const veCostos = !!ctx?.permisos?.costos;
    const filas = items.map((i) => ({
      Marca: i.marca, Modelo: i.modelo, "Año": i.anio, Km: i.km,
      Moneda: i.moneda, "Precio contado": i.precio_contado, "Precio permuta": i.precio_permuta,
      ...(veCostos ? { "Costo de compra": i.costo_compra } : {}),
      Sucursal: i.sucursal || "", Origen: i.origen,
      "Ingresó": i.fecha_ingreso || "",
      "Días en stock": i.fecha_ingreso ? diasEnStock(i.fecha_ingreso, i.vendida_el) : "",
      Estado: i.estado, "En Motocambio": i.publicada ? "publicada" : "",
      "Venta: canal": i.venta_canal || "", "Venta: precio": i.venta_precio ?? "",
      "Vendida el": i.vendida_el ? i.vendida_el.slice(0, 10) : "",
      Dominio: i.dominio || "",
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Stock");
    XLSX.writeFile(libro, `stock-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const visibles = useMemo(() => {
    let lista = items;
    if (filtroEstado === "activas") lista = lista.filter((i) => i.estado === "disponible");
    if (filtroEstado === "senadas") lista = lista.filter((i) => i.estado === "senada");
    if (filtroEstado === "vendidas") lista = lista.filter((i) => i.estado === "vendida");
    if (filtroSuc !== "todas") lista = lista.filter((i) => i.sucursal_id === filtroSuc);
    const q = busqueda.trim().toLowerCase();
    if (q) lista = lista.filter((i) =>
      `${i.marca} ${i.modelo} ${i.anio} ${i.dominio || ""}`.toLowerCase().includes(q));
    return lista;
  }, [items, filtroSuc, filtroEstado, busqueda]);

  const stats = useMemo(() => ({
    total: items.filter((i) => i.estado !== "vendida").length,
    publicadas: items.filter((i) => i.publicada && i.estado === "disponible").length,
    senadas: items.filter((i) => i.estado === "senada").length,
    vendidas: items.filter((i) => i.estado === "vendida").length,
  }), [items]);

  const puedePublicar = !!ctx?.permisos?.publicar;
  const puedeEditar = !!ctx?.permisos?.editar;

  return (
    <Shell ctx={ctx} activo="stock">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-titulos font-black text-2xl tracking-tight">Mi stock</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={exportarExcel}
            className="border-2 border-linea bg-white hover:border-azul font-titulos font-extrabold text-[13px] rounded-xl px-4 py-2 text-tinta2">
            ⬇️ Excel
          </button>
          <Link href="/lista-precios"
            className="border-2 border-linea bg-white hover:border-azul font-titulos font-extrabold text-[13px] rounded-xl px-4 py-2 text-tinta2">
            🖨️ Lista de precios (PDF)
          </Link>
        </div>
      </div>

      {/* Números de hoy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          [stats.total, "Motos en stock"],
          [stats.publicadas, "Publicadas en Motocambio"],
          [stats.senadas, "Señadas"],
          [stats.vendidas, "Vendidas"],
        ].map(([n, l]) => (
          <div key={l} className="bg-white border border-linea rounded-2xl px-4 py-3">
            <p className="font-titulos font-black text-2xl">{n}</p>
            <p className="text-[12px] text-gris font-semibold">{l}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mt-4 flex-wrap items-center">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar modelo, año, dominio…"
          className="border-2 border-linea rounded-xl px-3.5 py-2 text-sm bg-white outline-none focus:border-azul w-56" />
        {([["activas", "Disponibles"], ["senadas", "✋ Señadas"], ["vendidas", "💰 Vendidas"]] as const).map(([v, t]) => (
          <button key={v} onClick={() => setFiltroEstado(v)}
            className={`rounded-full border-2 px-3.5 py-1.5 text-[13px] font-semibold ${
              filtroEstado === v ? "border-azul text-azul bg-[#EAF1FA]" : "border-linea bg-white text-gris"
            }`}>
            {t}
          </button>
        ))}
        <select value={String(filtroSuc)}
          onChange={(e) => setFiltroSuc(e.target.value === "todas" ? "todas" : Number(e.target.value))}
          className="rounded-full border-2 border-linea bg-white px-3 py-1.5 text-[13px] font-semibold text-gris outline-none">
          <option value="todas">Todas las sucursales</option>
          {(ctx?.sucursales || []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        {puedeEditar && (
          <Link href="/stock/nueva"
            className="ml-auto bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-5 py-2.5 text-sm">
            + Cargar moto
          </Link>
        )}
      </div>

      {aviso && (
        <p className="mt-3 bg-[#FDF1E3] border border-[#EFD9BB] text-ambar text-sm font-semibold rounded-xl px-4 py-2.5">
          {aviso}
        </p>
      )}

      {/* La lista */}
      <div className="mt-4 flex flex-col gap-3">
        {cargando ? (
          <p className="text-sm text-gris">Cargando el stock…</p>
        ) : visibles.length === 0 ? (
          <div className="bg-white border border-linea rounded-2xl p-8 text-center">
            <p className="text-4xl mb-2">🏍️</p>
            <p className="font-titulos font-extrabold">
              {items.length === 0 ? "Tu stock está vacío" : "Nada por acá con esos filtros"}
            </p>
            {items.length === 0 && puedeEditar && (
              <Link href="/stock/nueva" className="inline-block mt-3 bg-azul text-white font-titulos font-extrabold rounded-xl px-5 py-2.5 text-sm">
                Cargar la primera moto →
              </Link>
            )}
          </div>
        ) : (
          visibles.map((it) => (
            <div key={it.id} className="bg-white border border-linea rounded-2xl p-3.5 flex gap-3.5 flex-wrap sm:flex-nowrap items-center">
              {it.fotos?.length ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.fotos[0]} alt="" className="w-20 h-[60px] rounded-xl object-cover shrink-0" loading="lazy" />
              ) : (
                <div className="w-20 h-[60px] rounded-xl bg-gradient-to-br from-tinta to-[#2A3744] flex items-center justify-center text-xl shrink-0">
                  {it.estado === "vendida" ? "💰" : "📷"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-titulos font-extrabold text-[15px] leading-tight">
                  {it.marca} {it.modelo} · {it.anio}
                  {it.origen === "consignada" && (
                    <span className="ml-2 text-[11px] font-bold text-azul bg-[#EAF1FA] rounded-full px-2 py-0.5 align-middle">
                      Consignada{it.consignatario_nombre ? ` · ${it.consignatario_nombre.split(" ")[0]}` : ""}
                    </span>
                  )}
                </p>
                <p className="text-[12px] text-gris mt-0.5">
                  {Number(it.km).toLocaleString("es-AR")} km
                  {it.sucursal ? ` · ${it.sucursal}` : ""}
                  {it.fecha_ingreso && it.estado !== "vendida"
                    ? ` · 🗓️ en stock hace ${diasEnStock(it.fecha_ingreso)} día${diasEnStock(it.fecha_ingreso) === 1 ? "" : "s"}`
                    : ""}
                  {it.actualizado_por_nombre ? ` · ${fechaCorta(it.actualizado_el)} por ${it.actualizado_por_nombre}` : ""}
                </p>
                <p className="text-[13px] mt-1">
                  <b>{precio(it.precio_contado, it.moneda)}</b> contado ·{" "}
                  <b>{precio(it.precio_permuta, it.moneda)}</b> permuta
                  {it.costo_compra != null && (
                    <span className="text-gris"> · costo {precio(it.costo_compra, it.moneda)} 🔒</span>
                  )}
                </p>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {it.estado === "vendida" ? (
                    <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-[#EDF0F4] text-gris">
                      💰 Vendida · {it.venta_canal}{it.venta_precio ? ` · ${precio(it.venta_precio, it.venta_moneda)}` : ""} · {fechaCorta(it.vendida_el)}
                      {it.fecha_ingreso ? ` · tardó ${diasEnStock(it.fecha_ingreso, it.vendida_el)} días` : ""}
                    </span>
                  ) : it.estado === "senada" ? (
                    <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-[#EEE9F7] text-viol">
                      ✋ Señada {fechaCorta(it.senada_el)} · pausada en Motocambio
                    </span>
                  ) : it.publicada ? (
                    <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-[#E4F5EC] text-verde-ok">
                      ● Publicada en Motocambio
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-[#FBF1DE] text-ambar">
                      {it.fotos?.length ? "Sin publicar" : "Sin publicar · faltan fotos"}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex sm:flex-col gap-x-4 gap-y-1.5 flex-wrap items-center sm:items-end sm:ml-auto sm:shrink-0 sm:text-right w-full sm:w-auto">
                <Link href={`/stock/${it.id}`} className="text-[13px] font-bold text-azul">Editar</Link>
                {it.estado === "disponible" && puedePublicar && (
                  <button disabled={ocupado === it.id}
                    onClick={() => accion(it, it.publicada ? "despublicar_stock_item" : "publicar_stock_item")}
                    className="text-[13px] font-bold text-verde-ok disabled:opacity-50">
                    {it.publicada ? "Despublicar" : "Publicar en Motocambio"}
                  </button>
                )}
                {it.estado === "disponible" && it.publicada && it.moto_id && (
                  <>
                    <button onClick={() => compartir(it)} className="text-[13px] font-bold text-verde-ok">
                      📲 Compartir
                    </button>
                    <button onClick={() => copiarLink(it)} className="text-[13px] font-bold text-azul">
                      🔗 Copiar link
                    </button>
                  </>
                )}
                {puedeEditar && it.estado === "disponible" && (
                  <button disabled={ocupado === it.id} onClick={() => accion(it, "senar_stock_item")}
                    className="text-[13px] font-bold text-viol disabled:opacity-50">
                    ✋ Señar
                  </button>
                )}
                {puedeEditar && it.estado === "senada" && (
                  <button disabled={ocupado === it.id} onClick={() => accion(it, "liberar_sena")}
                    className="text-[13px] font-bold text-viol disabled:opacity-50">
                    Liberar seña
                  </button>
                )}
                {puedeEditar && it.estado !== "vendida" && (
                  <button onClick={() => { setVendiendo(it); setVentaPrecio(""); }}
                    className="text-[13px] font-bold text-ambar">
                    💰 Registrar venta
                  </button>
                )}
                {puedeEditar && it.estado === "vendida" && (
                  <button disabled={ocupado === it.id} onClick={() => accion(it, "deshacer_venta")}
                    className="text-[13px] font-bold text-gris disabled:opacity-50">
                    Deshacer venta
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-gris mt-4 leading-relaxed">
        🔒 El costo lo ven solo los usuarios autorizados. ✋ Una moto señada queda
        reservada y se pausa sola en Motocambio. 💰 La venta se registra con canal y
        precio final, se haya vendido por donde sea.
      </p>

      {/* Mini-ventana de venta */}
      {vendiendo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setVendiendo(null)}>
          <form onSubmit={confirmarVenta} onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-3.5">
            <h2 className="font-titulos font-black text-xl tracking-tight">
              💰 Registrar venta
            </h2>
            <p className="text-sm text-gris -mt-2">
              {vendiendo.marca} {vendiendo.modelo} {vendiendo.anio}
            </p>
            <label className="text-sm font-semibold">
              ¿Por dónde se vendió?
              <select value={ventaCanal} onChange={(e) => setVentaCanal(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-azul">
                <option value="mostrador">Mostrador / salón</option>
                <option value="motocambio">Motocambio</option>
                <option value="otro">Otro canal</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Precio final ({vendiendo.moneda === "ARS" ? "$" : "USD"}) — opcional
              <input inputMode="numeric" value={ventaPrecio} onChange={(e) => setVentaPrecio(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
            </label>
            <p className="text-xs text-gris">
              Si estaba publicada, sale de Motocambio automáticamente.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl py-2.5">
                Registrar
              </button>
              <button type="button" onClick={() => setVendiendo(null)}
                className="border-2 border-linea font-semibold rounded-xl px-4 text-tinta2">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
