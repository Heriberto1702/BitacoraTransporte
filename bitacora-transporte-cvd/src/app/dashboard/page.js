"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ExportDashBoard from "../componentes/exportarAexcel/ExportDashBoard";
import Productividad from "../componentes/Productividad/Productividad";
export default function DashboardBitacora() {
  const [data, setData] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const fetchData = async (inicio, fin) => {
    try {
      const query = [];
      if (inicio) query.push(`inicio=${inicio}T00:00:00`);
      if (fin) query.push(`fin=${fin}T23:59:59`);
      const url = "/api/bitacora/estadisticas" + (query.length ? `?${query.join("&")}` : "");
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

  const handleFiltrar = () => {
    fetchData(fechaInicio, fechaFin);
  };

  const handleReset = () => {
    setFechaInicio("");
    setFechaFin("");
    fetchData("", "");
  };

  if (!data) {
    return (
      <p style={{ padding: "20px", color: "#555" }}>Cargando estadísticas...</p>
    );
  }

  const topTipoEnvio = data.tipoEnvio ? data.tipoEnvio.slice(0, 5) : [];
  const topTiendas = data.tiendaSinsa ? data.tiendaSinsa.slice(0, 5) : [];
  const topOrigen = data.origenInventario ? data.origenInventario.slice(0, 5) : [];

  return (
    <>
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>Panel de Bitácora</h1>
      <Link href="/">Inicio</Link>

      {/* Filtro por rango de fechas */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <label>
          Inicio:
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={{ marginLeft: "5px" }} />
        </label>
        <label>
          Fin:
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={{ marginLeft: "5px" }} />
        </label>
        <button onClick={handleFiltrar} style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>
          Filtrar
        </button>
        <button onClick={handleReset} style={{ backgroundColor: "#999", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>
          Reset
        </button>
      </div>

      {/* Resumen general */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", marginTop: "20px" }}>
        <Card titulo="Total Registros" valor={data.total} color="#4f46e5" />
        <Card titulo="Entregadas" valor={data.entregadas} color="#22c55e" />
        <Card titulo="Pendientes" valor={data.pendientes} color="#eab308" />
        <Card titulo="Anuladas" valor={data.Anuladas} color="#ef4444" />
      </div>

      {/* Monto y promedio */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px", marginTop: "20px" }}>
        <Card titulo="Monto total facturado (bruto)" valor={`C$${Number(data.montoTotal || 0).toFixed(2)}`} />
        <Card titulo="Monto total Anuladas" valor={`C$${Number(data.montoTotalAnuladas || 0).toFixed(2)}`} color="#ef4444" />
        <Card titulo="Monto facturado (neto)" valor={`C$${Number(data.montoFacturado || 0).toFixed(2)}`} color="#22c55e" />
        <Card titulo="Promedio de Flete" valor={`C$${Number(data.montoFlete || 0).toFixed(2)}`} />
      </div>

        <Productividad />
      {/* Gráfico */}
      <div style={{ backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", padding: "20px", marginTop: "30px" }}>
        <h2 style={{ fontSize: "18px", color: "#444", marginBottom: "10px" }}>Órdenes por Estado</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ estado: "Pendientes", total: data.pendientes }, { estado: "Entregadas", total: data.entregadas }]}>
            <XAxis dataKey="estado" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#4f46e5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top tipos de envío */}
      <h2 style={{ marginTop: "40px", color: "#444" }}>Tipos de Envío más usados</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        {topTipoEnvio.map((item, idx) => (
          <Card key={idx} titulo={`${item.nombre} (C$${Number(item.monto).toFixed(2)}) (C$${Number(item.totalFlete).toFixed(2)} Flete)`} valor={item.cantidad} />
        ))}
      </div>

      {/* Tiendas */}
      <h2 style={{ marginTop: "40px", color: "#444" }}>Retiros en Tiendas Sinsa más usados</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        {topTiendas.map((item, idx) => (
          <Card key={idx} titulo={item.nombre} valor={item.cantidad} />
        ))}
      </div>

      {/* Origen de inventario */}
      <h2 style={{ marginTop: "40px", color: "#444" }}>Origen de Inventario más usado</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        {topOrigen.map((item, idx) => (
          <Card key={idx} titulo={item.nombre} valor={item.cantidad} />
        ))}
      </div>

      {/* Exportar */}
      <ExportDashBoard data={data} />
    </div>
    </>
  );
}

// Componente Card
function Card({ titulo, valor, color = "#4f46e5" }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", padding: "20px" }}>
      <h2 style={{ fontSize: "16px", color: "#555" }}>{titulo}</h2>
      <p style={{ fontSize: "28px", fontWeight: "bold", color: color, marginTop: "8px" }}>{valor}</p>
    </div>
  );
}
