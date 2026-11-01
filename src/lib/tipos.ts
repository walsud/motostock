// Tipos compartidos de MotoStock

export interface Sucursal {
  id: number;
  nombre: string;
  provincia: string | null;
}

export interface Contexto {
  concesionario: {
    id: string;
    nombre: string;
    logo_url: string | null;
    cotizacion_usd: number;
  } | null;
  puede_crear?: boolean;
  rol?: string;
  nombre?: string;
  permisos?: {
    editar: boolean;
    precios: boolean;
    publicar: boolean;
    costos: boolean;
    equipo: boolean;
  };
  sucursales?: Sucursal[];
  mi_sucursal?: number | null;
}

export interface ItemStock {
  id: string;
  modelo_id: number;
  marca: string;
  modelo: string;
  categoria: string | null;
  cilindrada: number;
  anio: number;
  km: number;
  moneda: "USD" | "ARS";
  precio_contado: number | null;
  precio_permuta: number | null;
  costo_compra: number | null;
  origen: "propia" | "consignada";
  consignatario_nombre: string | null;
  consignatario_telefono: string | null;
  estado: "disponible" | "senada" | "vendida";
  senada_el: string | null;
  vendida_el: string | null;
  venta_canal: string | null;
  venta_precio: number | null;
  venta_moneda: string | null;
  dominio: string | null;
  descripcion: string | null;
  fotos: string[];
  moto_id: string | null;
  publicada: boolean;
  sucursal_id: number | null;
  sucursal: string | null;
  actualizado_el: string;
  actualizado_por_nombre: string | null;
  creado_el: string;
}

// "USD 7.300" / "$ 9.450.000"
export function precio(valor: number | null | undefined, moneda: string | null | undefined) {
  if (valor == null) return "—";
  const n = Number(valor).toLocaleString("es-AR", { maximumFractionDigits: 0 });
  return moneda === "ARS" ? `$ ${n}` : `USD ${n}`;
}

export function fechaCorta(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export const PROVINCIAS = [
  "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
  "Entre Ríos", "Salta", "Neuquén", "Río Negro", "Corrientes", "Misiones",
  "Chaco", "San Juan", "San Luis", "Jujuy", "La Pampa", "Otra",
];
