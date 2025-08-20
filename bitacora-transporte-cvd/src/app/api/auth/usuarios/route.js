import prisma from "../../../../lib/prisma";
import { NextResponse } from 'next/server'

export async function GET() {
  const usuarios = await prisma.login.findMany({
    where: {
      rol: {
        in: ['admin', 'vendedor'], // Solo estos roles
      },
    },
    orderBy: { id_login: 'asc' },
    select: {
      id_login: true,
      nombre_vendedor: true,
      apellido_vendedor: true,
      correo: true,
      rol: true,
    },
  })

  return NextResponse.json({ usuarios })
}
