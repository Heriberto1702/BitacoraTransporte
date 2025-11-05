import Card from "./Card";
import styles from "./CardsResumen.module.css";

export default function CardsResumen({ data }) {
  return (
    <div>
      <h2 className={styles.title}>Resumen de Órdenes</h2>
      <div className={styles.grid}>
        <Card titulo="Nuevas" valor={data.nuevas} />
        <Card titulo="Refacturadas" valor={data.refacturadas} />
        <Card titulo="Envío a Cedis" valor={data.enviadasACedis} />
        <Card titulo="Preparación" valor={data.preparacion} />
        <Card titulo="Enviado a Cliente" valor={data.enviadoACliente} />
        <Card titulo="En espera Caliente" valor={data.esperaCaliente} />
        <Card titulo="Entregadas" valor={data.entregadas} />
        <Card titulo="Anuladas" valor={data.Anuladas} />
        <Card titulo="Total Registros" valor={data.total} />
      </div>
    </div>
  );
}
