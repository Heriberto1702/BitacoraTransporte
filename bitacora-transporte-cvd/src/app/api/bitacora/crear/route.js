import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import prisma from "../../../../lib/prisma";

export async function POST(req) {
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
    const numTicket = parseInt(data.num_ticket);

    // 🔹 Validación: evitar tickets duplicados
    const existeTicket = await prisma.registroBitacora.findFirst({
      where: { num_ticket: numTicket },
    });

    if (existeTicket) {
      return new Response(
        JSON.stringify({ error: "El número de ticket ya existe" }),
        { status: 400 }
      );
    }

    // 🔹 Ajuste de fecha
    const fechaEntrega = new Date(data.fecha_entrega + "T00:00:00");

    // 🔹 Validar estado inicial (Nueva o Refacturada)
    let estadoInicial;
    if (data.id_estado) {
      estadoInicial = await prisma.estado.findFirst({
        where: {
          id_estado: parseInt(data.id_estado),
          nombre: { in: ["Nueva", "Refacturada"] },
        },
      });

      if (!estadoInicial) {
        return new Response(
          JSON.stringify({ error: "Estado inválido para una orden nueva" }),
          { status: 400 }
        );
      }
    } else {
      estadoInicial = await prisma.estado.findFirst({
        where: { nombre: "Nueva" },
      });
    }

    const nuevaOrden = await prisma.registroBitacora.create({
      data: {
        num_ticket: numTicket,
        nombre_cliente: data.nombre_cliente,
        direccion_entrega: data.direccion_entrega || null,
        flete: data.flete ? parseFloat(data.flete) : null,
        fecha_entrega: fechaEntrega,
        observacion: data.observacion || null,
        monto_factura: parseFloat(data.monto_factura),
        cedula: data.cedula,
        telefono: data.telefono,

        // Relaciones obligatorias
        estado: { connect: { id_estado: estadoInicial.id_estado } },
        tipoenvio: { connect: { id_tipenvio: parseInt(data.id_tipenvio) } },
        origen_inventario: {
          connect: { id_originventario: parseInt(data.id_originventario) },
        },
        tienda: { connect: { id_tienda: parseInt(data.id_tienda) } },
        tipopago: { connect: { id_tipopago: parseInt(data.id_tipopago) } },
        login: { connect: { id_login: session.user.id } },

        // Relación opcional
        ...(data.id_tiendasinsa && {
          tiendasinsa: { connect: { id_tiendasinsa: parseInt(data.id_tiendasinsa) } },
        }),
      },
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

    return new Response(JSON.stringify(nuevaOrden), { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }
}