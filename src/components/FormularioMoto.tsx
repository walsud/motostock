"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useContexto } from "@/lib/useContexto";
import { Shell } from "@/components/Shell";
import { Autocompletar, type ModeloCatalogo } from "@/components/Autocompletar";
import type { ItemStock } from "@/lib/tipos";

// Carga y edición de una moto del stock. La misma pantalla sirve para
// las dos cosas: sin id crea, con id edita.

// Comprime una foto en el navegador antes de subirla (máx 1280px, JPEG)
async function comprimirFoto(archivo: File): Promise<Blob> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(archivo);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const escala = Math.min(1, 1280 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.8)
  );
}

export function FormularioMoto({ itemId }: { itemId?: string }) {
  const { supabase, ctx, cargando } = useContexto();
  const router = useRouter();

  const [catalogo, setCatalogo] = useState<ModeloCatalogo[]>([]);
  const [item, setItem] = useState<ItemStock | null>(null);
  const [modeloSel, setModeloSel] = useState<ModeloCatalogo | null>(null);
  const [anio, setAnio] = useState("");
  const [km, setKm] = useState("");
  const [moneda, setMoneda] = useState<"USD" | "ARS">("USD");
  const [contado, setContado] = useState("");
  const [permuta, setPermuta] = useState("");
  const [costo, setCosto] = useState("");
  const [sucursal, setSucursal] = useState<string>("");
  const [origen, setOrigen] = useState<"propia" | "consignada">("propia");
  const [consigNombre, setConsigNombre] = useState("");
  const [consigTel, setConsigTel] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().slice(0, 10));
  const [dominio, setDominio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ctx?.concesionario) return;
    (async () => {
      const { data: cat } = await supabase
        .from("catalogo_modelos")
        .select("id, marca, modelo, categoria, cilindrada")
        .order("marca")
        .limit(2000);
      setCatalogo((cat as ModeloCatalogo[]) || []);

      if (itemId) {
        const { data } = await supabase.rpc("mi_stock");
        const it = ((data as ItemStock[]) || []).find((x) => x.id === itemId);
        if (it) {
          setItem(it);
          setModeloSel({
            id: it.modelo_id, marca: it.marca, modelo: it.modelo,
            categoria: it.categoria, cilindrada: it.cilindrada,
          });
          setAnio(String(it.anio));
          setKm(String(it.km));
          setMoneda(it.moneda);
          setContado(it.precio_contado != null ? String(it.precio_contado) : "");
          setPermuta(it.precio_permuta != null ? String(it.precio_permuta) : "");
          setCosto(it.costo_compra != null ? String(it.costo_compra) : "");
          setSucursal(it.sucursal_id != null ? String(it.sucursal_id) : "");
          setOrigen(it.origen);
          setConsigNombre(it.consignatario_nombre || "");
          setConsigTel(it.consignatario_telefono || "");
          setDominio(it.dominio || "");
          if (it.fecha_ingreso) setFechaIngreso(it.fecha_ingreso);
          setDescripcion(it.descripcion || "");
          setFotos(it.fotos || []);
        }
      } else if (ctx.mi_sucursal) {
        setSucursal(String(ctx.mi_sucursal));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx?.concesionario || !modeloSel) {
      setError("Elegí el modelo del catálogo.");
      return;
    }
    setError("");
    setGuardando(true);

    const { data: sesion } = await supabase.auth.getUser();
    const uid = sesion.user?.id;

    const base = {
      modelo_id: modeloSel.id,
      anio: parseInt(anio) || new Date().getFullYear(),
      km: parseInt(km.replace(/\./g, "")) || 0,
      moneda,
      precio_contado: contado ? Number(contado.replace(/\./g, "")) : null,
      precio_permuta: permuta ? Number(permuta.replace(/\./g, "")) : null,
      sucursal_id: sucursal ? Number(sucursal) : null,
      origen,
      consignatario_nombre: origen === "consignada" ? consigNombre || null : null,
      consignatario_telefono: origen === "consignada" ? consigTel || null : null,
      dominio: dominio.trim().toUpperCase() || null,
      descripcion: descripcion.trim() || null,
      fecha_ingreso: fechaIngreso || new Date().toISOString().slice(0, 10),
    };
    // El costo viaja solo si el usuario puede tocarlo (si no, ni se manda)
    const conCosto = ctx.permisos?.costos && ctx.permisos?.precios
      ? { ...base, costo_compra: costo ? Number(costo.replace(/\./g, "")) : null }
      : base;

    let id = itemId;
    if (id) {
      const { error: err } = await supabase.from("stock_items").update(conCosto).eq("id", id);
      if (err) {
        setGuardando(false);
        setError(err.message);
        return;
      }
    } else {
      const { data: nuevo, error: err } = await supabase
        .from("stock_items")
        .insert({ ...conCosto, concesionario_id: ctx.concesionario.id, fotos: [] })
        .select("id")
        .single();
      if (err || !nuevo) {
        setGuardando(false);
        setError(err?.message || "No se pudo guardar.");
        return;
      }
      id = nuevo.id;
    }

    // Fotos nuevas: comprimidas y subidas al mismo almacén de Motocambio
    const urls = [...fotos];
    for (let i = 0; i < Math.min(archivos.length, 6 - urls.length); i++) {
      try {
        const blob = await comprimirFoto(archivos[i]);
        const ruta = `${uid}/stock-${id}/f${Date.now()}-${i}.jpg`;
        const { error: errSubida } = await supabase.storage
          .from("fotos")
          .upload(ruta, blob, { contentType: "image/jpeg", upsert: true });
        if (!errSubida) {
          const { data: pub } = supabase.storage.from("fotos").getPublicUrl(ruta);
          urls.push(pub.publicUrl);
        }
      } catch {
        // una foto que falla no frena la carga
      }
    }
    if (urls.length !== fotos.length || archivos.length) {
      await supabase.from("stock_items").update({ fotos: urls }).eq("id", id);
    }

    router.push("/stock");
    router.refresh();
  }

  function quitarFoto(url: string) {
    setFotos(fotos.filter((f) => f !== url));
  }

  const puedePrecios = !!ctx?.permisos?.precios;
  const veCostos = !!ctx?.permisos?.costos;

  return (
    <Shell ctx={ctx} activo="stock">
      <button onClick={() => router.push("/stock")} className="text-sm font-semibold text-gris hover:text-azul">
        ← Volver al stock
      </button>
      <h1 className="font-titulos font-black text-2xl tracking-tight mt-2 mb-4">
        {itemId ? "Editar moto" : "Cargar moto al stock"}
        {item ? ` — ${item.marca} ${item.modelo} ${item.anio}` : ""}
      </h1>

      {cargando ? (
        <p className="text-sm text-gris">Cargando…</p>
      ) : (
        <form onSubmit={guardar} className="bg-white border border-linea rounded-2xl p-5 sm:p-7 max-w-3xl flex flex-col gap-5">
          {/* Fotos */}
          <div>
            <p className="text-sm font-semibold mb-2">Fotos (la primera es la portada)</p>
            <div className="flex gap-2.5 flex-wrap">
              {fotos.map((f) => (
                <div key={f} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f} alt="" className="w-24 h-[70px] rounded-xl object-cover" />
                  <button type="button" onClick={() => quitarFoto(f)}
                    className="absolute -top-2 -right-2 bg-tinta text-white rounded-full w-6 h-6 text-xs font-bold">
                    ✕
                  </button>
                </div>
              ))}
              <label className="w-24 h-[70px] rounded-xl border-2 border-dashed border-linea flex flex-col items-center justify-center text-[11px] font-semibold text-gris cursor-pointer hover:border-azul">
                📷 Agregar
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => setArchivos([...(e.target.files || [])])} />
              </label>
            </div>
            {archivos.length > 0 && (
              <p className="text-xs text-verde-ok font-semibold mt-1.5">
                {archivos.length} foto{archivos.length > 1 ? "s" : ""} lista{archivos.length > 1 ? "s" : ""} para subir al guardar.
              </p>
            )}
          </div>

          {/* Modelo */}
          <div>
            <p className="text-sm font-semibold mb-1.5">
              Modelo <span className="text-[11px] font-bold text-azul bg-[#EAF1FA] rounded-full px-2 py-0.5 ml-1">catálogo Motocambio ✓</span>
            </p>
            {modeloSel ? (
              <div className="flex items-center gap-2 border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm">
                <b>{modeloSel.marca} {modeloSel.modelo}</b>
                <span className="text-gris">· {modeloSel.cilindrada} cc</span>
                <button type="button" onClick={() => setModeloSel(null)}
                  className="ml-auto text-xs font-bold text-azul">Cambiar</button>
              </div>
            ) : (
              <Autocompletar catalogo={catalogo} onElegir={setModeloSel} />
            )}
            {modeloSel && modeloSel.cilindrada < 240 && (
              <p className="text-xs text-ambar mt-1.5">
                Este modelo es de menos de 250cc: se puede tener en stock, pero Motocambio no lo publica en la vidriera.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <label className="text-sm font-semibold">
              Año
              <input required inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
            </label>
            <label className="text-sm font-semibold">
              Kilómetros
              <input required inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
            </label>
            <label className="text-sm font-semibold">
              🗓️ Ingresó al stock
              <input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul bg-white" />
              <span className="block text-xs text-gris font-normal mt-1">
                Si la tenés hace tiempo, poné la fecha real: de acá salen los días en stock.
              </span>
            </label>
          </div>

          {/* Precios */}
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="text-sm font-semibold">
              Moneda
              <select value={moneda} onChange={(e) => setMoneda(e.target.value as "USD" | "ARS")}
                disabled={!puedePrecios}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-azul disabled:opacity-50">
                <option value="USD">Dólares (USD)</option>
                <option value="ARS">Pesos ($)</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              💵 Precio contado
              <input inputMode="numeric" value={contado} onChange={(e) => setContado(e.target.value)}
                disabled={!puedePrecios}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul disabled:opacity-50" />
            </label>
            <label className="text-sm font-semibold">
              🔁 Precio para permuta
              <input inputMode="numeric" value={permuta} onChange={(e) => setPermuta(e.target.value)}
                disabled={!puedePrecios}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul disabled:opacity-50" />
            </label>
          </div>
          <p className="text-xs text-gris -mt-3">
            {puedePrecios
              ? moneda === "ARS"
                ? "Para Motocambio, el precio de permuta se convierte a USD con la cotización de Ajustes."
                : "El precio de permuta es el que usa Motocambio para calcular diferencias."
              : "Los precios los maneja quien tiene el permiso de precios."}
          </p>

          {veCostos && (
            <label className="text-sm font-semibold max-w-[260px]">
              Costo de compra 🔒
              <input inputMode="numeric" value={costo} onChange={(e) => setCosto(e.target.value)}
                disabled={!puedePrecios}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul disabled:opacity-50" />
              <span className="block text-xs text-gris font-normal mt-1">
                Solo lo ve quien tiene el permiso &quot;Ver costos&quot;. Misma moneda que los precios.
              </span>
            </label>
          )}

          {/* Sucursal y origen */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-semibold">
              Sucursal
              <select value={sucursal} onChange={(e) => setSucursal(e.target.value)}
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-azul">
                <option value="">Sin asignar</option>
                {(ctx?.sucursales || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </label>
            <div className="text-sm font-semibold">
              Origen
              <div className="mt-1 flex gap-2">
                <button type="button" onClick={() => setOrigen("propia")}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold ${
                    origen === "propia" ? "border-azul bg-[#EAF1FA] text-azul" : "border-linea text-tinta2"
                  }`}>
                  🏪 Propia
                </button>
                <button type="button" onClick={() => setOrigen("consignada")}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold ${
                    origen === "consignada" ? "border-azul bg-[#EAF1FA] text-azul" : "border-linea text-tinta2"
                  }`}>
                  🤝 Consignada
                </button>
              </div>
            </div>
          </div>

          {origen === "consignada" && (
            <div className="grid sm:grid-cols-2 gap-4 bg-fondo border border-linea rounded-xl p-4">
              <label className="text-sm font-semibold">
                Titular (consignatario)
                <input value={consigNombre} onChange={(e) => setConsigNombre(e.target.value)}
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul bg-white" />
              </label>
              <label className="text-sm font-semibold">
                Teléfono del titular
                <input value={consigTel} onChange={(e) => setConsigTel(e.target.value)}
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul bg-white" />
              </label>
              <p className="text-xs text-gris sm:col-span-2 -mt-1">
                Estos datos los ve solo tu equipo. Nunca se publican.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-semibold">
              Dominio (patente) — privado
              <input value={dominio} onChange={(e) => setDominio(e.target.value)}
                placeholder="Nunca se muestra"
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
            </label>
            <label className="text-sm font-semibold">
              Descripción
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Service al día, cubiertas nuevas…"
                className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
            </label>
          </div>

          {error && <p className="text-sm font-semibold text-rojo-mc">{error}</p>}

          <div className="flex gap-3 flex-wrap">
            <button disabled={guardando}
              className="bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-6 py-3 disabled:opacity-60">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <p className="text-xs text-gris self-center">
              Guardar no publica: desde el stock la publicás en Motocambio cuando quieras.
            </p>
          </div>
        </form>
      )}
    </Shell>
  );
}
