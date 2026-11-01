import { NextResponse } from "next/server";
import { Resend } from "resend";
import { crearClienteServidor } from "@/lib/supabase/server";

// Manda el mail de invitación a un miembro nuevo del equipo.
// Solo funciona si el dueño que invita tiene sesión iniciada, y solo
// si RESEND_API_KEY está configurada en Vercel (si no, devuelve
// enviado:false y la app ofrece avisar por WhatsApp — nada se rompe).

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const claveResend = process.env.RESEND_API_KEY;

  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ enviado: false, motivo: "sin sesión" }, { status: 401 });

  // Verifica que quien llama sea el dueño de un gestor, y toma el nombre
  const { data: ctx } = await supabase.rpc("mi_contexto");
  const contexto = ctx as { rol?: string; concesionario?: { nombre: string } } | null;
  if (!contexto || contexto.rol !== "dueno" || !contexto.concesionario) {
    return NextResponse.json({ enviado: false, motivo: "solo el dueño invita" }, { status: 403 });
  }

  const { email } = (await req.json()) as { email?: string };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ enviado: false, motivo: "mail inválido" }, { status: 400 });
  }

  if (!claveResend) return NextResponse.json({ enviado: false, motivo: "sin RESEND_API_KEY" });

  const conc = contexto.concesionario.nombre;
  const origen = new URL(req.url).origin;

  try {
    const resend = new Resend(claveResend);
    const { error } = await resend.emails.send({
      from: "MotoStock <contacto@motocambio.com.ar>",
      to: email,
      subject: `Te invitaron al equipo de ${conc} en MotoStock`,
      html: `<!doctype html>
<html lang="es"><body style="margin:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#17202b">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e6ec">
      <div style="background:#17202B;padding:18px 24px">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">MOTO<span style="color:#6FA8E8">STOCK</span></span>
      </div>
      <div style="padding:28px 24px">
        <h1 style="margin:0 0 6px;font-size:24px">Te sumaron a un equipo 🏍️</h1>
        <p style="margin:0 0 16px;color:#44505e;font-size:15px;line-height:1.55">
          <b>${conc}</b> te invitó a su gestor de stock en MotoStock.
        </p>
        <p style="margin:0 0 22px;color:#44505e;font-size:15px;line-height:1.55">
          Creá tu cuenta con <b>este mismo mail</b> (${email}) y al entrar ya vas a
          estar dentro del equipo, con los permisos que te asignaron.
        </p>
        <a href="${origen}/registro"
           style="display:inline-block;background:#1E5AA8;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:12px">
          Crear mi cuenta →
        </a>
        <p style="margin:26px 0 0;color:#64707e;font-size:12px;line-height:1.5">
          ¿Ya tenés cuenta en Motocambio con este mail? Entonces entrá directo en ${origen}/login con esa misma cuenta.
        </p>
      </div>
    </div>
    <p style="text-align:center;color:#64707e;font-size:11px;margin:14px 0 0">
      MotoStock es el gestor de stock de Motocambio. Recibís este mail porque ${conc} te invitó a su equipo.
    </p>
  </div>
</body></html>`,
    });
    if (error) {
      console.error("[MotoStock] Resend:", error);
      return NextResponse.json({ enviado: false, motivo: "error del correo" });
    }
    return NextResponse.json({ enviado: true });
  } catch (e) {
    console.error("[MotoStock] Error mandando invitación:", e);
    return NextResponse.json({ enviado: false, motivo: "error del correo" });
  }
}
