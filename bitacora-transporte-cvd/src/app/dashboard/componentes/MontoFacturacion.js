"use client";
import { useState } from "react";
import Card from "./Card";
import styles from "./MontoFacturacion.module.css";

export default function MontoFacturacion({
  data,
  tipoCambio = 36.62,
  iva = 0.15,
}) {
  const [enDolares, setEnDolares] = useState(false); // Estado para moneda
  const [conIva, setConIva] = useState(true); // Estado para mostrar con/sin IVA

  // 🔹 Función para formatear los montos según moneda y si tiene IVA
  const formatoMoneda = (
    valor,
    aplicarIva = false,
    aplicarIva2 = false,
    aplicarIva3 = false,
  ) => {
    let monto = Number(valor || 0);

    // Si el usuario elige SIN IVA, le quitamos el porcentaje
    if (aplicarIva && !conIva) {
      monto =
        (monto - data.montoFlete - data.montoFleteWeb) / (1 + iva) +
        data.montoFlete +
        data.montoFleteWeb;
    }
    if (aplicarIva2 && !conIva) {
      monto =
        (monto - data.fletetotal - data.fletetotalweb) / (1 + iva) +
        data.fletetotal +
        data.fletetotalweb;
    }
    if (aplicarIva3 && !conIva) {
      monto =
        (monto - data.montoFleteRefacturadasTotal) / (1 + iva) +
        data.montoFleteRefacturadasTotal;
    }
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
        <Card
          titulo="Monto bruto facturado"
          valor={formatoMoneda(data.montoTotal, true)}
        />
        <Card
          titulo="Monto total Anuladas"
          valor={formatoMoneda(data.montoTotalAnuladas)}
          color="#ef4444"
        />
        <Card
          titulo="Monto devoluciones parciales"
          valor={formatoMoneda(data.montoDevolucion)}
          color="#ef4444"
        />
        <Card
          titulo={
            data.montototalanulaciones >= 0
              ? "Monto total recuperado"
              : "Monto total perdido"
          }
          valor={formatoMoneda(data.montototalanulaciones)}
          color={data.montototalanulaciones >= 0 ? "#22c55e" : "#ef4444"}
        />
        <Card
          titulo="Monto Refacturado"
          valor={formatoMoneda(data.montoRefacturadas, false, false, true)}
          color="#f59e0b"
        />
        <Card
          titulo="Monto facturado (neto)"
          valor={formatoMoneda(data.montoFacturado, false, true)}
          color="#22c55e"
        />
        <Card titulo="Monto Flete" valor={formatoMoneda(data.fletetotal)} />
        <Card
          titulo="Monto Flete Web"
          valor={formatoMoneda(data.fletetotalweb)}
        />
      </div>
    </div>
  );
}
