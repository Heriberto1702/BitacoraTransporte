"use client";
import { useEffect, useState } from "react";
import styles from "./SocialSelling.module.css";

export default function DashboardSocialSelling() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const res = await fetch("/api/vtex/ventas");
        const data = await res.json();
        setVentas(data);
      } catch (error) {
        console.error("Error cargando ventas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  if (loading) return <p className={styles.titulo}>Cargando datos...</p>;
  if (!ventas.length) return <p className={styles.titulo}>No hay datos</p>;

  const IVA = 0.15;

  let totalSSVentas = 0;       // monto total de ventas asistidas
  let totalSSCanceladas = 0;   // monto total de canceladas
  let totalSSOrdenes = 0;      // cantidad total de órdenes social selling

  const resumenPorCodigo = {};

  ventas.forEach((venta) => {
    const utmi = venta.UtmiCampaign?.trim();
    if (!utmi) return; // ignorar ventas sin social selling

    const paymentValue = parseFloat(venta.PaymentValue) || 0;
    const shippingValue = parseFloat(venta.ShippingValue) || 0;
    const netoVenta = paymentValue - shippingValue;
    const status = venta.Status?.toLowerCase();

    // Sumar totales
    totalSSOrdenes += 1;
    totalSSVentas += netoVenta;

    if (status === "cancelado") {
      totalSSCanceladas += netoVenta;
    }

    // Resumen por cada código de UtmiCampaign
    if (!resumenPorCodigo[utmi]) {
      resumenPorCodigo[utmi] = { cantidad: 0, monto: 0 };
    }
    resumenPorCodigo[utmi].cantidad += 1;
    if (status !== "cancelado") {
      resumenPorCodigo[utmi].monto += netoVenta;
    }
  });

  const netoSS = totalSSVentas - totalSSCanceladas;
  const netoSSSinIVA = netoSS / (1 + IVA);

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>📈 Resumen Social Selling</h1>

      <div className={styles.resumen}>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Total de Órdenes SS</p>
          <p className={styles.cardValor}>{totalSSOrdenes}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Monto Total SS (menos envío)</p>
          <p className={styles.cardValor}>C${totalSSVentas.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Monto Canceladas SS</p>
          <p className={styles.cardValor}>C${totalSSCanceladas.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Monto Neto SS (sin IVA)</p>
          <p className={styles.cardValor}>C${netoSSSinIVA.toFixed(2)}</p>
        </div>
      </div>

      <h2 className={styles.titulo}>📌 Detalle por Código</h2>
      <div className={styles.estadoLista}>
        {Object.entries(resumenPorCodigo).map(([codigo, data]) => (
          <div key={codigo} className={styles.estadoItem}>
            <p className={styles.estadoNombre}>{codigo}</p>
            <p className={styles.estadoCantidad}>
              Ventas: {data.cantidad}, Monto: C${data.monto.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
