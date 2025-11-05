"use client";
import { useState } from "react";
import Card from "./Card";
import styles from "./MontoFacturacion.module.css";

export default function MontoFacturacion({ data, tipoCambio = 36.62, iva = 0.15 }) {
  const [enDolares, setEnDolares] = useState(false); // Estado para moneda
  const [conIva, setConIva] = useState(true); // Estado para mostrar con/sin IVA

  // 🔹 Función para formatear los montos según moneda y si tiene IVA
  const formatoMoneda = (valor) => {
    let monto = Number(valor || 0);

    // Si el usuario elige SIN IVA, le quitamos el porcentaje
    if (!conIva) monto = monto / (1 + iva);

    // Convertir a dólares si aplica
    if (enDolares) {
      monto = monto / tipoCambio;
      return `$${monto.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    // Mostrar en córdobas
    return `C$${monto.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Facturación</h2>

      {/* 🔹 Botones para alternar moneda e IVA */}
      <div className={styles.botones}>
        <button
          className={styles.toggleButton}
          onClick={() => setEnDolares(!enDolares)}
        >
          Mostrar en {enDolares ? "Córdobas" : "Dólares"}
        </button>

        <button
          className={styles.toggleButton}
          onClick={() => setConIva(!conIva)}
        >
          Mostrar {conIva ? "sin IVA" : "con IVA"}
        </button>
      </div>

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
