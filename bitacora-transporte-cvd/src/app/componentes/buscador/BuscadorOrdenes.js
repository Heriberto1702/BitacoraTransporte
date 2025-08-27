"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import styles from "./BuscadorOrdenes.module.css";
import ExportarExcel from "../exportarAexcel/ExportarExcel";

const BuscadorOrdenes = forwardRef(({ onEditar, session }, ref) => {
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Método que se puede llamar desde el padre
  useImperativeHandle(ref, () => ({
    recargarOrdenes: fetchOrdenes,
  }));

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const ordenesFiltradas = ordenes.filter((orden) => {
    const busqueda = filtro.toLowerCase().trim();
    let fechaFormateadaES = "";
    let fechaFormateadaUS = "";
    let fechaISO = "";

    if (orden.fecha_creacion) {
      const fecha = new Date(orden.fecha_creacion);
      fechaFormateadaES = fecha.toLocaleDateString("es-ES");
      fechaFormateadaUS = fecha.toLocaleDateString("en-US");
      fechaISO = fecha.toISOString().split("T")[0];
    }

    return (
      orden.num_ticket?.toString().toLowerCase().includes(busqueda) ||
      orden.fecha_entrega?.toString().toLowerCase().includes(busqueda) ||
      orden.estado?.toString().toLowerCase().includes(busqueda) ||
      orden.direccion_entrega?.toString().toLowerCase().includes(busqueda) ||
      orden.nombre_cliente?.toLowerCase().includes(busqueda) ||
      fechaFormateadaES.toLowerCase().includes(busqueda) ||
      fechaFormateadaUS.toLowerCase().includes(busqueda) ||
      fechaISO.toLowerCase().includes(busqueda) ||
      orden.tiendasinsa?.nombre_tiendasinsa?.toLowerCase().includes(busqueda) ||
      orden.origen_inventario?.nombre_origen
        ?.toLowerCase()
        .includes(busqueda) ||
      orden.tienda?.nombre_tienda?.toLowerCase().includes(busqueda) ||
      orden.tipoenvio?.nombre_Tipo?.toLowerCase().includes(busqueda)
    );
  });

  if (loading) return <p>Cargando órdenes...</p>;
  if (!ordenes.length) return <p>No hay órdenes para mostrar.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Buscar orden por ticket, cliente, tienda, tipo envío, estado..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.searchInput}
        />
        <ExportarExcel data={ordenesFiltradas} fileName="ordenes.xlsx" />
      </div>
      {ordenesFiltradas.length === 0 ? (
        <p className={styles.noResults}>No se encontraron resultados.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° Ticket</th>
              {(rolUsuario === "admin" || rolUsuario === "superusuario") && (
                <th>Vendedor</th>
              )}
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Tienda Sinsa</th>
              <th>Inventario</th>
              <th>Tienda</th>
              <th>Tipo Envío</th>
              <th>Tipo Pago</th>
              <th>Fecha creación</th>
              <th>Fecha entrega</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ordenesFiltradas.map((orden) => (
              <tr key={orden.id_registro}>
                <td data-label="N° Ticket">{orden.num_ticket}</td>

                {(rolUsuario === "admin" || rolUsuario === "superusuario") && (
                  <td data-label="Vendedor">
                    {orden.login?.nombre_vendedor || "-"}
                  </td>
                )}

                <td data-label="Cliente">{orden.nombre_cliente}</td>
                <td data-label="Dirección">{orden.direccion_entrega}</td>
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

                <td data-label="Fecha creación">
                  {new Date(orden.fecha_creacion).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </td>

                <td data-label="Fecha entrega">
                  {orden.fecha_entrega
                    ? new Date(orden.fecha_entrega).toLocaleDateString(
                        "en-US",
                        {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        }
                      )
                    : "-"}
                </td>

                <td
                  data-label="Estado"
                  className={
                    orden.estado === "Nueva"
                      ? styles.estadoNueva
                      : orden.estado === "Recibida"
                      ? styles.estadoRecibida
                      : orden.estado === "Refacturada"
                      ? styles.estadoRefacturada
                      : orden.estado === "Refacturada-Recibida"
                      ? styles.estadoRefacturadaRecibida
                      : ""
                  }
                >
                  <p className={styles.estadoBadge}>{orden.estado}</p>
                </td>

                <td data-label="Acción">
                  <button
                    className={styles.button}
                    onClick={() =>
                      onEditar({
                        ...orden,
                        fecha_entrega: orden.fecha_entrega
                          ? new Date(orden.fecha_entrega)
                              .toISOString()
                              .split("T")[0]
                          : "",
                      })
                    }
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

BuscadorOrdenes.displayName = "BuscadorOrdenes";

export default BuscadorOrdenes;
