"use client";
import { useEffect, useState } from "react";

export default function useBitacoraData() {
  const [data, setData] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const fetchData = async (inicio, fin) => {
    try {
      const query = [];
      if (inicio) query.push(`inicio=${inicio}T00:00:00`);
      if (fin) query.push(`fin=${fin}T23:59:59`);
      const url =
        "/api/bitacora/estadisticas" + (query.length ? `?${query.join("&")}` : "");
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    }
  };

  useEffect(() => {
    fetchData(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin]);

  const handleReset = () => {
    setFechaInicio("");
    setFechaFin("");
    fetchData("", "");
  };

  return {
    data,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    fetchData,
    handleReset,
  };
}
