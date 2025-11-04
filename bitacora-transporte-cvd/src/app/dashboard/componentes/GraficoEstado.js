"use client";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./GraficoEstadoPie.module.css";

export default function GraficoEstadoPie({ data }) {
  const chartData = [
    { estado: "Nuevas", total: data.nuevas },
    { estado: "Refacturadas", total: data.refacturadas },
    { estado: "Envío a Cedis", total: data.enviadasACedis },
    { estado: "Preparación", total: data.preparacion },
    { estado: "Enviado a Cliente", total: data.enviadoACliente },
    { estado: "En espera Caliente", total: data.esperaCaliente },
    { estado: "Anuladas", total: data.Anuladas },
    { estado: "Entregadas", total: data.entregadas },
  ];

  const colors = [
    "#2980b9",
    "#f1c40f",
    "#1abc9c",
    "#8b5cf6",
    "#e67e22",
    "#c58ebe",
    "#c0392b",
    "#10b981",
  ];

  const renderLegend = () => (
    <div className={styles.legend}>
      {chartData.map((entry, index) => (
        <div key={index} className={styles.legendItem}>
          <div
            className={styles.legendColor}
            style={{ backgroundColor: colors[index % colors.length] }}
          />
          <span className={styles.legendText}>{entry.estado}</span>
        </div>
      ))}
    </div>
  );

  const renderLabel = ({ cx, cy, midAngle, outerRadius, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#333"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className={styles.label}
      >
        {chartData[index].total}
      </text>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Órdenes por Estado</h2>
      <ResponsiveContainer width="100%" height={450}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="estado"
            cx="50%"
            cy="50%"
            outerRadius={150}
            innerRadius={60}
            paddingAngle={3}
            label={renderLabel}
            labelLine={true}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 14, borderRadius: 8 }} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
