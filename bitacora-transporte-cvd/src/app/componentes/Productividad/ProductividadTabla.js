import { useEffect, useState } from "react";
import styles from "./ProductividadTabla.module.css";

const MAPA_ESTADOS = {
  "Nueva": "nueva",
  "Refacturada": "refacturada",
  "Preparación": "preparacion",
  "Enviado a cedis": "cedis",
  "Enviada a cedis": "cedis",
  "Enviado a CEDIS": "cedis",
  "Enviada a CEDIS": "cedis",
  "Enviado al cliente": "enviado_cliente",
  "Enviado a cliente": "enviado_cliente",
  "Enviada al cliente": "enviado_cliente",
  "En espera cliente": "espera_cliente",
  "Entregada": "entregada",
  "Anulada": "anulada",
};

export default function ProductividadTabla() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [unidades, setUnidades] = useState({
    nueva: "hrs",
    refacturada: "min",
    cedis: "min",
    preparacion: "min",
    enviado_cliente: "min",
    espera_cliente: "dias",
    entregada: "dias",
  });

  useEffect(() => {
    fetch("/api/bitacora/productividad")
      .then((res) => res.json())
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando productividad...</p>;

  const convertirTiempo = (minutos, unidad) => {
    if (unidad === "hrs") return (minutos / 60).toFixed(2);
    if (unidad === "dias") return (minutos / 60 / 24).toFixed(2);
    return minutos; // min
  };

  const columnas = [
    { label: "N° Ticket", key: "num_ticket" },
    { label: "Cliente", key: "cliente" },
    { label: "Nueva", key: "nueva" },
    { label: "Refacturada", key: "refacturada" },
    { label: "Enviado a CEDIS", key: "cedis" },
    { label: "Preparación", key: "preparacion" },
    { label: "Enviado al Cliente", key: "enviado_cliente" },
    { label: "En Espera Cliente", key: "espera_cliente" },
    { label: "Entregada", key: "entregada" },
    { label: "Agente Asignado", key: "nombre_agente" },
  ];

  return (
    <div className={styles.tablaContainer}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.key}>
                {col.label}{" "}
                {unidades[col.key] && (
                  <select
                    value={unidades[col.key]}
                    onChange={(e) =>
                      setUnidades((prev) => ({
                        ...prev,
                        [col.key]: e.target.value,
                      }))
                    }
                  >
                    <option value="min">Min</option>
                    <option value="hrs">Hrs</option>
                    <option value="dias">Días</option>
                  </select>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((orden) => {
            const tiempos = {
              nueva: 0,
              refacturada: 0,
              cedis: 0,
              preparacion: 0,
              enviado_cliente: 0,
              espera_cliente: 0,
              entregada: 0,
              anulada: 0,
            };

            orden.historial_estados.forEach((h) => {
              const key = MAPA_ESTADOS[h.estado];
              if (key) tiempos[key] = Math.round(h.tiempo_horas * 60);
            });

            return (
              <tr key={orden.id_registro}>
                {columnas.map((col) => {
                  if (col.key in tiempos) {
                    return (
                      <td key={col.key}>
                        {convertirTiempo(tiempos[col.key], unidades[col.key])}
                      </td>
                    );
                  }
                  return <td key={col.key}>{orden[col.key]}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
