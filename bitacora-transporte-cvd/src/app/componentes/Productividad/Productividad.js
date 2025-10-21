import { useEffect, useState } from "react";

export default function Productividad() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bitacora/productividad")
      .then((res) => res.json())
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando productividad...</p>;

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table style={{ minWidth: "800px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>N° Ticket</th>
            <th>Cliente</th>
            <th>Nueva (min)</th>
            <th>Preparación (min)</th>
            <th>Enviado a Cliente (min)</th>
            <th>En Espera Cliente (min)</th>
            <th>Entregada (min)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((orden) => {
            const tiempos = {};
            orden.historial_estados.forEach(
              (h) => (tiempos[h.estado] = Math.round(h.tiempo_horas * 60)) // convertimos a minutos
            );

            return (
              <tr key={orden.id_registro}>
                <td>{orden.num_ticket}</td>
                <td>{orden.cliente}</td>
                <td>{tiempos["Nueva"] || 0}</td>
                <td>{tiempos["Preparacion"] || 0}</td>
                <td>{tiempos["Enviado a Cliente"] || 0}</td>
                <td>{tiempos["En Espera Cliente"] || 0}</td>
                <td>{tiempos["Entregada"] || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
