import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../../lib/prisma";

// Convierte fecha UTC a hora local Managua (UTC−6)
function convertirAHoraManagua(fechaUtc) {
  const fecha = new Date(fechaUtc);
  fecha.setHours(fecha.getHours() - 6); // Ajuste manual
  return fecha;
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
      });
    }

    const usuario = await prisma.login.findUnique({
      where: { correo: session.user.email },
    });

    if (!usuario) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
      });
    }

    const data = await req.json();
    if (!data.id_registro) {
      return new Response(JSON.stringify({ error: "ID de orden requerido" }), {
        status: 400,
      });
    }

    const orden = await prisma.registroBitacora.findUnique({
      where: { id_registro: parseInt(data.id_registro) },
    });

    if (!orden) {
      return new Response(JSON.stringify({ error: "Orden no encontrada" }), {
        status: 404,
      });
    }

    // Convertir a hora local Managua (usando fecha_creacion)
    const creadaLocal = convertirAHoraManagua(orden.fecha_creacion);
    const ahoraLocal = convertirAHoraManagua(new Date());

    // Diferencia en horas
    const diffHoras =
      (ahoraLocal.getTime() - creadaLocal.getTime()) / (1000 * 60 * 60);

    let dataToUpdate = {
      num_ticket: parseInt(data.num_ticket),
      nombre_cliente: data.nombre_cliente,
      direccion_entrega: data.direccion_entrega,
      flete: data.flete ? parseInt(data.flete) : null,
      id_tipenvio: parseInt(data.id_tipenvio),
      id_originventario: parseInt(data.id_originventario),
      id_tienda: parseInt(data.id_tienda),
      id_tiendasinsa: data.id_tiendasinsa
        ? parseInt(data.id_tiendasinsa)
        : null,
      id_tipopago: parseInt(data.id_tipopago),
      // 👇 conversión a Date para guardar en la DB
      fecha_entrega: data.fecha_entrega
        ? new Date(data.fecha_entrega + "T00:00:00")
        : null,
    };

    // Lógica de permisos según rol
    if (usuario.rol === "vendedor") {
      if (diffHoras > 1) {
        return new Response(
          JSON.stringify({
            error: "No puedes editar órdenes con más de 1 hora",
          }),
          { status: 403 }
        );
      }
      delete dataToUpdate.estado; // Vendedores no pueden cambiar estado
    } else if (usuario.rol === "admin" || usuario.rol === "superusuario") {
      if (data.estado) {
        dataToUpdate.estado = data.estado;
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Rol no autorizado para actualizar órdenes" }),
        { status: 403 }
      );
    }

    const ordenActualizada = await prisma.registroBitacora.update({
      where: { id_registro: parseInt(data.id_registro) },
      data: dataToUpdate,
    });

    return new Response(JSON.stringify(ordenActualizada), { status: 200 });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }
}
