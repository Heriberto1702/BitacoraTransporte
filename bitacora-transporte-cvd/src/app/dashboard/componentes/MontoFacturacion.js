"use client";
import Card from "./Card";
import styles from "./MontoFacturacion.module.css";

export default function MontoFacturacion({ data }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Facturación</h2>
      <div className={styles.subcontainer}>
        <Card
          titulo="Monto total facturado (bruto)"
          valor={`C$${Number(data.montoTotal || 0).toFixed(2)}`}
        />
        <Card
          titulo="Monto total Anuladas"
          valor={`C$${Number(data.montoTotalAnuladas || 0).toFixed(2)}`}
          color="#ef4444"
        />
        <Card
          titulo="Monto facturado (neto)"
          valor={`C$${Number(data.montoFacturado || 0).toFixed(2)}`}
          color="#22c55e"
        />
        <Card
          titulo="Monto Flete"
          valor={`C$${Number(data.montoFlete || 0).toFixed(2)}`}
        />
      </div>
    </div>
  );
}
