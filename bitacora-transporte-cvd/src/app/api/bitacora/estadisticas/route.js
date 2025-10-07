import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inicioParam = searchParams.get("inicio");
    const finParam = searchParams.get("fin");

    // 🔹 Construir filtro por fecha si existen parámetros
    let fechaFilter = {};
    if (inicioParam || finParam) {
      fechaFilter.fecha_creacion = {};
      if (inicioParam) fechaFilter.fecha_creacion.gte = new Date(inicioParam);
      if (finParam) {
        // Para incluir todo el día final, ponemos 23:59:59
        const finDate = new Date(finParam);
        finDate.setHours(23, 59, 59, 999);
        fechaFilter.fecha_creacion.lte = finDate;
      }
    }

    // 🔹 Totales
    const total = await prisma.registroBitacora.count({ where: fechaFilter });
    const entregadas = await prisma.registroBitacora.count({
      where: { ...fechaFilter, id_estado: 6 },
    });
    const pendientes = await prisma.registroBitacora.count({
      where: { ...fechaFilter, id_estado: { notIn: [6, 7] } },
    });
    const Anuladas = await prisma.registroBitacora.count({
      where: { ...fechaFilter, id_estado: 7 },
    });

    const montoTotal = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true },
      where: fechaFilter,
    });

    const montoTotalAnuladas = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true },
      where: { ...fechaFilter, id_estado: 7 },
    });

    const montoFlete = await prisma.registroBitacora.aggregate({
      _sum: { flete: true },
      where: fechaFilter,
    });

    const montoFacturado =
      (montoTotal._sum.monto_factura || 0) -
      (montoTotalAnuladas._sum.monto_factura || 0);

    // 🔹 Tipo de envío
    const tipoEnvioConNombre = await prisma.registroBitacora.groupBy({
      by: ["id_tipenvio"],
      _count: { id_tipenvio: true },
      _sum: { monto_factura: true, flete: true },
      orderBy: { _count: { id_tipenvio: "desc" } },
      where: fechaFilter,
    });

    const tiposEnvioIds = tipoEnvioConNombre.map((t) => t.id_tipenvio);
    const tiposEnvio = await prisma.tipo_Envio.findMany({
      where: { id_tipenvio: { in: tiposEnvioIds } },
    });

    const tipoEnvioFinal = tipoEnvioConNombre.map((t) => {
      const tipo = tiposEnvio.find((x) => x.id_tipenvio === t.id_tipenvio);
      return {
        id_tipenvio: t.id_tipenvio,
        nombre: tipo?.nombre_Tipo || "Desconocido",
        cantidad: t._count.id_tipenvio,
        monto: t._sum.monto_factura || 0,
        totalFlete: t._sum.flete || 0,
      };
    });

    // 🔹 Tiendas Sinsa
    const tiendaSinsaStats = await prisma.registroBitacora.groupBy({
      by: ["id_tiendasinsa"],
      _count: { id_tiendasinsa: true },
      _sum: { monto_factura: true },
      orderBy: { _count: { id_tiendasinsa: "desc" } },
      where: { ...fechaFilter, id_tiendasinsa: { not: null } },
    });

    const tiendaIds = tiendaSinsaStats.map((t) => t.id_tiendasinsa);
    const tiendasSinsa = await prisma.tiendasinsa.findMany({
      where: { id_tiendasinsa: { in: tiendaIds } },
    });

    const tiendaSinsaFinal = tiendaSinsaStats.map((t) => {
      const tienda = tiendasSinsa.find(
        (x) => x.id_tiendasinsa === t.id_tiendasinsa
      );
      return {
        id_tiendasinsa: t.id_tiendasinsa,
        nombre: tienda?.nombre_tiendasinsa || "Desconocida",
        cantidad: t._count.id_tiendasinsa,
        monto: t._sum.monto_factura || 0,
      };
    });

    // 🔹 Origen Inventario
    const origenStats = await prisma.registroBitacora.groupBy({
      by: ["id_originventario"],
      _count: { id_originventario: true },
      _sum: { monto_factura: true },
      orderBy: { _count: { id_originventario: "desc" } },
      where: fechaFilter,
    });

    const origenIds = origenStats.map((o) => o.id_originventario);
    const origenes = await prisma.origenInventario.findMany({
      where: { id_originventario: { in: origenIds } },
    });

    const origenFinal = origenStats.map((o) => {
      const origen = origenes.find(
        (x) => x.id_originventario === o.id_originventario
      );
      return {
        id_originventario: o.id_originventario,
        nombre: origen?.nombre_origen || "Desconocido",
        cantidad: o._count.id_originventario,
        monto: o._sum.monto_factura || 0,
      };
    });

    return NextResponse.json({
      total,
      entregadas,
      pendientes,
      Anuladas,
      montoTotal: montoTotal._sum.monto_factura || 0,
      montoTotalAnuladas: montoTotalAnuladas._sum.monto_factura || 0,
      montoFacturado,
      montoFlete: montoFlete._sum.flete || 0,
      tipoEnvio: tipoEnvioFinal,
      tiendaSinsa: tiendaSinsaFinal,
      origenInventario: origenFinal,
    });
  } catch (error) {
    console.error("Error en estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
