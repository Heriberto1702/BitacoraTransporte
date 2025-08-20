import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../../lib/prisma";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    // Buscar usuario que hace la petición
    const usuario = await prisma.login.findUnique({
      where: { correo: session.user.email },
    });

    if (!usuario) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404 });
    }

    const data = await req.json();

    if (!data.id_registro) {
      return new Response(JSON.stringify({ error: "ID de orden requerido" }), { status: 400 });
    }

    // Buscar la orden en BD
    const orden = await prisma.registroBitacora.findUnique({
      where: { id_registro: parseInt(data.id_registro) },
    });

    if (!orden) {
      return new Response(JSON.stringify({ error: "Orden no encontrada" }), { status: 404 });
    }

    // Calcular diferencia de horas desde creación
    const creada = new Date(orden.createdAt);
    const ahora = new Date();
    const diffHoras = (ahora.getTime() - creada.getTime()) / (1000 * 60 * 60);

    // Preparar los campos a actualizar
    let dataToUpdate = {
      num_ticket: parseInt(data.num_ticket),
      nombre_cliente: data.nombre_cliente,
      direccion_entrega: data.direccion_entrega,
      flete: data.flete ? parseInt(data.flete) : null,
      id_tipenvio: parseInt(data.id_tipenvio),
      id_originventario: parseInt(data.id_originventario),
      id_tienda: parseInt(data.id_tienda),
      id_tiendasinsa: data.id_tiendasinsa ? parseInt(data.id_tiendasinsa) : null,
      id_tipopago: parseInt(data.id_tipopago),
      fecha_entrega: data.fecha_entrega,
    };

    // Lógica de permisos según rol
    if (usuario.rol === "vendedor") {
      if (diffHoras > 24) {
        return new Response(
          JSON.stringify({ error: "No puedes editar órdenes con más de 24 horas" }),
          { status: 403 }
        );
      }
      // Vendedores NO pueden modificar estado
      delete dataToUpdate.estado;
    } else if (usuario.rol === "admin" || usuario.rol === "superusuario") {
      // Admin y superusuario pueden cambiar estado
      if (data.estado) {
        dataToUpdate.estado = data.estado;
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Rol no autorizado para actualizar órdenes" }),
        { status: 403 }
      );
    }

    // Actualizar en BD
    const ordenActualizada = await prisma.registroBitacora.update({
      where: { id_registro: parseInt(data.id_registro) },
      data: dataToUpdate,
    });

    return new Response(JSON.stringify(ordenActualizada), { status: 200 });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}
