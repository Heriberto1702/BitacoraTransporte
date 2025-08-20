"use client";
import { useEffect, useState } from "react";
import styles from "./BuscadorOrdenes.module.css";

export default function BuscadorOrdenes({ onEditar, session }) {
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  const rolUsuario = session?.user?.rol;

  useEffect(() => {
    async function fetchOrdenes() {
      try {
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
    fetchOrdenes();
  }, []);

  const ordenesFiltradas = ordenes.filter((orden) => {
    const busqueda = filtro.toLowerCase().trim();

    let fechaFormateadaES = "";
    let fechaFormateadaUS = "";
    let fechaISO = "";

    if (orden.fecha_creacion) {
      const fecha = new Date(orden.fecha_creacion);
      fechaFormateadaES = fecha.toLocaleDateString("es-ES"); // 14/8/2025
      fechaFormateadaUS = fecha.toLocaleDateString("en-US"); // 8/14/2025
      fechaISO = fecha.toISOString().split("T")[0]; // 2025-08-14
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
      orden.origen_inventario?.nombre_origen?.toLowerCase().includes(busqueda) ||
      orden.tienda?.nombre_tienda?.toLowerCase().includes(busqueda) ||
      orden.tipoenvio?.nombre_Tipo?.toLowerCase().includes(busqueda)
    );
  });

  if (loading) return <p>Cargando órdenes...</p>;
  if (!ordenes.length) return <p>No hay órdenes para mostrar.</p>;

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Buscar orden por ticket, cliente, tienda, tipo envío, estado..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className={styles.searchInput}
      />

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
                <td>{orden.num_ticket}</td>
                {(rolUsuario === "admin" || rolUsuario === "superusuario") && (
                  <td>{orden.login.nombre_vendedor || "-"}</td>
                )}
                <td>{orden.nombre_cliente}</td>
                <td>{orden.direccion_entrega}</td>
                <td>{orden.tiendasinsa?.nombre_tiendasinsa || "-"}</td>
                <td>{orden.origen_inventario?.nombre_origen || "-"}</td>
                <td>{orden.tienda?.nombre_tienda || "-"}</td>
                <td>{orden.tipoenvio?.nombre_Tipo || "-"}</td>
                <td>{orden.tipopago?.nombre_tipopago || "-"}</td>
                <td>{new Date(orden.fecha_creacion).toLocaleDateString()}</td>
                <td>{orden.fecha_entrega}</td>
                <td>{orden.estado}</td>
                <td>
                  <button
                    className={styles.button}
                    onClick={() => onEditar(orden)}
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
}
