import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    const [
      tiendas,
      envios,
      origenes,
      pagos,
      tiendasinsa,
      agentes,
      estados,
      transiciones,
    ] = await Promise.all([
      prisma.tienda.findMany(),
      prisma.tipo_Envio.findMany(),
      prisma.origenInventario.findMany(),
      prisma.tipoPago.findMany(),
      prisma.tiendasinsa.findMany(),
      prisma.login.findMany({
        where: { rol: "agente" },
        select: {
          id_login: true,
          nombre_vendedor: true,
          correo: true,
        },
      }),
      prisma.estado.findMany(), // estados
      prisma.transicionEstado.findMany(), // transiciones
    ]);

    return NextResponse.json({
      tiendas,
      envios,
      origenes,
      pagos,
      tiendasinsa,
      agentes,
      estados,
      transiciones, // agregamos transiciones
    });
  } catch (error) {
    console.error("Error cargando catálogos:", error);
    return NextResponse.json(
      { error: "Error cargando catálogos" },
      { status: 500 }
    );
  }
}
