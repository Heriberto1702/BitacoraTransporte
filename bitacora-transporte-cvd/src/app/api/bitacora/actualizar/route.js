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

    const ahoraUTC = new Date();

    // 🔒 Bloquear edición si está ENTREGADA (6) o ANULADA (7), excepto superusuario
    if ((estadoActualId === 6 || estadoActualId === 7) && usuario.rol !== "superusuario") {
      return new Response(JSON.stringify({
        error: "No puedes modificar una orden entregada o anulada",
      }), { status: 403 });
    }

    // 🔒 Validar transiciones de estado según rol
    if (nuevoEstadoId !== estadoActualId) {
      const transicionesValidas = await prisma.transicionEstado.findMany({
        where: {
          estado_origen: estadoActualId,
          rol: usuario.rol,
        },
        select: { estado_destino: true },
      });

      const estadosPermitidos = transicionesValidas.map(t => t.estado_destino);
      if (!estadosPermitidos.includes(nuevoEstadoId)) {
        return new Response(JSON.stringify({
          error: "No tienes permiso para mover la orden a este estado",
        }), { status: 403 });
      }
    }

    const creadaUTC = new Date(orden.fecha_creacion);
    const diffHoras = (ahoraUTC.getTime() - creadaUTC.getTime()) / (1000 * 60 * 60);

    // Restricción por rol: vendedor solo 24 horas
    if (usuario.rol === "vendedor" && diffHoras > 24) {
      return new Response(JSON.stringify({ error: "No puedes editar órdenes con más de 24 horas" }), { status: 403 });
    }

    // --- AGENTE: solo puede modificar fecha_entrega y estado ---
    if (usuario.rol === "agente") {
      const dataToUpdate = {};
      if (data.fecha_entrega) {
        dataToUpdate.fecha_entrega = new Date(data.fecha_entrega + "T00:00:00");
      }

      if (nuevoEstadoId !== estadoActualId) {
        dataToUpdate.estado = { connect: { id_estado: nuevoEstadoId } };
        let nuevoHistorial = orden.historial_estados || [];
        const nombreEstado = await prisma.estado.findUnique({ where: { id_estado: nuevoEstadoId } }).then(e => e.nombre);
        nuevoHistorial.push({ estado: nombreEstado, fecha_cambio: ahoraUTC.toISOString() });
        dataToUpdate.historial_estados = nuevoHistorial;
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
    }

    // --- ADMIN o SUPERUSUARIO ---
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
      tipoenvio: { connect: { id_tipenvio: parseInt(data.id_tipenvio) } },
      tipopago: { connect: { id_tipopago: parseInt(data.id_tipopago) } },
      origen_inventario: { connect: { id_originventario: parseInt(data.id_originventario) } },
      tienda: { connect: { id_tienda: parseInt(data.id_tienda) } },
      tiendasinsa: data.id_tiendasinsa
        ? { connect: { id_tiendasinsa: parseInt(data.id_tiendasinsa) } }
        : undefined,
        
    };
  
// 🔹 Asignar agente solo si el usuario es admin o superusuario
if ((usuario.rol === "admin" || usuario.rol === "superusuario") && data.id_login) {
  dataToUpdate.id_agente_asignado = parseInt(data.id_agente_asignado);
}
    // Actualizar estado y historial solo si cambia
    if (nuevoEstadoId !== estadoActualId) {
      dataToUpdate.estado = { connect: { id_estado: nuevoEstadoId } };
      let nuevoHistorial = orden.historial_estados || [];
      const nombreEstado = await prisma.estado.findUnique({ where: { id_estado: nuevoEstadoId } }).then(e => e.nombre);
      nuevoHistorial.push({ estado: nombreEstado, fecha_cambio: ahoraUTC.toISOString() });
      dataToUpdate.historial_estados = nuevoHistorial;
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
        agente: true,
      },
    });

    return new Response(JSON.stringify(ordenActualizada), { status: 200 });

  } catch (error) {
    console.error("Error actualizando orden:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}
