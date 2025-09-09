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
  const search = searchParams.get("q")?.trim(); // búsqueda general
  const fecha = searchParams.get("fecha"); // fecha exacta opcional

  const userId = session.user.id;
  const userRol = session.user.rol;

  let where = {};

  // Vendedor solo ve sus órdenes
  if (userRol === "vendedor") {
    where.id_login = userId;
  }

  // Filtro de búsqueda general
  if (search) {
    const busqueda = search.toLowerCase();
    where.OR = [
      { numeroFactura: { contains: busqueda, mode: "insensitive" } },
      { id_orden: { contains: busqueda, mode: "insensitive" } },
      { clienteNombre: { contains: busqueda, mode: "insensitive" } },
      { estado: { contains: busqueda, mode: "insensitive" } },
      { direccion_entrega: { contains: busqueda, mode: "insensitive" } },
      { login: { nombre_vendedor: { contains: busqueda, mode: "insensitive" } } },
      // Relacionados
      { tiendasinsa: { nombre_tiendasinsa: { contains: busqueda, mode: "insensitive" } } },
      { origen_inventario: { nombre_origen: { contains: busqueda, mode: "insensitive" } } },
      { tipopago: { nombre_tipopago: { contains: busqueda, mode: "insensitive" } } },
      { tienda: { nombre_tienda: { contains: busqueda, mode: "insensitive" } } },
      { tipoenvio: { nombre_Tipo: { contains: busqueda, mode: "insensitive" } } },
    ];
  }

  // Filtro de fecha exacta (fecha_creacion)
  if (fecha) {
    const fechaInicio = new Date(fecha);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

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
  };

  const ordenes = await prisma.registroBitacora.findMany({
    where,
    include: includeRelations,
    orderBy: {
      fecha_creacion: "desc", // 👈 Orden descendente
    },
  });

  return NextResponse.json({ ordenes });
}
