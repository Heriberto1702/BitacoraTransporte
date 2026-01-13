import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// 🕒 Cachear respuesta por 24 horas (86400 segundos)
export const revalidate =60;

export async function GET() {
  try {
    // Ejecutamos todas las consultas en paralelo (eficiente)
    const [
      tiendas,
      envios,
      origenes,
      pagos,
      tiendasinsa,
      agente,
      estados,
      transiciones,
    ] = await Promise.all([
      prisma.tienda.findMany(),
      prisma.tipo_Envio.findMany(),
      prisma.origenInventario.findMany(),
      prisma.tipoPago.findMany(),
      prisma.tiendasinsa.findMany(),
      prisma.agente.findMany(),
      prisma.estado.findMany(),
      prisma.transicionEstado.findMany(),
    ]);

    // Devolvemos el JSON consolidado
    return NextResponse.json({
      tiendas,
      envios,
      origenes,
      pagos,
      tiendasinsa,
      agente,
      estados,
      transiciones,
    });
  } catch (error) {
    console.error("❌ Error cargando catálogos:", error);
    return NextResponse.json(
      { error: "Error cargando catálogos" },
      { status: 500 }
    );
  }
}
