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

    // Obtener todas las órdenes
    const ordenes = await prisma.registroBitacora.findMany({
      include: { estado: true },
    });

    const resultado = ordenes.map((orden) => {
      const historial = Array.isArray(orden.historial_estados)
        ? orden.historial_estados
        : [];

      if (historial.length === 0) {
        return {
          num_ticket: orden.num_ticket,
          cliente: orden.nombre_cliente,
          historial_estados: [],
        };
      }

      const tiempos = historial.map((h, index) => {
        const fechaInicio = new Date(h.fecha_cambio);
        let fechaFin;

        // Último estado
        if (index === historial.length - 1) {
          if (h.estado === "Entregada") {
            // Tiempo total desde el primer estado hasta la entrega
            fechaFin = new Date(h.fecha_cambio);
            const fechaInicioTotal = new Date(historial[0].fecha_cambio);
            const diffHorasTotal = (fechaFin - fechaInicioTotal) / (1000 * 60 * 60);
            return {
              estado: h.estado,
              tiempo_horas: parseFloat(diffHorasTotal.toFixed(2)),
              tiempo_minutos: parseFloat((diffHorasTotal * 60).toFixed(1)),
            };
          } else {
            // Tiempo desde que entró en el estado hasta ahora
            fechaFin = new Date();
          }
        } else {
          // Para estados intermedios, tiempo hasta el siguiente cambio
          fechaFin = new Date(historial[index + 1].fecha_cambio);
        }

        const diffHoras = (fechaFin - fechaInicio) / (1000 * 60 * 60);
        return {
          estado: h.estado,
          tiempo_horas: parseFloat(diffHoras.toFixed(2)),
          tiempo_minutos: parseFloat((diffHoras * 60).toFixed(1)),
        };
      });

      return {
        num_ticket: orden.num_ticket,
        cliente: orden.nombre_cliente,
        historial_estados: tiempos,
      };
    });

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error productividad:", error);
    return NextResponse.json({ error: "Error al calcular productividad" }, { status: 500 });
  }
}
