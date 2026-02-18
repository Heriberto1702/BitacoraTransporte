import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "vtexpedidos",
    });

    const values = res.data.values || [];
    const [headers, ...rows] = values;

    if (!headers || headers.length === 0) {
      return NextResponse.json({ error: "No hay encabezados en la hoja" }, { status: 400 });
    }

    // Convertir filas en objetos
    const ventas = rows.map((row) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i] || ""));
      return obj;
    });

    // Agrupar por orden
    const agrupado = ventas.reduce((acc, venta) => {
      const orderId = venta["Order"];
      if (!orderId) return acc;

      const status = venta["Status"]?.toLowerCase();
      const isCanceled = status === "Cancelado";

      if (!acc[orderId]) {
        acc[orderId] = {
          Order: orderId,
          ClientName: venta["Client Name"],
          ClientLastName: venta["Client Last Name"],
          Email: venta["Email"],
          Phone: venta["Phone"],
          City: venta["City"],
          Address: venta["Street"],
          Status: venta["Status"],
          CreationDate: venta["Creation Date"],
          PaymentSystem: venta["Payment System Name"],
          PaymentValue: parseFloat(venta["Payment Value"]) || 0,
          UtmiCampaign: venta["UtmiCampaign"],
          ShippingValue: 0,
          SKUs: [],
          CanceledAmount: 0,
        };
      }

      const skuTotalValue = parseFloat(venta["Payment Value"]) || 0;
      const skuShipping = parseFloat(venta["Shipping Value"]) || 0;

      acc[orderId].SKUs.push({
        SKU: venta["SKU Name"],
        ID_SKU: venta["ID_SKU"],
        SKU_Name: venta["SKU Name"],
        SKU_Value: parseFloat(venta["SKU Value"]) || 0,
        SKU_Selling_Price: parseFloat(venta["SKU Selling Price"]) || 0,
        SKU_Total_Price: parseFloat(venta["SKU Total Price"]) || 0,
        Quantity_SKU: parseInt(venta["Quantity_SKU"]) || 0,
        SKU_Path: venta["SKU Path"]
          ? `https://www.sinsa.com.ni${venta["SKU Path"]}`
          : "",
        ShippingValue: skuShipping,
      });

      if (isCanceled) {
        acc[orderId].CanceledAmount += skuTotalValue;
      } else {
        acc[orderId].ShippingValue += skuShipping;
      }

      return acc;
    }, {});

    return NextResponse.json(Object.values(agrupado));
  } catch (error) {
    console.error("❌ Error leyendo Google Sheets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
