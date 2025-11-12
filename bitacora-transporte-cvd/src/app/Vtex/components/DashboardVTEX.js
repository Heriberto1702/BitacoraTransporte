"use client";
import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

export default function DashboardVTEX() {
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

  let totalOrdenes = ventas.length;
  let montoTotal = 0;
  let montoCanceladas = 0;
  let totalShipping = 0;

  const estados = {};

  ventas.forEach((venta) => {
    const status = venta.Status?.toLowerCase();
    const paymentValue = parseFloat(venta.PaymentValue) || 0;
    const shippingValue = parseFloat(venta.ShippingValue) || 0;

    // Contar por estado
    estados[venta.Status] = (estados[venta.Status] || 0) + 1;

    // Sumar Shipping aparte
    totalShipping += shippingValue;

    // Sumar al monto total (PaymentValue - Shipping)
    montoTotal += paymentValue - shippingValue;

    // Si está cancelada, sumarla a monto canceladas
    if (status === "cancelado") {
      montoCanceladas += paymentValue - shippingValue;
    }
  });

  // Monto neto después de restar canceladas
  const montoNeto = montoTotal - montoCanceladas;

  // Aplicar IVA
  const montoNetoSinIVA = montoNeto / (1 + IVA);

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>📊 Dashboard de VTEX</h1>

      <div className={styles.resumen}>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Total de Órdenes</p>
          <p className={styles.cardValor}>{totalOrdenes}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Monto Total (menos envío)</p>
          <p className={styles.cardValor}>C${montoTotal.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Monto Canceladas</p>
          <p className={styles.cardValor}>C${montoCanceladas.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Monto Neto (menos canceladas, sin IVA)</p>
          <p className={styles.cardValor}>C${montoNetoSinIVA.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardTitulo}>Total Envío</p>
          <p className={styles.cardValor}>C${totalShipping.toFixed(2)}</p>
        </div>
      </div>

      <h2 className={styles.titulo}>📌 Órdenes por Estado</h2>
      <div className={styles.estadoLista}>
        {Object.entries(estados).map(([estado, cantidad]) => (
          <div key={estado} className={styles.estadoItem}>
            <p className={styles.estadoNombre}>{estado}</p>
            <p className={styles.estadoCantidad}>{cantidad}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
