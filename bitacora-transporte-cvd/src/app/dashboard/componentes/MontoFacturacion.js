"use client";
import { useState } from "react";
import Card from "./Card";
import styles from "./MontoFacturacion.module.css";

export default function MontoFacturacion({ data, tipoCambio = 36.62 }) {
  const [enDolares, setEnDolares] = useState(false); // 🟢 Estado para la moneda

  // 🔹 Función para formatear los números según la moneda
  const formatoMoneda = (valor) => {
    const monto = Number(valor || 0);
    if (enDolares) {
      return `$${(monto / tipoCambio).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      return `C$${monto.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Facturación</h2>

      {/* 🔹 Botón para cambiar moneda */}
      <button
        className={styles.toggleButton}
        onClick={() => setEnDolares(!enDolares)}
      >
        Mostrar en {enDolares ? "Córdobas" : "Dólares"}
      </button>

      <div className={styles.subcontainer}>
        <Card titulo="Monto total facturado (bruto)" valor={formatoMoneda(data.montoTotalTotal)} />
        <Card
          titulo="Monto total Anuladas"
          valor={formatoMoneda(data.montoTotalAnuladas)}
          color="#ef4444"
        />
        <Card 
          titulo="Monto de devoluciones"
          valor={formatoMoneda(data.montoDevolucion)}
          color="#ef4444"
        />
        <Card
          titulo="Monto Refacturado"
          valor={formatoMoneda(data.montoRefacturadas)}
          color="#f59e0b"
        />
        <Card
          titulo="Monto facturado (neto)"
          valor={formatoMoneda(data.montoFacturado)}
          color="#22c55e"
        />
        <Card titulo="Monto Flete" valor={formatoMoneda(data.montoFlete)} />
      </div>
    </div>
  );
}
