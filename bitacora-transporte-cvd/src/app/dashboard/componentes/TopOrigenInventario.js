"use client";
import Card from "./Card";
import styles from "./TopOrigenInventario.module.css";

export default function TopOrigenInventario({ data }) {
  const top = data.origenInventario ? data.origenInventario.slice(0, 3) : [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Origen de Inventario más usado</h2>
      <div className={styles.grid}>
        {top.map((item, idx) => (
          <Card key={idx} titulo={item.nombre} valor={item.cantidad} />
        ))}
      </div>
    </div>
  );
}
