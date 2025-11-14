"use client";
import { useEffect, useState } from "react";
import CarruselProductividad from "../CarruselProductividad/CarruselProductividad";
import ProductividadTabla from "./ProductividadTabla";
import AdminProductividad from "./AdminProductividad";
import styles from "./Productividad.module.css";

export default function Productividad() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bitacora/productividad")
      .then((res) => res.json())
      .then((res) => {
        const MAPA_ESTADOS = { Preparación: "preparacion" };

        const procesado = res.map((orden) => {
          const tiempos = { preparacion: 0 };
          orden.historial_estados.forEach((h) => {
            const key = MAPA_ESTADOS[h.estado];
            if (key) tiempos[key] = Math.round(h.tiempo_horas * 60);
          });

          return { ...orden, tiempos };
        });

        setData(procesado);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={styles.loading}>Cargando productividad...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.subComponent}>
        <AdminProductividad />
      </div>
      <div className={styles.subComponent}>
        <CarruselProductividad data={data} />
      </div>
      <div className={styles.subComponent}>
        <ProductividadTabla />
      </div>
    </div>
  );
}
