// /src/app/api/productividad/route.js
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Calcular primer y último día del mes actual
    const now = new Date();
    const primerDia = new Date(now.getFullYear(), now.getMonth(), 1);
    const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener órdenes solo del mes actual
    const ordenes = await prisma.registroBitacora.findMany({
      where: {
        fecha_creacion: {
          gte: primerDia,
          lte: ultimoDia,
        },
      },
      include: {
        estado: true,
        agente: {
          select: {
            nombre_agente: true,
          },
        },
      },
    });

    const resultado = ordenes.map((orden) => {
      const historial = Array.isArray(orden.historial_estados)
        ? orden.historial_estados
        : [];

const tiempos = historial.map((h, index) => {
  const fechaInicio = new Date(h.fecha_cambio);
  let fechaFin;

  if (index === historial.length - 1 && h.estado === "Entregada") {
    // Tiempo total desde la creación de la orden hasta que se entregó
    const fechaInicioTotal = new Date(historial[0].fecha_cambio);
    fechaFin = new Date(h.fecha_cambio);
    const diffHorasTotal = (fechaFin - fechaInicioTotal) / (1000 * 60 * 60);
    return {
      estado: h.estado,
      tiempo_horas: parseFloat(diffHorasTotal.toFixed(2)),
      tiempo_minutos: parseFloat((diffHorasTotal * 60).toFixed(1)),
    };
  }

  // Para todos los demás casos: tiempo hasta el siguiente cambio o ahora
  if (index < historial.length - 1) {
    fechaFin = new Date(historial[index + 1].fecha_cambio);
  } else {
    fechaFin = new Date();
  }

  const diffHoras = (fechaFin - fechaInicio) / (1000 * 60 * 60);
  return {
    estado: h.estado,
    tiempo_horas: parseFloat(diffHoras.toFixed(2)),
    tiempo_minutos: parseFloat((diffHoras * 60).toFixed(1)),
  };
});

      return {
        id_registro: orden.id_registro,
        num_ticket: orden.num_ticket,
        cliente: orden.nombre_cliente,
        id_agente: orden.id_agente,
        nombre_agente: orden.agente?.nombre_agente ?? "Sin agente",
        historial_estados: tiempos,
      };
    });

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error productividad:", error);
    return NextResponse.json(
      { error: "Error al calcular productividad" },
      { status: 500 }
    );
  }
}
