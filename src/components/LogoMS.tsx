// Isotipo de MotoStock: dos ruedas y el chasis, sobre azul.
export function LogoMS({ tamano = 40 }: { tamano?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={tamano} height={tamano} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#1E5AA8" />
      <circle cx="19" cy="42" r="8.5" fill="none" stroke="#fff" strokeWidth="4.5" />
      <circle cx="45" cy="42" r="8.5" fill="none" stroke="#fff" strokeWidth="4.5" />
      <path
        d="M19 42 L28 28 L42 28 L45 42 M28 28 L24 20 L31 20"
        fill="none" stroke="#fff" strokeWidth="4.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function WordmarkMS({ claro = false }: { claro?: boolean }) {
  return (
    <span
      className="font-titulos font-black text-xl tracking-tight"
      style={{ color: claro ? "#fff" : "#17202B", letterSpacing: "-0.02em" }}
    >
      MOTO<span style={{ color: claro ? "#6FA8E8" : "#1E5AA8" }}>STOCK</span>
    </span>
  );
}
