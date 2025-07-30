import { PrismaClient } from '@/generated/prisma'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

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
      correo: true,
      rol: true,
    },
  })

  return NextResponse.json({ usuarios })
}
