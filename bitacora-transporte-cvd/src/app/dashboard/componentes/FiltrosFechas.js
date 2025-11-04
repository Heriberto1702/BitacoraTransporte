"use client";
import { useEffect } from "react";
import styles from "./FiltroFechas.module.css";

export default function FiltroFechas({
  fechaInicio,
  fechaFin,
  setFechaInicio,
  setFechaFin,

  handleReset,
}) {
  // Establecer fechas del mes actual al montar
  useEffect(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    if (!fechaInicio) setFechaInicio(inicioMes);
    if (!fechaFin) setFechaFin(finMes);
  }, [fechaInicio, fechaFin, setFechaInicio, setFechaFin]);

// 🔹 Maneja el reset al mes actual sin limpiar el filtro global
const handleResetMesActual = () => {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  // 🔹 Solo actualiza las fechas, sin llamar a handleReset
  setFechaInicio(inicioMes);
  setFechaFin(finMes);
};

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Inicio:
        <input
          type="date"
          value={fechaInicio || ""}
          onChange={(e) => setFechaInicio(e.target.value)}
          className={styles.input}
        />
      </label>

      <label className={styles.label}>
        Fin:
        <input
          type="date"
          value={fechaFin || ""}
          onChange={(e) => setFechaFin(e.target.value)}
          className={styles.input}
        />
      </label>


      <button
        onClick={handleResetMesActual}
        className={`${styles.button} ${styles.secondary}`}
      >
        Limpiar
      </button>
    </div>
  );
}
