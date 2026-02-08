"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./VentasDiariasChart.module.css";

export default function VentasDiariasChart({ data = [], tipoCambio = 36.62 }) {
  const [enDolares, setEnDolares] = useState(false);
  const [inicioCompare, setInicioCompare] = useState("");
  const [finCompare, setFinCompare] = useState("");
  const [dataComparacion, setDataComparacion] = useState([]);

  const factor = enDolares ? 1 / tipoCambio : 1;

  const dataUnificada = useMemo(() => {
    const factorLocal = enDolares ? 1 / tipoCambio : 1;
    const maxLength = Math.max(data.length, dataComparacion.length);

    const resultado = [];

    for (let i = 0; i < maxLength; i++) {
      resultado.push({
        dia: i + 1,
        base: data[i]?.total ? data[i].total * factorLocal : null,
        comparado: dataComparacion[i]?.total
          ? dataComparacion[i].total * factorLocal
          : null,
      });
    }

    return resultado;
  }, [data, dataComparacion, enDolares, tipoCambio]);

  const cargarComparacion = async () => {
    if (!inicioCompare || !finCompare) return;

    const res = await fetch(
      `/api/bitacora/estadisticas?inicio=${inicioCompare}&fin=${finCompare}`
    );
    const json = await res.json();

    setDataComparacion(json.ventasDiarias || []);
  };

  const quitarComparacion = () => {
    setDataComparacion([]);
    setInicioCompare("");
    setFinCompare("");
  };

  if (!data.length) return null;

  return (
    <div className={styles.chartContainer}>
      {/* Header */}
      <div className={styles.chartheader}>
        <h3>Ventas diarias</h3>

        <div className={styles.buttons}>
          <button onClick={() => setEnDolares(!enDolares)}>
            {enDolares ? "Ver en C$" : "Ver en $"}
          </button>

          {dataComparacion.length > 0 && (
            <button className={styles.remove} onClick={quitarComparacion}>
              Quitar comparación
            </button>
          )}
        </div>
      </div>

      {/* Comparar fechas */}
      <div className={styles.chartcomparison}>
        <input
          type="date"
          value={inicioCompare}
          onChange={(e) => setInicioCompare(e.target.value)}
        />
        <input
          type="date"
          value={finCompare}
          onChange={(e) => setFinCompare(e.target.value)}
        />
        <button onClick={cargarComparacion}>Comparar</button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataUnificada}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="dia"
            label={{ value: "Día del mes", position: "insideBottom", offset: -5 }}
          />
          <YAxis />

          <Tooltip
            formatter={(value) =>
              value == null
                ? "—"
                : `${enDolares ? "$" : "C$"}${Number(value).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}`
            }
          />

          <Legend />

          {/* Línea periodo actual */}
          <Line
            type="monotone"
            dataKey="base"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Periodo actual"
          />

          {/* Línea periodo comparado */}
          {dataComparacion.length > 0 && (
            <Line
              type="monotone"
              dataKey="comparado"
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Periodo comparado"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
