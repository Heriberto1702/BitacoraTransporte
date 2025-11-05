"use client";
import { useState } from "react";
import styles from "./FiltroFechas.module.css";

export default function FiltroFechas({ onBuscar }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleBuscar = () => {
    if (!fechaInicio || !fechaFin) {
      alert("Por favor selecciona ambas fechas antes de buscar.");
      return;
    }

    const inicioDate = new Date(fechaInicio);
    const finDate = new Date(fechaFin);

    if (finDate < inicioDate) {
      alert("La fecha final no puede ser menor que la fecha inicial.");
      return;
    }

    onBuscar(fechaInicio, fechaFin);
  };

  return (
    <div className={styles.dateFilters}>
      <label>
        Desde:
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
      </label>
      <label>
        Hasta:
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </label>
      <button onClick={handleBuscar} className={styles.buscarBtn}>
        Buscar
      </button>
    </div>
  );
}
