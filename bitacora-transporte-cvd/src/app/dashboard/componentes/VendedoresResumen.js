"use client";
import { useState } from "react";
import styles from "./VendedoresResumen.module.css";

export default function VendedoresResumen({ vendedores = [], tipoCambio = 36.62 }) {
  const [orden, setOrden] = useState("monto"); // 'monto' o 'cantidad'
  const [enDolares, setEnDolares] = useState(false);
  const [sinIva, setSinIva] = useState(false);

  // 🔹 Función para convertir y formatear los montos
  const formatoMoneda = (valor) => {
    let monto = Number(valor || 0);

    // quitar IVA si está activo (el monto ya tiene IVA)
    if (sinIva) monto = monto / 1.15;

    // convertir a dólares si está activo
    if (enDolares) monto = monto / tipoCambio;

    return `${enDolares ? "$" : "C$"}${monto.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // 🔹 Ordenar datos según la selección
  const sortedData = [...vendedores].sort((a, b) => b[orden] - a[orden]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Desempeño por Vendedor</h2>

        <div className={styles.buttonGroup}>
          {/* 🔘 Ordenar */}
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

          {/* 💵 Cambiar moneda */}
          <button
            className={`${styles.button} ${enDolares ? styles.activeToggle : ""}`}
            onClick={() => setEnDolares(!enDolares)}
          >
            {enDolares ? "Dolares" : "Córdobas"}
          </button>

          {/* 🧾 Mostrar sin IVA */}
          <button
            className={`${styles.button} ${sinIva ? styles.activeToggle : ""}`}
            onClick={() => setSinIva(!sinIva)}
          >
            {sinIva ? "Sin IVA" : "Con IVA"}
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
                <th className="text-right">Cantidad</th>
                <th className="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((v, i) => (
                <tr key={v.id || i}>
                  <td>{i + 1}</td>
                  <td>{v.nombre}</td>
                  <td className="text-right">{v.cantidad}</td>
                  <td className="text-right font-semibold">{formatoMoneda(v.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
