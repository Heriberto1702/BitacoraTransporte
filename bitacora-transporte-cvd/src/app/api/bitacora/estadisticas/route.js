import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

const cache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

// 🔹 Convierte "YYYY-MM-DD" a fecha local exacta
function convertirFechaLocal(fechaISO, isEnd = false) {
  const [year, month, day] = fechaISO.split("-").map(Number);
  if (!year || !month || !day) return null;
  const offsetHours = 6;
  const date = new Date(
    year,
    month - 1,
    day,
    isEnd ? 23 + offsetHours : offsetHours,
    isEnd ? 59 : 0,
    isEnd ? 59 : 0,
    999
  );
  return date;
}

// 🔹 Normalizar ventas y rellenar días faltantes
function normalizarVentas(ventasRaw, inicio, fin) {
  const ventasMap = {};

  ventasRaw.forEach(v => {
    // 🔹 Ajustar a hora local restando 6 horas
    const fechaUTC = v.fecha_creacion;
    const fechaLocal = new Date(fechaUTC);
    fechaLocal.setHours(fechaLocal.getHours() - 6);

    const fechaStr = fechaLocal.toISOString().split("T")[0];

    const monto =
      Number(v._sum.monto_factura || 0) - Number(v._sum.monto_devolucion || 0);

    ventasMap[fechaStr] = (ventasMap[fechaStr] || 0) + monto;
  });

  // 🔹 Rellenar todos los días del rango con total 0 si no hay ventas
  const ventasDiarias = [];
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);

  for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
    const fechaStr = d.toISOString().split("T")[0];
    ventasDiarias.push({
      fecha: fechaStr,
      total: ventasMap[fechaStr] || 0,
    });
  }

  return ventasDiarias;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inicioParam = searchParams.get("inicio");
    const finParam = searchParams.get("fin");
    let vendedorParam = searchParams.get("vendedor");
    const forceRefresh = searchParams.get("refresh") === "true";

    const cacheKey = `${inicioParam || "null"}-${finParam || "null"}-${vendedorParam || "null"}`;
    const now = Date.now();

    if (!forceRefresh && cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (now - timestamp < CACHE_DURATION) {
        return NextResponse.json({ ...data, cached: true });
      }
    }

    // 🔹 Filtro por fecha con zona horaria local
    const fechaFilter = {};
    if (inicioParam || finParam) {
      fechaFilter.fecha_creacion = {};
      if (inicioParam) fechaFilter.fecha_creacion.gte = convertirFechaLocal(inicioParam);
      if (finParam) fechaFilter.fecha_creacion.lte = convertirFechaLocal(finParam, true);
    }
    if (vendedorParam) {
      vendedorParam = Number(vendedorParam);
      fechaFilter.id_login = vendedorParam;
    }

    // 🔹 Consultas
    const estadosGroup = await prisma.registroBitacora.groupBy({
      by: ["id_estado"],
      _count: { id_estado: true },
      where: fechaFilter,
    });

    const montosGlobales = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true, flete: true, flete_web: true },
      where: { ...fechaFilter, tipo_orden: "Normal" },
    });

    const tipoEnvioGroup = await prisma.registroBitacora.groupBy({
      by: ["id_tipenvio"],
      _count: { id_tipenvio: true },
      _sum: { monto_factura: true, flete: true },
      where: fechaFilter,
    });

    const tiendaSinsaGroup = await prisma.registroBitacora.groupBy({
      by: ["id_tiendasinsa"],
      _count: { id_tiendasinsa: true },
      _sum: { monto_factura: true },
      where: { ...fechaFilter, id_tiendasinsa: { not: null } },
    });

    const origenInventarioGroup = await prisma.registroBitacora.groupBy({
      by: ["id_originventario"],
      _count: { id_originventario: true },
      _sum: { monto_factura: true },
      where: fechaFilter,
    });

    const vendedoresGroup = await prisma.registroBitacora.groupBy({
      by: ["id_login"],
      _count: { id_login: true },
      _sum: { monto_factura: true, flete: true, flete_web: true, monto_devolucion: true },
      where: { ...fechaFilter, id_estado: { not: 8 } }, // excluir anuladas
    });

    // 🔹 Ventas por fecha
    const ventasFechaRaw = await prisma.registroBitacora.groupBy({
      by: ["fecha_creacion"],
      _sum: { monto_factura: true, monto_devolucion: true },
      where: { ...fechaFilter, id_estado: { not: 8 } },
    });

    // 🔹 Normalizar ventas y rellenar días faltantes
    const ventasDiarias =
      inicioParam && finParam
        ? normalizarVentas(ventasFechaRaw, inicioParam, finParam)
        : []; // Si no hay rango, retorna arreglo vacío

    // 🔹 Resto de procesamiento
    const montoAnuladas = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true, flete: true, flete_web: true },
      where: { ...fechaFilter, id_estado: 8 },
    });
    const refacturadasData = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true, flete: true, flete_web: true },
      where: { ...fechaFilter, tipo_orden: "Refacturada" },
    });
    const devolucionesData = await prisma.registroBitacora.aggregate({
      _sum: { monto_devolucion: true, flete: true, flete_web: true },
      where: fechaFilter,
    });

    const estadoMap = {};
    estadosGroup.forEach(e => {
      estadoMap[e.id_estado] = { count: e._count.id_estado };
    });

    const total = Object.values(estadoMap).reduce((acc, e) => acc + e.count, 0);
    const entregadas = estadoMap[7]?.count || 0;
    const nuevas = estadoMap[1]?.count || 0;
    const refacturadas = estadoMap[2]?.count || 0;
    const enviadasACedis = estadoMap[3]?.count || 0;
    const preparacion = estadoMap[4]?.count || 0;
    const enviadoACliente = estadoMap[5]?.count || 0;
    const esperaCaliente = estadoMap[6]?.count || 0;
    const anuladas = estadoMap[8]?.count || 0;
    const pendientes = total - (entregadas + anuladas);

    const montoDevolucion = Number(devolucionesData._sum.monto_devolucion || 0);
    const montoRefacturadas = Number(refacturadasData._sum.monto_factura || 0);
    const montoTotal = Number(montosGlobales._sum.monto_factura || 0);
    const montoFleteWeb = Number(montosGlobales._sum.flete_web || 0);
    const montoFlete =
      Number(montosGlobales._sum.flete || 0) + Number(refacturadasData._sum.flete || 0);
    const montoFleteRefacturadas = Number(refacturadasData._sum.flete || 0);
    const montoFleteWebRefacturadas = Number(refacturadasData._sum.flete_web || 0);
    const montoFleteRefacturadasTotal =
      montoFleteRefacturadas + montoFleteWebRefacturadas;
    const montoTotalAnuladas = Number(montoAnuladas._sum.monto_factura || 0);
    const montototalanulaciones = montoRefacturadas - montoTotalAnuladas - montoDevolucion;
    const fleteAnuladas = Number(montoAnuladas._sum.flete || 0);
    const fleteWebAnuladas = Number(montoAnuladas._sum.flete_web || 0);
    const fletetotal = montoFlete - fleteAnuladas;
    const fletetotalweb = montoFleteWeb - fleteWebAnuladas;
    const montoFacturado =
      montoTotal + montoRefacturadas - montoTotalAnuladas - montoDevolucion;

    const tipoEnvioIds = tipoEnvioGroup.map(t => t.id_tipenvio);
    const tiposEnvio = await prisma.tipo_Envio.findMany({
      where: { id_tipenvio: { in: tipoEnvioIds } },
    });
    const tipoEnvioFinal = tipoEnvioGroup.map(t => ({
      id_tipenvio: t.id_tipenvio,
      nombre:
        tiposEnvio.find(x => x.id_tipenvio === t.id_tipenvio)?.nombre_Tipo ||
        "Desconocido",
      cantidad: t._count.id_tipenvio,
      monto: t._sum.monto_factura || 0,
      totalFlete: t._sum.flete || 0,
    }));

    const tiendaIds = tiendaSinsaGroup.map(t => t.id_tiendasinsa);
    const tiendasSinsa = await prisma.tiendasinsa.findMany({
      where: { id_tiendasinsa: { in: tiendaIds } },
    });
    const tiendaSinsaFinal = tiendaSinsaGroup.map(t => ({
      id_tiendasinsa: t.id_tiendasinsa,
      nombre:
        tiendasSinsa.find(x => x.id_tiendasinsa === t.id_tiendasinsa)
          ?.nombre_tiendasinsa || "Desconocida",
      cantidad: t._count.id_tiendasinsa,
      monto: t._sum.monto_factura || 0,
    }));

    const origenIds = origenInventarioGroup.map(o => o.id_originventario);
    const origenes = await prisma.origenInventario.findMany({
      where: { id_originventario: { in: origenIds } },
    });
    const origenFinal = origenInventarioGroup.map(o => ({
      id_originventario: o.id_originventario,
      nombre:
        origenes.find(x => x.id_originventario === o.id_originventario)
          ?.nombre_origen || "Desconocido",
      cantidad: o._count.id_originventario,
      monto: o._sum.monto_factura || 0,
    }));

    const vendedorIds = vendedoresGroup.map(v => v.id_login || 0);
    const vendedoresInfo = await prisma.login.findMany({
      where: { id_login: { in: vendedorIds.length ? vendedorIds : [0] } },
      select: { id_login: true, nombre_vendedor: true },
    });
    const vendedoresFinal = vendedoresGroup.map(v => {
      const vendedor = vendedoresInfo.find(x => x.id_login === v.id_login);
      const flete = v._sum.flete ?? 0;
      const fleteWeb = v._sum.flete_web ?? 0;
      const devolucion = v._sum.monto_devolucion ?? 0;
      const montoFactura =
        v._sum.monto_factura - (v._sum.monto_devolucion || 0) || 0;
      return {
        id_login: v.id_login,
        nombre: vendedor?.nombre_vendedor || "Desconocido",
        cantidad: v._count.id_login,
        monto: montoFactura,
        flete,
        fleteWeb,
        devolucion,
      };
    });

    const data = {
      total,
      ventasDiarias,
      nuevas,
      refacturadas,
      enviadasACedis,
      preparacion,
      fleteAnuladas,
      fleteWebAnuladas,
      enviadoACliente,
      esperaCaliente,
      entregadas,
      pendientes,
      anuladas,
      montoTotal,
      montoFleteRefacturadasTotal,
      montoTotalAnuladas,
      montototalanulaciones,
      montoFacturado,
      fletetotal,
      fletetotalweb,
      montoFlete,
      montoFleteWeb,
      tipoEnvio: tipoEnvioFinal,
      tiendaSinsa: tiendaSinsaFinal,
      origenInventario: origenFinal,
      vendedores: vendedoresFinal,
      montoRefacturadas,
      montoDevolucion,
    };

    cache.set(cacheKey, { data, timestamp: now });
    return NextResponse.json({ ...data, cached: false });
  } catch (error) {
    console.error("❌ Error en estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
