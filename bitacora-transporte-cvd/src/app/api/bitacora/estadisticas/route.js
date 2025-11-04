import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inicioParam = searchParams.get("inicio");
    const finParam = searchParams.get("fin");

    // 🔹 Filtro por fecha
    const fechaFilter = {};
    if (inicioParam || finParam) {
      fechaFilter.fecha_creacion = {};
      if (inicioParam) fechaFilter.fecha_creacion.gte = new Date(inicioParam);
      if (finParam) {
        const finDate = new Date(finParam);
        finDate.setHours(23, 59, 59, 999);
        fechaFilter.fecha_creacion.lte = finDate;
      }
    }

    // 🔹 Ejecutar consultas en paralelo
    const [
      estadosGroup,
      montos,
      tipoEnvioGroup,
      tiendaSinsaGroup,
      origenInventarioGroup,
      registros
    ] = await Promise.all([
      // Agrupación por estado (una sola query para todos los count)
      prisma.registroBitacora.groupBy({
        by: ["id_estado"],
        _count: { id_estado: true },
        _sum: { monto_factura: true, flete: true },
        where: fechaFilter,
      }),

      // Totales globales
      prisma.registroBitacora.aggregate({
        _sum: { monto_factura: true, flete: true },
        where: fechaFilter,
      }),

      // Agrupación por tipo de envío
      prisma.registroBitacora.groupBy({
        by: ["id_tipenvio"],
        _count: { id_tipenvio: true },
        _sum: { monto_factura: true, flete: true },
        where: fechaFilter,
      }),

      // Agrupación por tienda SINSA
      prisma.registroBitacora.groupBy({
        by: ["id_tiendasinsa"],
        _count: { id_tiendasinsa: true },
        _sum: { monto_factura: true },
        where: { ...fechaFilter, id_tiendasinsa: { not: null } },
      }),

      // Agrupación por origen inventario
      prisma.registroBitacora.groupBy({
        by: ["id_originventario"],
        _count: { id_originventario: true },
        _sum: { monto_factura: true },
        where: fechaFilter,
      }),

      // Solo una lectura para origenFacturas
      prisma.registroBitacora.findMany({
        select: { monto_factura: true, historial_estados: true },
        where: fechaFilter,
      }),
    ]);

    // 🔹 Mapear resultados por estado
    const estadoMap = Object.fromEntries(
      estadosGroup.map((e) => [e.id_estado, e._count.id_estado])
    );

    const total = estadosGroup.reduce((acc, e) => acc + e._count.id_estado, 0);
    const entregadas = estadoMap[7] || 0;
    const nuevas = estadoMap[1] || 0;
    const refacturadas = estadoMap[2] || 0;
    const enviadasACedis = estadoMap[3] || 0;
    const preparacion = estadoMap[4] || 0;
    const enviadoACliente = estadoMap[5] || 0;
    const esperaCaliente = estadoMap[6] || 0;
    const Anuladas = estadoMap[8] || 0;
    const pendientes = total - (entregadas + Anuladas);

    // 🔹 Totales de montos
    const montoTotal = montos._sum.monto_factura || 0;
    const montoFlete = montos._sum.flete || 0;
    const montoTotalAnuladas =
      estadosGroup.find((e) => e.id_estado === 8)?._sum.monto_factura || 0;
    const montoFacturado = montoTotal - montoTotalAnuladas;

    // 🔹 Tipo de envío
    const tiposEnvioIds = tipoEnvioGroup.map((t) => t.id_tipenvio);
    const tiposEnvio = await prisma.tipo_Envio.findMany({
      where: { id_tipenvio: { in: tiposEnvioIds } },
    });
    const tipoEnvioFinal = tipoEnvioGroup.map((t) => ({
      id_tipenvio: t.id_tipenvio,
      nombre:
        tiposEnvio.find((x) => x.id_tipenvio === t.id_tipenvio)?.nombre_Tipo ||
        "Desconocido",
      cantidad: t._count.id_tipenvio,
      monto: t._sum.monto_factura || 0,
      totalFlete: t._sum.flete || 0,
    }));

    // 🔹 Tienda Sinsa
    const tiendaIds = tiendaSinsaGroup.map((t) => t.id_tiendasinsa);
    const tiendasSinsa = await prisma.tiendasinsa.findMany({
      where: { id_tiendasinsa: { in: tiendaIds } },
    });
    const tiendaSinsaFinal = tiendaSinsaGroup.map((t) => ({
      id_tiendasinsa: t.id_tiendasinsa,
      nombre:
        tiendasSinsa.find((x) => x.id_tiendasinsa === t.id_tiendasinsa)
          ?.nombre_tiendasinsa || "Desconocida",
      cantidad: t._count.id_tiendasinsa,
      monto: t._sum.monto_factura || 0,
    }));

    // 🔹 Origen Inventario
    const origenIds = origenInventarioGroup.map((o) => o.id_originventario);
    const origenes = await prisma.origenInventario.findMany({
      where: { id_originventario: { in: origenIds } },
    });
    const origenFinal = origenInventarioGroup.map((o) => ({
      id_originventario: o.id_originventario,
      nombre:
        origenes.find((x) => x.id_originventario === o.id_originventario)
          ?.nombre_origen || "Desconocido",
      cantidad: o._count.id_originventario,
      monto: o._sum.monto_factura || 0,
    }));

    // 🔹 Origen de facturas
    const origenFacturas = {
      nueva: { cantidad: 0, monto: 0 },
      refacturada: { cantidad: 0, monto: 0 },
      totalMonto: 0,
    };

    registros.forEach((reg) => {
      const primerEstado = reg.historial_estados?.[0]?.estado?.toLowerCase();
      if (primerEstado === "nueva") {
        origenFacturas.nueva.cantidad++;
        origenFacturas.nueva.monto += reg.monto_factura || 0;
      } else if (primerEstado === "refacturada") {
        origenFacturas.refacturada.cantidad++;
        origenFacturas.refacturada.monto += reg.monto_factura || 0;
      }
    });
    origenFacturas.totalMonto =
      origenFacturas.nueva.monto + origenFacturas.refacturada.monto;

    // ✅ Respuesta final
    return NextResponse.json({
      total,
      nuevas,
      refacturadas,
      enviadasACedis,
      preparacion,
      enviadoACliente,
      esperaCaliente,
      entregadas,
      pendientes,
      Anuladas,
      montoTotal,
      montoTotalAnuladas,
      montoFacturado,
      montoFlete,
      tipoEnvio: tipoEnvioFinal,
      tiendaSinsa: tiendaSinsaFinal,
      origenInventario: origenFinal,
      origenFacturas,
    });
  } catch (error) {
    console.error("Error en estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
