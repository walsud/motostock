"use client";
import { useEffect, useState } from "react";
import { useContexto } from "@/lib/useContexto";
import { Shell } from "@/components/Shell";
import { PROVINCIAS, type Sucursal } from "@/lib/tipos";

// Ajustes del concesionario: nombre, logo, cotización y sucursales.
export default function Ajustes() {
  const { supabase, ctx, cargando } = useContexto();
  const [nombre, setNombre] = useState("");
  const [cotizacion, setCotizacion] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [nuevaSuc, setNuevaSuc] = useState("");
  const [nuevaProv, setNuevaProv] = useState("Buenos Aires");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!ctx?.concesionario) return;
    setNombre(ctx.concesionario.nombre);
    setCotizacion(String(ctx.concesionario.cotizacion_usd));
    setLogoUrl(ctx.concesionario.logo_url);
    setSucursales(ctx.sucursales || []);
  }, [ctx]);

  function avisar(t: string) {
    setAviso(t);
    setTimeout(() => setAviso(""), 3500);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx?.concesionario) return;
    setGuardando(true);
    const { error } = await supabase
      .from("concesionarios")
      .update({
        nombre: nombre.trim(),
        cotizacion_usd: Number(cotizacion.replace(/\./g, "")) || 1500,
      })
      .eq("id", ctx.concesionario.id);
    setGuardando(false);
    avisar(error ? error.message : "✓ Guardado.");
  }

  async function subirLogo(archivo: File) {
    if (!ctx?.concesionario) return;
    const { data: sesion } = await supabase.auth.getUser();
    const ruta = `${sesion.user?.id}/logo-${Date.now()}.png`;
    const { error } = await supabase.storage.from("fotos").upload(ruta, archivo, { upsert: true });
    if (error) {
      avisar("No se pudo subir el logo: " + error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("fotos").getPublicUrl(ruta);
    await supabase.from("concesionarios").update({ logo_url: pub.publicUrl }).eq("id", ctx.concesionario.id);
    setLogoUrl(pub.publicUrl);
    avisar("✓ Logo actualizado. Se va a ver en tus pantallas y en la lista de precios.");
  }

  async function agregarSucursal(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx?.concesionario || !nuevaSuc.trim()) return;
    const { data, error } = await supabase
      .from("sucursales")
      .insert({ concesionario_id: ctx.concesionario.id, nombre: nuevaSuc.trim(), provincia: nuevaProv })
      .select("id, nombre, provincia")
      .single();
    if (!error && data) {
      setSucursales([...sucursales, data as Sucursal]);
      setNuevaSuc("");
    } else if (error) avisar(error.message);
  }

  async function quitarSucursal(s: Sucursal) {
    await supabase.from("sucursales").update({ activa: false }).eq("id", s.id);
    setSucursales(sucursales.filter((x) => x.id !== s.id));
  }

  const esDueno = ctx?.rol === "dueno";

  return (
    <Shell ctx={ctx} activo="ajustes">
      <h1 className="font-titulos font-black text-2xl tracking-tight">Ajustes</h1>

      {cargando ? (
        <p className="text-sm text-gris mt-5">Cargando…</p>
      ) : !esDueno ? (
        <p className="text-sm text-gris mt-5 bg-white border border-linea rounded-xl p-5">
          Los ajustes los maneja el dueño del concesionario.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-5 max-w-2xl">
          {aviso && (
            <p className="text-sm font-semibold text-azul bg-[#EAF1FA] border border-[#C9DCF2] rounded-xl px-4 py-2.5">
              {aviso}
            </p>
          )}

          {/* Identidad */}
          <form onSubmit={guardar} className="bg-white border border-linea rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="font-titulos font-extrabold text-lg">El concesionario</h2>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="w-16 h-16 rounded-xl object-contain border border-linea bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-linea flex items-center justify-center text-2xl">
                  🏍️
                </div>
              )}
              <label className="text-sm font-bold text-azul cursor-pointer">
                {logoUrl ? "Cambiar logo" : "Subir tu logo"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0])} />
                <span className="block text-xs text-gris font-normal">
                  Aparece en tus pantallas y en la lista de precios.
                </span>
              </label>
            </div>
            <label className="text-sm font-semibold">
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
            </label>
            <label className="text-sm font-semibold max-w-[280px]">
              Cotización del dólar (pesos por USD)
              <input inputMode="numeric" value={cotizacion} onChange={(e) => setCotizacion(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
              <span className="block text-xs text-gris font-normal mt-1">
                Con esta cotización se convierten los precios en pesos al publicar en Motocambio.
              </span>
            </label>
            <button disabled={guardando}
              className="self-start bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </form>

          {/* Sucursales */}
          <div className="bg-white border border-linea rounded-2xl p-5">
            <h2 className="font-titulos font-extrabold text-lg">📍 Sucursales</h2>
            <div className="mt-3 flex flex-col gap-2">
              {sucursales.map((s) => (
                <div key={s.id} className="flex items-center gap-3 border border-linea rounded-xl px-3.5 py-2.5 text-sm">
                  <b>{s.nombre}</b>
                  <span className="text-gris">{s.provincia || ""}</span>
                  <button onClick={() => quitarSucursal(s)}
                    className="ml-auto text-[12px] font-bold text-rojo-mc">
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={agregarSucursal} className="mt-3 flex gap-2 flex-wrap">
              <input value={nuevaSuc} onChange={(e) => setNuevaSuc(e.target.value)}
                placeholder="Nombre (ej: Sucursal Ruta 8)"
                className="flex-1 min-w-[180px] border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
              <select value={nuevaProv} onChange={(e) => setNuevaProv(e.target.value)}
                className="border-2 border-linea rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-azul">
                {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <button className="bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-4 text-sm">
                Agregar
              </button>
            </form>
            <p className="text-xs text-gris mt-2">
              La provincia de la sucursal es la que se muestra en Motocambio al publicar.
            </p>
          </div>
        </div>
      )}
    </Shell>
  );
}
