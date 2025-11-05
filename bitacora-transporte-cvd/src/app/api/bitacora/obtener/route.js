import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim();
  const inicio = searchParams.get("inicio");
  const fin = searchParams.get("fin");

  const userId = session.user.id;
  const userRol = session.user.rol;

  let where = {};

  // 🔹 Si es vendedor, solo ve sus órdenes
  if (userRol === "vendedor") {
    where.id_login = userId;
  }

  // 🔹 Filtro de búsqueda general
  if (search) {
    const busqueda = search.toLowerCase();
    where.OR = [
      { numeroFactura: { contains: busqueda, mode: "insensitive" } },
      { id_orden: { contains: busqueda, mode: "insensitive" } },
      { clienteNombre: { contains: busqueda, mode: "insensitive" } },
      { estado: { contains: busqueda, mode: "insensitive" } },
      { direccion_entrega: { contains: busqueda, mode: "insensitive" } },
      { login: { nombre_vendedor: { contains: busqueda, mode: "insensitive" } } },
      { tiendasinsa: { nombre_tiendasinsa: { contains: busqueda, mode: "insensitive" } } },
      { origen_inventario: { nombre_origen: { contains: busqueda, mode: "insensitive" } } },
      { tipopago: { nombre_tipopago: { contains: busqueda, mode: "insensitive" } } },
      { tienda: { nombre_tienda: { contains: busqueda, mode: "insensitive" } } },
      { tipoenvio: { nombre_Tipo: { contains: busqueda, mode: "insensitive" } } },
    ];
  }

  // 🔹 Filtro de rango de fechas (si existe)
if (inicio && fin) {
  // 🔹 Interpretar las fechas como locales (evita desfase)
  const fechaInicio = new Date(`${inicio}T00:00:00`);
  const fechaFin = new Date(`${fin}T23:59:59`);

  where.fecha_creacion = {
    gte: fechaInicio,
    lte: fechaFin,
  };
}

  const includeRelations = {
    tiendasinsa: true,
    tienda: true,
    tipoenvio: true,
    origen_inventario: true,
    tipopago: true,
    login: true,
    agente: true,
    estado: true,
  };

  const ordenes = await prisma.registroBitacora.findMany({
    where,
    include: includeRelations,
    orderBy: { fecha_creacion: "desc" },
  });

  return NextResponse.json({ ordenes });
}
