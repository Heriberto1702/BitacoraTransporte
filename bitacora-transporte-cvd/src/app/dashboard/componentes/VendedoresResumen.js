"use client";
import { useState } from "react";
import styles from "./VendedoresResumen.module.css";

export default function VendedoresResumen({
  vendedores = [],
  tipoCambio = 36.62,
}) {
  const [orden, setOrden] = useState("monto");
  const [enDolares, setEnDolares] = useState(false);
  const [sinIva, setSinIva] = useState(false);

  // 👉 SOLO formato moneda + dólares
  const formatoMoneda = (valor) => {
    let monto = Number(valor || 0);

    if (enDolares) monto = monto / tipoCambio;

    return `${enDolares ? "$" : "C$"}${monto.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // 👉 cálculo real del monto (aquí vive el IVA)
  const calcularMontoTotal = (monto, flete, fleteWeb) => {
    let total = Number(monto || 0);
    const totalFletes = Number(flete || 0) + Number(fleteWeb || 0);

    if (sinIva) {
      total = (total - totalFletes) / 1.15 + totalFletes;
    }

    return total;
  };

  const sortedData = [...vendedores].sort((a, b) => b[orden] - a[orden]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Desempeño por Vendedor</h2>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${orden === "monto" ? styles.active : ""}`}
            onClick={() => setOrden("monto")}
          >
            Ordenar por Monto
          </button>

          <button
            className={`${styles.button} ${orden === "cantidad" ? styles.active : ""}`}
            onClick={() => setOrden("cantidad")}
          >
            Ordenar por Cantidad
          </button>

          <button
            className={`${styles.button} ${enDolares ? styles.activeToggle : ""}`}
            onClick={() => setEnDolares(!enDolares)}
          >
            {enDolares ? "Montos en Dólares" : "Montos en Córdobas"}
          </button>

          <button
            className={`${styles.button} ${sinIva ? styles.activeToggle : ""}`}
            onClick={() => setSinIva(!sinIva)}
          >
            {sinIva ? "Montos sin IVA" : "Montos con IVA"}
          </button>
        </div>
      </div>

      {sortedData.length === 0 ? (
        <p className={styles.empty}>No hay registros disponibles.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Vendedor</th>
                <th>Cantidad</th>
                <th>Flete</th>
                <th>Flete Web</th>
                <th>Dev. Parcial</th>
                <th>Monto</th>
              </tr>
            </thead>

            <tbody>
              {sortedData.map((v, i) => {
                const montoFinal = calcularMontoTotal(v.monto, v.flete, v.fleteWeb);

                return (
                  <tr key={v.id || i}>
                    <td>{i + 1}</td>
                    <td>{v.nombre}</td>
                    <td>{v.cantidad}</td>

                    <td className={Number(v.flete) !== 0 ? styles.resaltado : ""}>
                      {formatoMoneda(v.flete)}
                    </td>

                    <td className={Number(v.fleteWeb) !== 0 ? styles.resaltado : ""}>
                      {formatoMoneda(v.fleteWeb)}
                    </td>

                    <td className={Number(v.devolucion) !== 0 ? styles.resaltado : ""}>
                      {formatoMoneda(v.devolucion)}
                    </td>

                    <td className="font-semibold">
                      {formatoMoneda(montoFinal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
