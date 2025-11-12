"use client";
import { useEffect, useState } from "react";
import styles from "./VtexVentas.module.css";

export default function VtexVentas() {
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

  if (loading) return <p className={styles.cargando}>Cargando datos...</p>;
  if (!ventas.length)
    return <p className={styles.noDatos}>No hay datos disponibles.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>📦 Órdenes de VTEX</h1>

      {ventas.map((venta) => (
        <div key={venta.Order} className={styles.ordenCard}>
          {/* Encabezado de la orden */}
          <div className={styles.ordenHeader}>
            <div>
              <p className={styles.ordenNumero}>Orden: {venta.Order}</p>
              <p className={styles.cliente}>
                Cliente: {venta.ClientName} {venta.ClientLastName}
              </p>
              <p className={styles.email}>Email: {venta.Email}</p>
            </div>
            <div className={styles.datosPago}>
              <p className={styles.ciudad}>📍 {venta.City}</p>
              <p className={styles.sistemaPago}>💰 {venta.PaymentSystem}</p>
              <p className={styles.total}>Total: C${venta.PaymentValue}</p>
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className={styles.detalles}>
            <p>
              Estado: <span className={styles.estado}>{venta.Status}</span>
            </p>
            <p>Fecha de creación: {venta.CreationDate}</p>
            <p>UtmiCampaign: {venta.UtmiCampaign}</p>
            <p>Envío: C${venta.ShippingValue}</p>
          </div>

          {/* Lista de SKUs */}
          <div className={styles.skusContainer}>
            <p className={styles.productosTitulo}>Productos:</p>
            {venta.SKUs.map((sku, index) => (
              <div key={index} className={styles.skuCard}>
                <p className={styles.skuNombre}>{sku.SKU_Name}</p>
                <p className={styles.skuCantidad}>
                  Cantidad: {sku.Quantity_SKU}
                </p>
                <p className={styles.skuPrecio}>
                  Precio unitario: C${sku.SKU_Selling_Price}
                </p>
                <p className={styles.skuTotal}>
                  Total SKU: C${sku.SKU_Total_Price}
                </p>
                <a
                  href={sku.SKU_Path || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.skuLink}
                >
                  Ver producto
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
