"use client";
import { useParams } from "next/navigation";
import { FormularioMoto } from "@/components/FormularioMoto";

export default function Editar() {
  const { id } = useParams<{ id: string }>();
  return <FormularioMoto itemId={id} />;
}
