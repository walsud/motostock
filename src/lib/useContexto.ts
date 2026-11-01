"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import type { Contexto } from "@/lib/tipos";

// Carga quién soy, en qué concesionario trabajo y qué puedo hacer.
// Si todavía no hay gestor creado, manda a /crear.
export function useContexto() {
  const supabase = crearClienteNavegador();
  const router = useRouter();
  const ruta = usePathname();
  const [ctx, setCtx] = useState<Contexto | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("mi_contexto");
      if (error) {
        console.error("[MotoStock] Error cargando contexto:", error);
        setCargando(false);
        return;
      }
      const c = data as Contexto | null;
      setCtx(c);
      setCargando(false);
      if (c && !c.concesionario && ruta !== "/crear") router.replace("/crear");
      if (c && c.concesionario && ruta === "/crear") router.replace("/stock");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { supabase, ctx, cargando };
}
