import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inicioParam = searchParams.get("inicio");
    const finParam = searchParams.get("fin");
    let vendedorParam = searchParams.get("vendedor"); // <-- cambiar a let
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

if (vendedorParam) {
  // Convertir a número si id_login es integer en la DB
  vendedorParam = Number(vendedorParam);
  fechaFilter.id_login = vendedorParam;
}
    // 🔹 Consultas agrupadas
    const [
      estadosGroup,
      montosGlobales,
      tipoEnvioGroup,
      tiendaSinsaGroup,
      origenInventarioGroup,
      registrosHistorial,
      vendedoresGroup,
      refacturadasData,
      devolucionesData,
    ] = await Promise.all([
      // Agrupación por estado con sumatoria
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

      // Solo campos necesarios para origenFacturas
      prisma.registroBitacora.findMany({
        select: {
          monto_factura: true,
          historial_estados: true,
        },
        where: fechaFilter,
      }),

      // Órdenes por vendedor
      prisma.registroBitacora.groupBy({
        by: ["id_login"],
        _count: { id_login: true },
        _sum: { monto_factura: true },
        where: fechaFilter,
      }),

      // Órdenes refacturadas
      prisma.registroBitacora.aggregate({
        _sum: { monto_factura: true },
        where: { ...fechaFilter, id_estado: 2 },
      }),

      // Órdenes devueltas
      prisma.registroBitacora.aggregate({
        _sum: { monto_devolucion: true },
        where: fechaFilter,
      }),
    ]);

    // 🔹 Mapa rápido de estados
    const estadoMap = {};
    estadosGroup.forEach((e) => {
      estadoMap[e.id_estado] = {
        count: e._count.id_estado,
        monto: e._sum.monto_factura || 0,
      };
    });

    const total = Object.values(estadoMap).reduce((acc, e) => acc + e.count, 0);
    const entregadas = estadoMap[7]?.count || 0;
    const nuevas = estadoMap[1]?.count || 0;
    const refacturadas = estadoMap[2]?.count || 0;
    const enviadasACedis = estadoMap[3]?.count || 0;
    const preparacion = estadoMap[4]?.count || 0;
    const enviadoACliente = estadoMap[5]?.count || 0;
    const esperaCaliente = estadoMap[6]?.count || 0;
    const Anuladas = estadoMap[8]?.count || 0;
    const pendientes = total - (entregadas + Anuladas);

    const montoDevolucion = Number(devolucionesData._sum.monto_devolucion || 0);
    const montoRefacturadas = Number(refacturadasData._sum.monto_factura || 0);
    const montoTotal = Number(montosGlobales._sum.monto_factura || 0);
    const montoFlete = Number(montosGlobales._sum.flete || 0);
    const montoTotalAnuladas = estadoMap[8]?.monto || 0;
    const montoTotalTotal =
      montoTotal - montoDevolucion - montoRefacturadas - montoTotalAnuladas;
    const montoFacturado = montoTotalTotal + montoRefacturadas;

    // 🔹 Optimizar tipo de envío
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

    // 🔹 Optimizar tienda Sinsa
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

    // 🔹 Optimizar origen inventario
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

    // 🔹 Optimizar origenFacturas
    const origenFacturas = {
      nueva: { cantidad: 0, monto: 0 },
      refacturada: { cantidad: 0, monto: 0 },
      totalMonto: 0,
    };
    registrosHistorial.forEach((reg) => {
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

// Vendedores desde los registros
const vendedorIds = vendedoresGroup.map((v) => v.id_login || 0);
const vendedoresInfo = await prisma.login.findMany({
  where: { id_login: { in: vendedorIds.length ? vendedorIds : [0] } },
  select: { id_login: true, nombre_vendedor: true },
});

// Mapear usando siempre id_login
const vendedoresFinal = vendedoresGroup.map((v) => {
  const vendedor = vendedoresInfo.find(x => x.id_login === v.id_login);
  return {
    id_login: v.id_login,              // <-- mantener id_login original
    nombre: vendedor?.nombre_vendedor || "Desconocido",
    cantidad: v._count.id_login,
    monto: v._sum.monto_factura || 0,
  };
});

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
      montoTotalTotal,
      montoTotalAnuladas,
      montoFacturado,
      montoFlete,
      tipoEnvio: tipoEnvioFinal,
      tiendaSinsa: tiendaSinsaFinal,
      origenInventario: origenFinal,
      origenFacturas,
      vendedores: vendedoresFinal,
      montoRefacturadas,
      montoDevolucion,
    });
  } catch (error) {
    console.error("Error en estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
