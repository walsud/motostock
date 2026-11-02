/* eslint-disable @next/next/no-img-element */
// Isotipo de MotoStock: el casco con las barras de stock (logo oficial).
export function LogoMS({ tamano = 40 }: { tamano?: number }) {
  return (
    <img
      src="/icono.png"
      alt=""
      width={tamano}
      height={tamano}
      style={{ borderRadius: tamano * 0.23 }}
    />
  );
}

export function WordmarkMS({ claro = false }: { claro?: boolean }) {
  return (
    <span
      className="font-titulos font-black text-xl tracking-tight"
      style={{ color: claro ? "#fff" : "#17202B", letterSpacing: "-0.02em" }}
    >
      MOTO<span style={{ color: claro ? "#7FB5EC" : "#1E5AA8" }}>STOCK</span>
    </span>
  );
}
