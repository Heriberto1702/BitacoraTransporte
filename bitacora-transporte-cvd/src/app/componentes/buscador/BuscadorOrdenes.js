"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import styles from "./BuscadorOrdenes.module.css";
import ExportarExcel from "../exportarAexcel/ExportarExcel";
import { supabase } from "../../../lib/supabaseClient";


const BuscadorOrdenes = forwardRef(({ onEditar, session }, ref) => {
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState(null);

  const rolUsuario = session?.user?.rol;

  async function fetchOrdenes() {
    try {
      setLoading(true);
      const res = await fetch("/api/bitacora/obtener");
      if (!res.ok) throw new Error("Error cargando órdenes");
      const data = await res.json();
      setOrdenes(data.ordenes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useImperativeHandle(ref, () => ({
    recargarOrdenes: fetchOrdenes,
    limpiarFilaSeleccionada: () => setOrdenSeleccionadaId(null),
  }));

 useEffect(() => {
    // 🔹 Cargar órdenes al montar
    fetchOrdenes();

    // 🔹 Suscribirse a Realtime de Supabase
    const subscription = supabase
      .channel("realtime-RegistroBitacora") 
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "registroBitacora",
        },
        (payload) => {
          console.log("🔔 Cambio detectado:", payload);

          // Actualizar estado local según tipo de evento
          const { eventType, new: newRow, old: oldRow } = payload;

          setOrdenes((prev) => {
            let updated = [...prev];

            if (eventType === "INSERT" && newRow) {
              // ✅ Agregar nueva orden al inicio
              updated = [newRow, ...updated];
            } else if (eventType === "UPDATE" && newRow) {
              // ✅ Actualizar orden existente
              updated = updated.map((o) =>
                o.id_registro === newRow.id_registro ? newRow : o
              );
            } else if (eventType === "DELETE" && oldRow) {
              // ✅ Eliminar orden borrada
              updated = updated.filter((o) => o.id_registro !== oldRow.id_registro);
            }

            return updated;
          });
        }
      )
      .subscribe();

    // 🔹 Cleanup
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // --- FILTRADO ---
  const ordenesFiltradas = ordenes.filter((orden) => {
    const busqueda = filtro.toLowerCase().trim();

    const formatearFecha = (fecha) => {
      if (!fecha) return "";
      const d = new Date(fecha);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    };

    const fechaCreacionStr = formatearFecha(orden.fecha_creacion);
    const fechaEntregaStr = formatearFecha(orden.fecha_entrega);

    return (
      orden.num_ticket?.toString().toLowerCase().includes(busqueda) ||
      orden.estado?.nombre?.toLowerCase().includes(busqueda) ||
      orden.login?.nombre_vendedor?.toLowerCase().includes(busqueda) ||
      orden.direccion_entrega?.toLowerCase().includes(busqueda) ||
      orden.nombre_cliente?.toLowerCase().includes(busqueda) ||
      orden.cedula?.toLowerCase().includes(busqueda) ||
      orden.flete?.toString().includes(busqueda) ||
      orden.monto_factura?.toString().includes(busqueda) ||
      fechaCreacionStr.includes(busqueda) ||
      fechaEntregaStr.includes(busqueda) ||
      orden.tiendasinsa?.nombre_tiendasinsa?.toLowerCase().includes(busqueda) ||
      orden.origen_inventario?.nombre_origen
        ?.toLowerCase()
        .includes(busqueda) ||
      orden.tipopago?.nombre_tipopago?.toLowerCase().includes(busqueda) ||
      orden.agente?.nombre_agente?.toLowerCase().includes(busqueda) ||
      orden.tienda?.nombre_tienda?.toLowerCase().includes(busqueda) ||
      orden.tipoenvio?.nombre_Tipo?.toLowerCase().includes(busqueda)
    );
  });

  // --- PAGINACIÓN ---
  const totalPaginas =
    filasPorPagina === "Todas"
      ? 1
      : Math.ceil(ordenesFiltradas.length / filasPorPagina);

  const indiceUltimaOrden =
    filasPorPagina === "Todas"
      ? ordenesFiltradas.length
      : paginaActual * filasPorPagina;
  const indicePrimeraOrden =
    filasPorPagina === "Todas" ? 0 : indiceUltimaOrden - filasPorPagina;

  const ordenesMostradas =
    filasPorPagina === "Todas"
      ? ordenesFiltradas
      : ordenesFiltradas.slice(indicePrimeraOrden, indiceUltimaOrden);

  const manejarCambioPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);
  };

  if (loading) return <p>Cargando órdenes...</p>;
  if (!ordenes.length) return <p>No hay órdenes para mostrar.</p>;
  const estadoClases = {
    Nueva: styles.estadoNueva,
    Refacturada: styles.estadoRefacturada,
    "En tránsito a cedis": styles.estadoEnTransito,
    Preparación: styles.estadoPreparacion,
    "Enviado al cliente": styles.estadoEnviado,
    "En espera cliente": styles.estadoEspera,
    Entregada: styles.estadoEntregada,
    Anulada: styles.estadoAnulada,
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Buscar orden por ticket, cliente, vendedor, tienda, tipo envío, estado, cédula, flete o monto..."
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPaginaActual(1);
          }}
          className={styles.searchInput}
        />
        {(rolUsuario === "admin" || rolUsuario === "superusuario") && (
          <ExportarExcel data={ordenesFiltradas} fileName="ordenes.xlsx" />
        )}
      </div>

      {/* --- PAGINACIÓN CONTROLS --- */}
      <div className={styles.paginacionControls}>
        <label>
          Mostrar{" "}
          <select
            value={filasPorPagina}
            onChange={(e) => {
              setFilasPorPagina(
                e.target.value === "Todas" ? "Todas" : Number(e.target.value)
              );
              setPaginaActual(1);
            }}
          >
            {[5, 10, 25, 50, 100, "Todas"].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>{" "}
          filas
        </label>

        {filasPorPagina !== "Todas" && (
          <div className={styles.botonesPagina}>
            <button
              onClick={() => manejarCambioPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              <span>«</span>
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => manejarCambioPagina(i + 1)}
                className={paginaActual === i + 1 ? styles.activo : ""}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => manejarCambioPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              <span>»</span>
            </button>
          </div>
        )}
      </div>

      {/* --- TABLA CON SCROLL --- */}
      <div className={styles.tableWrapper}>
        {ordenesMostradas.length === 0 ? (
          <p className={styles.noResults}>No se encontraron resultados.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Acción</th>
                <th>N° Ticket</th>
                <th>Estado</th>
                <th>Fecha creación</th>
                <th>Fecha entrega</th>
                {(rolUsuario === "admin" ||
                  rolUsuario === "superusuario" ||
                  rolUsuario === "agente") && <th>Agente</th>}
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Identificación</th>
                {(rolUsuario === "admin" || rolUsuario === "superusuario") && (
                  <th>Vendedor</th>
                )}
                <th>Tienda Sinsa</th>
                <th>Inventario</th>
                <th>Tienda</th>
                <th>Tipo Envío</th>
                <th>Tipo Pago</th>
                <th>Flete</th>
                <th>Monto Factura</th>
                <th>Dirección</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {ordenesMostradas.map((orden) => (
                <tr
                  key={orden.id_registro}
                  className={
                    orden.id_registro === ordenSeleccionadaId
                      ? styles.filaSeleccionada
                      : ""
                  }
                >
                  <td data-label="Acción">
                    <button
                      className={styles.button}
                      onClick={() => {
                        setOrdenSeleccionadaId(orden.id_registro);
                        onEditar({
                          ...orden,
                          fecha_entrega: orden.fecha_entrega
                            ? new Date(orden.fecha_entrega)
                                .toISOString()
                                .split("T")[0]
                            : "",
                        });
                      }}
                    >
                      Editar
                    </button>
                  </td>
                  <td data-label="N° Ticket">{orden.num_ticket}</td>
                  <td
                    data-label="Estado"
                    className={
                      estadoClases[orden.estado?.nombre] || styles.estadoDefault
                    }
                  >
                    <p className={styles.estadoBadge}>
                      {orden.estado?.nombre || "-"}
                    </p>
                  </td>
                  <td data-label="Fecha creación">
                    {new Date(orden.fecha_creacion).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true, // cambiar a false si quieres formato 24h
                    })}
                  </td>
                  <td data-label="Fecha entrega">
                    {orden.fecha_entrega
                      ? new Date(orden.fecha_entrega).toLocaleDateString(
                          "en-US"
                        )
                      : "-"}
                  </td>
                  {(rolUsuario === "admin" ||
                    rolUsuario === "superusuario" ||
                    rolUsuario === "agente") && (
                    <td data-label="Agente">
                      {orden.agente?.nombre_agente || "-"}
                    </td>
                  )}
                  <td data-label="Cliente">{orden.nombre_cliente}</td>
                  <td data-label="Teléfono">{orden.telefono || "-"}</td>
                  <td data-label="Identificación">{orden.cedula || "-"}</td>
                  {(rolUsuario === "admin" ||
                    rolUsuario === "superusuario") && (
                    <td data-label="Vendedor">
                      {orden.login?.nombre_vendedor || "-"}
                    </td>
                  )}
                  <td data-label="Tienda Sinsa">
                    {orden.tiendasinsa?.nombre_tiendasinsa || "-"}
                  </td>
                  <td data-label="Inventario">
                    {orden.origen_inventario?.nombre_origen || "-"}
                  </td>
                  <td data-label="Tienda">
                    {orden.tienda?.nombre_tienda || "-"}
                  </td>
                  <td data-label="Tipo Envío">
                    {orden.tipoenvio?.nombre_Tipo || "-"}
                  </td>
                  <td data-label="Tipo Pago">
                    {orden.tipopago?.nombre_tipopago || "-"}
                  </td>
                  <td data-label="Flete">
                    {orden.flete ? `C$ ${orden.flete}` : "-"}
                  </td>
                  <td data-label="Monto Factura">
                    {orden.monto_factura ? `C$ ${orden.monto_factura}` : "-"}
                  </td>
                  <td data-label="Dirección">
                    {orden.direccion_entrega || "-"}
                  </td>
                  <td data-label="Observación">{orden.observacion || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

BuscadorOrdenes.displayName = "BuscadorOrdenes";

export default BuscadorOrdenes;
