import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// 🧠 Caché simple en memoria
const cache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inicioParam = searchParams.get("inicio");
    const finParam = searchParams.get("fin");
    let vendedorParam = searchParams.get("vendedor");
    const forceRefresh = searchParams.get("refresh") === "true"; // 🔄 Forzar actualización manual

    // 🔹 Clave única para este conjunto de parámetros
    const cacheKey = `${inicioParam || "null"}-${finParam || "null"}-${vendedorParam || "null"}`;
    const now = Date.now();

    // ✅ Revisar si hay datos recientes en caché
    if (!forceRefresh && cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (now - timestamp < CACHE_DURATION) {
        console.log("🟢 Sirviendo datos desde caché");
        return NextResponse.json({ ...data, cached: true });
      }
    }

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
      vendedorParam = Number(vendedorParam);
      fechaFilter.id_login = vendedorParam;
    }

    // 🔹 Consultas secuenciales
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

    const registrosHistorial = await prisma.registroBitacora.findMany({
      select: { monto_factura: true, historial_estados: true },
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

    // 🔹 Procesamiento de resultados
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

    // 🔹 Tipos de envío
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

    // 🔹 Tiendas SINSA
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

    // 🔹 Origen inventario
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

    // 🔹 Origen Facturas
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

    // 🔹 Vendedores
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

    // ✅ Armar respuesta final
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
    };

    // 🧠 Guardar o actualizar caché
    cache.set(cacheKey, { data, timestamp: now });

    console.log(forceRefresh ? "🔁 Caché actualizada manualmente" : "🟡 Datos guardados en caché");
    return NextResponse.json({ ...data, cached: false });

  } catch (error) {
    console.error("❌ Error en estadísticas:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
