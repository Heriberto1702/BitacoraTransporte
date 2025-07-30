import { PrismaClient } from '@/generated/prisma'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
  const { correo, rol, password } = await req.json()

  if (!correo || !rol || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const existe = await prisma.login.findUnique({ where: { correo } })
  if (existe) {
    return NextResponse.json({ error: 'Usuario ya existe' }, { status: 400 })
  }

  const nuevo = await prisma.login.create({
    data: {
      correo,
      rol,
      password,
    },
  })

  return NextResponse.json({ ok: true, usuario: nuevo })
}
