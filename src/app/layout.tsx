import type { Metadata } from "next";
import "@fontsource/archivo/800.css";
import "@fontsource/archivo/900.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MotoStock — tu stock, al día y en todas partes",
    template: "%s · MotoStock",
  },
  description:
    "El gestor de stock para concesionarios de motos, conectado a Motocambio: precios de contado y permuta, sucursales, consignaciones, señas y equipo con permisos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className="antialiased">
        <div className="recorte-horizontal">{children}</div>
      </body>
    </html>
  );
}
