import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    // Hacemos una consulta muy simple
    const count = await prisma.registroBitacora.count();
    
    return NextResponse.json({
      success: true,
      message: "Conexión a la base de datos OK",
      registros: count,
    });
  } catch (error) {
    console.error("Error conectando a DB:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo conectar a la base de datos", error: error.message },
      { status: 500 }
    );
  }
}
