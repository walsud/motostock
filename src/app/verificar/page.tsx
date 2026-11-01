"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogoMS, WordmarkMS } from "@/components/LogoMS";

function Contenido() {
  const params = useSearchParams();
  const email = params.get("email") || "tu casilla";
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-7 text-center">
      <p className="text-4xl mb-3">📬</p>
      <h1 className="font-titulos font-black text-2xl tracking-tight">Revisá tu mail</h1>
      <p className="text-sm text-tinta2 mt-2 leading-relaxed">
        Te mandamos un correo a <b>{email}</b> para confirmar la cuenta.
        Tocá el enlace y después entrá con tu contraseña.
      </p>
      <p className="text-[13px] text-gris mt-3">
        ¿No llegó? Mirá en <b>spam / correo no deseado</b>.
      </p>
      <Link href="/login"
        className="inline-block mt-5 bg-azul hover:bg-azul-oscuro text-white font-titulos font-extrabold rounded-xl px-6 py-3">
        Ir a entrar
      </Link>
    </div>
  );
}

export default function Verificar() {
  return (
    <main className="min-h-screen bg-tinta flex flex-col items-center px-5 py-12">
      <div className="flex items-center gap-3 mb-8">
        <LogoMS tamano={42} />
        <WordmarkMS claro />
      </div>
      <Suspense>
        <Contenido />
      </Suspense>
    </main>
  );
}
