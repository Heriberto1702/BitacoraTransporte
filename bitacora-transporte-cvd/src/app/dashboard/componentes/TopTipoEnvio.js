"use client";
import Card from "./Card";
import styles from "./TopTipoEnvio.module.css";

export default function TopTipoEnvio({ data }) {
  const top = data.tipoEnvio ? data.tipoEnvio.slice(0, 8) : [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tipos de Envío más usados</h2>
      <div className={styles.grid}>
        {top.map((item, idx) => (
          <Card
            key={idx}
            titulo={`${item.nombre} (C$${Number(item.monto).toFixed(
              2
            )}) (C$${Number(item.totalFlete).toFixed(2)} Flete)`}
            valor={item.cantidad}
          />
        ))}
      </div>
    </div>
  );
}
