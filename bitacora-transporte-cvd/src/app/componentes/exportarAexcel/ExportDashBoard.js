import * as XLSX from "xlsx";

// Componente para exportar datos a Excel
function ExportDashBoard({ data }) {
  const handleExport = () => {
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    // 1️⃣ Resumen general
    const resumen = [
      ["Total Registros", data.total],
      ["Entregadas", data.entregadas],
      ["Pendientes", data.pendientes],
      ["Anuladas", data.Anuladas],
      ["Monto total facturado (bruto)", data.montoTotal],
      ["Monto total Anuladas", data.montoTotalAnuladas],
      ["Monto facturado (neto)", data.montoFacturado],
      ["Promedio de Flete", data.montoFlete],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen");

    // 2️⃣ Top tipos de envío
    const tiposEnvio = (data.tipoEnvio || []).map((item) => ({
      Nombre: item.nombre,
      Cantidad: item.cantidad,
      Monto: item.monto,
      Flete: item.totalFlete,
    }));
    const wsEnvio = XLSX.utils.json_to_sheet(tiposEnvio);
    XLSX.utils.book_append_sheet(workbook, wsEnvio, "Tipos de Envío");

    // 3️⃣ Top tiendas Sinsa
    const tiendas = (data.tiendaSinsa || []).map((item) => ({
      Nombre: item.nombre,
      Cantidad: item.cantidad,
    }));
    const wsTiendas = XLSX.utils.json_to_sheet(tiendas);
    XLSX.utils.book_append_sheet(workbook, wsTiendas, "Tiendas Sinsa");

    // 4️⃣ Top Origen de Inventario
    const origen = (data.origenInventario || []).map((item) => ({
      Nombre: item.nombre,
      Cantidad: item.cantidad,
    }));
    const wsOrigen = XLSX.utils.json_to_sheet(origen);
    XLSX.utils.book_append_sheet(workbook, wsOrigen, "Origen Inventario");

    // Guardar archivo
    XLSX.writeFile(workbook, "dashboard_bitacora.xlsx");
  };

  return (
    <button
      onClick={handleExport}
      style={{
        marginTop: "20px",
        padding: "10px 20px",
        backgroundColor: "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Descargar Excel
    </button>
  );
}

export default ExportDashBoard;
