"use client";
import { useEffect, useState } from "react";

export default function ComprasUsuarios() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrdenes() {
      try {
        setLoading(true);
        const res = await fetch("/api/bitacora/obtener");
        if (!res.ok) throw new Error("Error cargando las órdenes");
        const data = await res.json();
        setOrdenes(data.ordenes);
      } catch (err) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchOrdenes();
  }, []);

  if (loading) return <p>Cargando órdenes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (ordenes.length === 0) return <p>No hay órdenes para mostrar.</p>;

  return (
    <div>
      <h2>Lista de Órdenes</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: "8px" }}>Número Ticket</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Cliente</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Dirección</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Fecha</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Flete</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Tipo de envío</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Inventario</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Tienda Sinsa</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Tienda</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Tipo de pago</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Acción</th>
            {/* Puedes agregar más columnas con otras relaciones */}
          </tr>
        </thead>
        <tbody>
          {ordenes.map((orden) => (
            <tr key={orden.id_registro}>
              <td style={{ border: "1px solid black", padding: "8px" }}>{orden.num_ticket}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{orden.nombre_cliente}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{orden.direccion_entrega}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {new Date(orden.fecha_creacion).toLocaleString()}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.flete ?? "-"}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.tipoenvio?.nombre_Tipo ?? "-"}
              </td>
               <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.origen_inventario?.nombre_origen ?? "-"}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.tiendasinsa?.nombre_tiendasinsa ?? "-"}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.tienda?.nombre_tienda ?? "-"}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.tipopago?.nombre_tipopago ?? "-"}
              </td>
                           <td style={{ border: "1px solid black", padding: "8px" }}>
                {orden.tipopago?.nombre_tipopago ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
