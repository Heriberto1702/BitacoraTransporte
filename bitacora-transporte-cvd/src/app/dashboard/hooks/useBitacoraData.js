"use client";
import { useEffect, useState } from "react";

export default function useBitacoraData() {
  const [data, setData] = useState({ ventasDiarias: [], vendedores: [] });
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Función para traer datos de la API
// Función para traer datos de la API
const fetchData = async (inicio, fin, vendedor = "") => {
  try {
    const query = [];
    if (inicio) query.push(`inicio=${inicio}`);
    if (fin) query.push(`fin=${fin}`);
    if (vendedor) query.push(`vendedor=${vendedor}`);
    const url =
      "/api/bitacora/estadisticas" + (query.length ? `?${query.join("&")}` : "");
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
  } catch (err) {
    console.error("Error al cargar estadísticas:", err);
  }
};

  // Calcular primer y último día del mes actual
  const calcularMesActual = () => {
    const now = new Date();
    const primerDia = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
   const hoy = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString().split("T")[0];
    return { primerDia, hoy  };
  };

  // Cargar datos al montar el componente (mes actual)
  useEffect(() => {
    const { primerDia, hoy } = calcularMesActual();
    setFechaInicio(primerDia);
    setFechaFin(hoy);
    fetchData(primerDia, hoy);
  }, []);

  // Filtrar por fechas y/o vendedor
  const handleFiltrar = (vendedor = "") => {
    fetchData(fechaInicio, fechaFin, vendedor);
  };

  // Resetear al mes actual
  const handleResetMesActual = () => {
    const { primerDia, hoy } = calcularMesActual();
    setFechaInicio(primerDia);
    setFechaFin(hoy);
    fetchData(primerDia, hoy);
  };

  return {
    data,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    fetchData,
    handleFiltrar,
    handleResetMesActual,
  };
}
