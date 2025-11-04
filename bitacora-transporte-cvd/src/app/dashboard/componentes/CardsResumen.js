import Card from "./Card";
import styles from "./CardsResumen.module.css";

export default function CardsResumen({ data }) {
  return (
    <div>
      <h2 className={styles.title}>Resumen de Órdenes</h2>
      <div className={styles.grid}>
        <Card titulo="Nuevas" valor={data.nuevas} color="#2980b9" />
        <Card titulo="Refacturadas" valor={data.refacturadas} color="#f1c40f" />
        <Card
          titulo="Envío a Cedis"
          valor={data.enviadasACedis}
          color="#1abc9c"
        />
        <Card titulo="Preparación" valor={data.preparacion} color="#8e44ad" />
        <Card
          titulo="Enviado a Cliente"
          valor={data.enviadoACliente}
          color="#e67e22"
        />
        <Card
          titulo="En espera Caliente"
          valor={data.esperaCaliente}
          color="#c58ebe"
        />
        <Card titulo="Entregadas" valor={data.entregadas} color="#27ae60" />
        <Card titulo="Anuladas" valor={data.Anuladas} color="#c0392b" />
        <Card titulo="Total Registros" valor={data.total} color="#4f46e5" />
      </div>
    </div>
  );
}
