// AdminProductividad.jsx
"use client";
import { useEffect, useState } from "react";
import styles from "./AdminProductividad.module.css";

const ESTADOS_ADMIN = ["Nueva", "Refacturada"];
const TIEMPO_MAX = 30; // minutos

export default function AdminProductividad() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bitacora/productividad")
      .then((res) => res.json())
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={styles.loading}>Cargando productividad de admins...</p>;

  const ordenesConEstado = data.filter((o) =>
    o.historial_estados.some((h) => ESTADOS_ADMIN.includes(h.estado))
  );

  const totalOrdenes = ordenesConEstado.length;

  const ordenesCumplen = ordenesConEstado.filter((orden) =>
    orden.historial_estados.some(
      (h) => ESTADOS_ADMIN.includes(h.estado) && h.tiempo_minutos <= TIEMPO_MAX
    )
  ).length;

  const porcentajeCumplen = totalOrdenes
    ? Math.round((ordenesCumplen / totalOrdenes) * 100)
    : 0;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Productividad Administrativa</h3>
      <p>Total órdenes: <span className={styles.value}>{totalOrdenes}</span></p>
      <p>Órdenes nuevas/refacturadas ≤ {TIEMPO_MAX} min: <span className={styles.value}>{porcentajeCumplen}%</span></p>
    </div>
  );
}
