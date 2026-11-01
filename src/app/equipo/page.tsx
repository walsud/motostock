"use client";
import { useCallback, useEffect, useState } from "react";
import { useContexto } from "@/lib/useContexto";
import { Shell } from "@/components/Shell";

interface Miembro {
  id: number;
  invitado_email: string;
  nombre: string | null;
  rol: string;
  sucursal_id: number | null;
  sucursal: string | null;
  puede_editar: boolean;
  puede_precios: boolean;
  puede_publicar: boolean;
  ve_costos: boolean;
  activo: boolean;
  vinculado: boolean;
}

interface Evento {
  detalle: string;
  nombre: string;
  creado_el: string;
}

// La pantalla del dueño: quién trabaja en el gestor y qué puede hacer.
export default function Equipo() {
  const { supabase, ctx, cargando } = useContexto();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [invitando, setInvitando] = useState(false);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [sucursal, setSucursal] = useState("");
  const [pEditar, setPEditar] = useState(true);
  const [pPrecios, setPPrecios] = useState(false);
  const [pPublicar, setPPublicar] = useState(false);
  const [pCostos, setPCostos] = useState(false);
  const [aviso, setAviso] = useState("");
  const [pendienteDe, setPendienteDe] = useState("");

  const cargar = useCallback(async () => {
    const [eq, ev] = await Promise.all([
      supabase.rpc("mi_equipo"),
      supabase.rpc("mis_eventos", { p_limite: 12 }),
    ]);
    setMiembros((eq.data as Miembro[]) || []);
    setEventos((ev.data as Evento[]) || []);
  }, [supabase]);

  useEffect(() => {
    if (ctx?.concesionario) cargar();
  }, [ctx, cargar]);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    const { data, error } = await supabase.rpc("invitar_miembro", {
      p_email: email, p_rol: rol,
      p_sucursal: sucursal ? Number(sucursal) : null,
      p_editar: pEditar, p_precios: pPrecios, p_publicar: pPublicar, p_costos: pCostos,
    });
    if (error) {
      setAviso(error.message);
      return;
    }
    if (data === "vinculado") {
      setAviso("✓ Listo: ya tenía cuenta, quedó dentro del equipo.");
      setPendienteDe("");
    } else {
      // Es nuevo: intentamos mandarle el mail (si está configurado) y
      // le ofrecemos al dueño avisarle por WhatsApp, que nunca falla.
      setPendienteDe(email);
      try {
        const r = await fetch("/api/invitar-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const res = await r.json();
        setAviso(
          res?.enviado
            ? "✓ Invitación creada y mail enviado. Igual podés avisarle por WhatsApp:"
            : "✓ Invitación creada. Todavía no tiene cuenta: avisale vos por WhatsApp 👇"
        );
      } catch {
        setAviso("✓ Invitación creada. Avisale por WhatsApp 👇");
      }
    }
    setEmail("");
    setInvitando(false);
    cargar();
  }

  function avisarPorWhatsApp() {
    const texto =
      `¡Hola! Te sumé al equipo de ${ctx?.concesionario?.nombre || "nuestro concesionario"} ` +
      `en MotoStock, nuestro gestor de stock. Creá tu cuenta acá: ${location.origin}/registro ` +
      `— importante: usá este mail: ${pendienteDe}. Al entrar ya vas a estar adentro.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  async function cambiar(m: Miembro, campos: Partial<Miembro>) {
    await supabase.from("miembros").update(campos).eq("id", m.id);
    cargar();
  }

  function hora(iso: string) {
    return new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const esDueno = ctx?.rol === "dueno";

  return (
    <Shell ctx={ctx} activo="equipo">
      <h1 className="font-titulos font-black text-2xl tracking-tight">Mi equipo</h1>
      <p className="text-sm text-gris mt-1">
        Invitás por mail y decidís qué puede hacer cada uno. Cada cambio queda
        registrado: quién, qué y cuándo.
      </p>

      {cargando ? (
        <p className="text-sm text-gris mt-5">Cargando…</p>
      ) : !esDueno ? (
        <p className="text-sm text-gris mt-5 bg-white border border-linea rounded-xl p-5">
          El equipo lo administra el dueño del concesionario.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2.5">
            {miembros.length === 0 && (
              <p className="text-sm text-gris bg-white border border-linea rounded-xl p-5">
                Todavía no invitaste a nadie. Tu gente carga motos y fotos desde su
                celular — vos mantenés el control de precios y publicaciones.
              </p>
            )}
            {miembros.map((m) => (
              <div key={m.id} className={`bg-white border border-linea rounded-2xl p-4 flex items-center gap-3.5 flex-wrap ${m.activo ? "" : "opacity-55"}`}>
                <div className="w-10 h-10 rounded-full bg-azul text-white flex items-center justify-center font-bold shrink-0">
                  {(m.nombre || m.invitado_email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-titulos font-extrabold text-[14px]">
                    {m.nombre || m.invitado_email}
                    <span className="ml-2 text-[11px] font-bold rounded-full px-2 py-0.5 bg-[#EDF0F4] text-gris align-middle">
                      {m.rol === "encargado" ? "Encargado" : "Vendedor"}
                    </span>
                    {!m.vinculado && (
                      <span className="ml-1.5 text-[11px] font-bold rounded-full px-2 py-0.5 bg-[#FBF1DE] text-ambar align-middle">
                        Invitación pendiente
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-gris truncate">
                    {m.invitado_email}{m.sucursal ? ` · ${m.sucursal}` : " · todas las sucursales"}
                  </p>
                  <div className="flex gap-x-3 gap-y-0.5 flex-wrap text-[12px] font-semibold mt-1">
                    {([
                      ["puede_editar", "Cargar y editar"],
                      ["puede_precios", "Cambiar precios"],
                      ["puede_publicar", "Publicar"],
                      ["ve_costos", "Ver costos"],
                    ] as const).map(([campo, texto]) => (
                      <button key={campo}
                        onClick={() => cambiar(m, { [campo]: !m[campo] } as Partial<Miembro>)}
                        className={m[campo] ? "text-verde-ok" : "text-gris line-through"}>
                        {texto} {m[campo] ? "✓" : "✗"}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => cambiar(m, { activo: !m.activo })}
                  className={`text-[13px] font-bold shrink-0 ${m.activo ? "text-rojo-mc" : "text-verde-ok"}`}>
                  {m.activo ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            ))}
          </div>

          {aviso && (
            <div className="mt-3 bg-[#EAF1FA] border border-[#C9DCF2] rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-azul">{aviso}</p>
              {pendienteDe && (
                <button onClick={avisarPorWhatsApp}
                  className="mt-2 bg-[#17925F] hover:opacity-90 text-white font-titulos font-extrabold rounded-xl px-5 py-2.5 text-sm">
                  📲 Avisarle por WhatsApp a {pendienteDe}
                </button>
              )}
            </div>
          )}

          {invitando ? (
            <form onSubmit={invitar} className="mt-4 bg-white border-2 border-azul rounded-2xl p-5 flex flex-col gap-3.5 max-w-xl">
              <h2 className="font-titulos font-extrabold text-lg">✉️ Invitar a alguien</h2>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <label className="text-sm font-semibold">
                  Mail
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-azul" />
                </label>
                <label className="text-sm font-semibold">
                  Rol
                  <select value={rol} onChange={(e) => setRol(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-azul">
                    <option value="vendedor">Vendedor</option>
                    <option value="encargado">Encargado</option>
                  </select>
                </label>
              </div>
              <label className="text-sm font-semibold">
                Sucursal
                <select value={sucursal} onChange={(e) => setSucursal(e.target.value)}
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-azul">
                  <option value="">Todas</option>
                  {(ctx?.sucursales || []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {([
                  [pEditar, setPEditar, "Cargar y editar motos"],
                  [pPrecios, setPPrecios, "Cambiar precios"],
                  [pPublicar, setPPublicar, "Publicar en Motocambio"],
                  [pCostos, setPCostos, "Ver costos de compra"],
                ] as [boolean, (v: boolean) => void, string][]).map(([v, set, texto]) => (
                  <label key={texto} className="flex items-center gap-2 font-semibold text-tinta2">
                    <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} />
                    {texto}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-5 py-2.5">
                  Invitar
                </button>
                <button type="button" onClick={() => setInvitando(false)}
                  className="border-2 border-linea font-semibold rounded-xl px-4 text-tinta2">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setInvitando(true)}
              className="mt-4 bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-5 py-2.5 text-sm">
              ✉️ Invitar a alguien del equipo
            </button>
          )}

          {/* Historial */}
          {eventos.length > 0 && (
            <div className="mt-6">
              <h2 className="font-titulos font-extrabold text-lg mb-2">📒 Últimos movimientos</h2>
              <div className="bg-white border border-linea rounded-2xl divide-y divide-linea">
                {eventos.map((e, i) => (
                  <p key={i} className="px-4 py-2.5 text-[13px]">
                    <b>{e.nombre}</b> — {e.detalle}
                    <span className="text-gris"> · {hora(e.creado_el)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
