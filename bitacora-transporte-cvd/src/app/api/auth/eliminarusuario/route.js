// /src/app/api/auth/eliminarusuario/route.js
import prisma from "../../../../lib/prisma";
import { NextResponse } from 'next/server'


export async function POST(req) {
  const { correo } = await req.json()

  if (!correo) {
    return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })
  }

  const usuario = await prisma.login.findUnique({ where: { correo } })

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  await prisma.login.delete({ where: { correo } })

  return NextResponse.json({ ok: true, mensaje: 'Usuario eliminado correctamente' })
}
