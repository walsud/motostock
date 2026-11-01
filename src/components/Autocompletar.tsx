"use client";
import { useMemo, useState } from "react";

// El catálogo oficial de Motocambio: los modelos nunca se escriben libres,
// así el matching no falla jamás.
export interface ModeloCatalogo {
  id: number;
  marca: string;
  modelo: string;
  categoria: string | null;
  cilindrada: number;
}

export function Autocompletar({
  catalogo,
  onElegir,
  placeholder,
}: {
  catalogo: ModeloCatalogo[];
  onElegir: (m: ModeloCatalogo) => void;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);

  const opciones = useMemo(() => {
    const q = texto.trim().toLowerCase().replace(/\s+/g, " ");
    if (!q) return catalogo.slice(0, 8);
    return catalogo
      .filter((m) =>
        `${m.marca} ${m.modelo}`.toLowerCase().replace(/\s+/g, " ").includes(q)
      )
      .slice(0, 8);
  }, [catalogo, texto]);

  return (
    <div className="relative">
      <input
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder={placeholder || "Buscá marca y modelo…"}
        className="w-full border-2 border-linea rounded-xl px-3.5 py-2.5 outline-none focus:border-azul bg-white"
      />
      {abierto && opciones.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-white border border-linea rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {opciones.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onElegir(m);
                  setTexto("");
                  setAbierto(false);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-fondo text-sm"
              >
                <b>
                  {m.marca} {m.modelo}
                </b>{" "}
                <span className="text-gris">
                  · {m.cilindrada} cc{m.categoria ? ` · ${m.categoria}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
