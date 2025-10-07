"use client";
import * as XLSX from "xlsx";

export default function ExportarExcel({ data, fileName = "ordenes.xlsx" }) {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // 🔹 Mapear datos para que tengan encabezados claros
    const datosFormateados = data.map((orden) => ({
      "N° Ticket": orden.num_ticket,
      "Vendedor": orden.login?.nombre_vendedor || "-",
      "Cliente": orden.nombre_cliente,
      "Dirección": orden.direccion_entrega,
      "Tienda Sinsa": orden.tiendasinsa?.nombre_tiendasinsa || "-",
      "Inventario": orden.origen_inventario?.nombre_origen || "-",
      "Tienda": orden.tienda?.nombre_tienda || "-",
      "Tipo Envío": orden.tipoenvio?.nombre_Tipo || "-",
      "Tipo Pago": orden.tipopago?.nombre_tipopago || "-",
      "Fecha creación": new Date(orden.fecha_creacion).toLocaleDateString("es-ES"),
  
    }));

    // 1. Convertir JSON a hoja Excel
    const worksheet = XLSX.utils.json_to_sheet(datosFormateados);

    // 2. Crear libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Órdenes");

    // 3. Descargar archivo
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <button
      onClick={exportToExcel}
      style={{
        padding: "8px 16px",
        backgroundColor: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        marginBottom: "15px",
      }}
    >
      📑 Exportar a Excel
    </button>
  );
}
