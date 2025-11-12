import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

const cache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

// 🔹 Convierte "YYYY-MM-DD" a fecha local exacta
function convertirFechaLocal(fechaISO, isEnd = false) {
  const [year, month, day] = fechaISO.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, 999);
  return date;
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
        console.log("🟢 Sirviendo datos desde caché");
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
      _sum: { monto_factura: true, flete: true },
      where: fechaFilter,
    });

    const montosGlobales = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true, flete: true },
      where: fechaFilter,
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
      _sum: { monto_factura: true },
      where: fechaFilter,
    });

    const refacturadasData = await prisma.registroBitacora.aggregate({
      _sum: { monto_factura: true },
      where: { ...fechaFilter, id_estado: 2 },
    });

    const devolucionesData = await prisma.registroBitacora.aggregate({
      _sum: { monto_devolucion: true },
      where: fechaFilter,
    });

    // 🔹 Procesamiento
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
    const anuladas = estadoMap[8]?.count || 0;
    const pendientes = total - (entregadas + anuladas);

    const montoDevolucion = Number(devolucionesData._sum.monto_devolucion || 0);
    const montoRefacturadas = Number(refacturadasData._sum.monto_factura || 0);
    const montoTotal = Number(montosGlobales._sum.monto_factura || 0);
    const montoFlete = Number(montosGlobales._sum.flete || 0);
    const montoTotalAnuladas = estadoMap[8]?.monto || 0;
    const montoTotalTotal =
      montoTotal - montoDevolucion - montoRefacturadas - montoTotalAnuladas;
    const montoFacturado = montoTotalTotal + montoRefacturadas;

    const tipoEnvioIds = tipoEnvioGroup.map((t) => t.id_tipenvio);
    const tiposEnvio = await prisma.tipo_Envio.findMany({
      where: { id_tipenvio: { in: tipoEnvioIds } },
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

    const vendedorIds = vendedoresGroup.map((v) => v.id_login || 0);
    const vendedoresInfo = await prisma.login.findMany({
      where: { id_login: { in: vendedorIds.length ? vendedorIds : [0] } },
      select: { id_login: true, nombre_vendedor: true },
    });
    const vendedoresFinal = vendedoresGroup.map((v) => {
      const vendedor = vendedoresInfo.find((x) => x.id_login === v.id_login);
      return {
        id_login: v.id_login,
        nombre: vendedor?.nombre_vendedor || "Desconocido",
        cantidad: v._count.id_login,
        monto: v._sum.monto_factura || 0,
      };
    });

    const data = {
      total,
      nuevas,
      refacturadas,
      enviadasACedis,
      preparacion,
      enviadoACliente,
      esperaCaliente,
      entregadas,
      pendientes,
      anuladas,
      montoTotalTotal,
      montoTotalAnuladas,
      montoFacturado,
      montoFlete,
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
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
