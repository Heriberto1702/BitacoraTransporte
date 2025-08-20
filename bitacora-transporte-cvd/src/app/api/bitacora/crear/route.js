import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../../lib/prisma";
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const usuario = await prisma.login.findUnique({
      where: { correo: session.user.email },
    });

    if (!usuario) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404 });
    }

    const data = await req.json();

    const nuevaOrden = await prisma.registroBitacora.create({
      data: {
        num_ticket: parseInt(data.num_ticket),
        nombre_cliente: data.nombre_cliente,
        direccion_entrega: data.direccion_entrega,
        flete: data.flete ? parseInt(data.flete) : null,
        estado: data.estado,
        fecha_entrega: data.fecha_entrega,
        id_tipenvio: parseInt(data.id_tipenvio),
        id_originventario: parseInt(data.id_originventario),
        id_tienda: parseInt(data.id_tienda),
        id_tiendasinsa: data.id_tiendasinsa ? parseInt(data.id_tiendasinsa) : null,
        id_tipopago: parseInt(data.id_tipopago),
        id_login: usuario.id_login,
      },
    });

    return new Response(JSON.stringify(nuevaOrden), { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}
