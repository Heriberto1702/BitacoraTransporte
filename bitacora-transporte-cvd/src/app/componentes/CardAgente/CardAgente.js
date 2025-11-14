// /src/app/componentes/Productividad/CardAgente.jsx
import styles from "./CardAgente.module.css";

export default function CardAgente({ agente }) {
  const { nombre_agente, ordenes } = agente;

  // Calculamos productividad solo con Preparación (≤ 60 min)
  const prepObj = ordenes.filter((o) => o.tiempos.preparacion <= 60).length;
  const prepTotal = ordenes.length;
  const prepProd = prepTotal ? Math.round((prepObj / prepTotal) * 100) : 0;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{nombre_agente}</h3>
      <p>Órdenes asignadas: <span className={styles.value}>{ordenes.length}</span></p>
      <p>Preparación: <span className={styles.value}>{prepProd}%</span> cumplen ≤ 60 min</p>
    </div>
  );
}
