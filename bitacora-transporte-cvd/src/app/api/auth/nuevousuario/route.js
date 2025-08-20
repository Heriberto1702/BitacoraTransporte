import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";


export async function POST(req) {
  const { correo, rol, password, nombre_vendedor, apellido_vendedor } =
    await req.json();

  if (!correo || !rol || !password || !nombre_vendedor || !apellido_vendedor) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const existe = await prisma.login.findUnique({ where: { correo } });
  if (existe) {
    return NextResponse.json({ error: "Usuario ya existe" }, { status: 400 });
  }

  const nuevo = await prisma.login.create({
    data: {
      correo,
      rol,
      password,
      nombre_vendedor,
      apellido_vendedor,
    },
  });

  return NextResponse.json({ ok: true, usuario: nuevo });
}
