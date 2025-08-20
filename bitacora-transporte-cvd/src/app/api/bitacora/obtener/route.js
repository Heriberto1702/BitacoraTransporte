import prisma from "../../../../lib/prisma"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'



export async function GET(req) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') // lo que el usuario escriba
  const fecha = searchParams.get('fecha') // si quieres filtrar por fecha exacta

  const userId = session.user.id
  const userRol = session.user.rol

  let where = {}

  // Si es vendedor, solo sus órdenes
  if (userRol === 'vendedor') {
    where.id_login = userId
  }

  // Si hay texto de búsqueda
  if (search) {
    where.OR = [
      { numeroFactura: { contains: search, mode: 'insensitive' } },
      { id_orden: { contains: search, mode: 'insensitive' } },
      { clienteNombre: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Si hay filtro de fecha
  if (fecha) {
    where.fecha = new Date(fecha)
  }

  const includeRelations = {
    tiendasinsa: true,
    tienda: true,
    tipoenvio: true,
    origen_inventario: true,
    tipopago: true,
    login: true,
  }

  const ordenes = await prisma.registroBitacora.findMany({
    where,
    include: includeRelations,
  })

  return NextResponse.json({ ordenes })
}
