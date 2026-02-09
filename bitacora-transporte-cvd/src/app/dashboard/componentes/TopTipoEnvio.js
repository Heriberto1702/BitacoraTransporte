"use client";
import CardEnvio from "./CardEnvio";
import styles from "./TopTipoEnvio.module.css";

export default function TopTipoEnvio({ data }) {
  const top = data.tipoEnvio ? data.tipoEnvio.slice(0, 8) : [];

  return (
    <div className={styles.container}>

      <h2 className={styles.title}>Tipos de Envío más usados</h2>

      <div className={styles.grid}>
        {top.map((item, idx) => (

          <CardEnvio
            key={idx}
            titulo={item.nombre}
            valor={item.cantidad}
            monto={item.monto}
            flete={item.totalFlete}

          />
        ))}
      </div>

    </div>
  );
}
