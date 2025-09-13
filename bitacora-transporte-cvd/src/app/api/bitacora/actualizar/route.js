import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import prisma from "../../../../lib/prisma";

export async function PUT(req) {
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
    if (!data.id_registro) {
      return new Response(JSON.stringify({ error: "ID de orden requerido" }), { status: 400 });
    }

    const orden = await prisma.registroBitacora.findUnique({
      where: { id_registro: parseInt(data.id_registro) },
    });

    if (!orden) {
      return new Response(JSON.stringify({ error: "Orden no encontrada" }), { status: 404 });
    }
const estadoActualId = orden.id_estado;
const nuevoEstadoId = data.id_estado ? parseInt(data.id_estado) : estadoActualId;

// Solo validar si el usuario está intentando cambiar el estado
if (nuevoEstadoId !== estadoActualId) {
  // Traer las transiciones válidas desde el estado actual para este rol
  const transicionesValidas = await prisma.transicionEstado.findMany({
    where: {
      estado_origen: estadoActualId,
      rol: usuario.rol,
    },
    select: {
      estado_destino: true,
    },
  });

  const estadosPermitidos = transicionesValidas.map(t => t.estado_destino);

  if (!estadosPermitidos.includes(nuevoEstadoId)) {
    return new Response(JSON.stringify({
      error: "No tienes permiso para mover la orden a este estado"
    }), { status: 403 });
  }
}


    const creadaUTC = new Date(orden.fecha_creacion);
    const ahoraUTC = new Date();
    const diffHoras = (ahoraUTC.getTime() - creadaUTC.getTime()) / (1000 * 60 * 60);

    // Construimos el objeto de actualización
    const dataToUpdate = {
      num_ticket: parseInt(data.num_ticket),
      nombre_cliente: data.nombre_cliente,
      direccion_entrega: data.direccion_entrega || null,
      flete: data.flete ? parseInt(data.flete) : null,
      fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega + "T00:00:00") : null,
      observacion: data.observacion || null,
      monto_factura: parseFloat(data.monto_factura),
      cedula: data.cedula,
      telefono: data.telefono,
      hora_actualizacion: ahoraUTC,
      // Relaciones
      tipoenvio: { connect: { id_tipenvio: parseInt(data.id_tipenvio) } },
      tipopago: { connect: { id_tipopago: parseInt(data.id_tipopago) } },
      origen_inventario: { connect: { id_originventario: parseInt(data.id_originventario) } },
      tienda: { connect: { id_tienda: parseInt(data.id_tienda) } },
      tiendasinsa: data.id_tiendasinsa
        ? { connect: { id_tiendasinsa: parseInt(data.id_tiendasinsa) } }
        : undefined,
    };

    // Reglas según rol
    if (usuario.rol === "vendedor" && diffHoras > 24) {
      return new Response(JSON.stringify({ error: "No puedes editar órdenes con más de 24 horas" }), { status: 403 });
    }

    if ((usuario.rol === "admin" || usuario.rol === "superusuario" || usuario.rol === "agente") && data.id_estado) {
      dataToUpdate.estado = { connect: { id_estado: parseInt(data.id_estado) } };
    }

    const ordenActualizada = await prisma.registroBitacora.update({
      where: { id_registro: parseInt(data.id_registro) },
      data: dataToUpdate,
      include: {
        estado: true,
        login: true,
        tipopago: true,
        tipoenvio: true,
        tiendasinsa: true,
        tienda: true,
        origen_inventario: true,
      },
    });

    return new Response(JSON.stringify(ordenActualizada), { status: 200 });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}
