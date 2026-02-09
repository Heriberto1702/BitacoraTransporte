import styles from "./CardEnvio.module.css";

export default function Card({
  titulo,
  valor,
  monto,
  flete,
  color = "#4f46e5",
}) {
  const formatMoney = (value) => {
    if (value == null || value === "") return "—";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <p className={styles.cardTitulo}>{titulo}</p>
        <p className={styles.cardValor} style={{ color }}>
          {valor}
        </p>
      </div>

      <div className={styles.divider} />

      <div className={styles.detalles}>
        <p className={styles.cardMonto}>
          <span>Monto Ordenes</span>
          <b style={{ color }}>C$ {formatMoney(monto)}</b>
        </p>

        <p className={styles.cardFlete}>
          <span>Flete</span>
          <b style={{ color }}>C$ {formatMoney(flete)}</b>
        </p>
      </div>
    </div>
  );
}
