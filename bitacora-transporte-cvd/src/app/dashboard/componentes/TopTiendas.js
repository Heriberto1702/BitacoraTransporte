"use client";
import Card from "./Card";
import styles from "./TopTiendas.module.css";

export default function TopTiendas({ data }) {
  const top = data.tiendaSinsa ? data.tiendaSinsa.slice(0, 28) : [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Retiros en Tiendas Sinsa más usados</h2>
      <div className={styles.grid}>
        {top.map((item, idx) => (
          <Card key={idx} titulo={item.nombre} valor={item.cantidad} />
        ))}
      </div>
    </div>
  );
}
