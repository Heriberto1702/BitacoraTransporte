import styles from "./Card.Module.css";

export default function Card({ titulo, valor, color = "#4f46e5" }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardTitulo}>{titulo}</p>
      <p className={styles.cardValor} style={{ color }}>
        {valor}
      </p>
    </div>
  );
}
