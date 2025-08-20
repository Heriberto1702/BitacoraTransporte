"use client";
import { useState } from "react";
import BuscadorOrdenes from "../buscador/BuscadorOrdenes";
import RegistrarOrden from "../Registrocompra/Registrocompra";

export default function OrdenesManager({ session }) {
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const handleFinish = () => {
    setOrdenSeleccionada(null);
  };

  return (
    <div>
      <RegistrarOrden
        session={session} // <-- Le pasamos la sesión
        ordenSeleccionada={ordenSeleccionada}
        onFinish={handleFinish}
      />
      <BuscadorOrdenes 
      session={session} 
      onEditar={setOrdenSeleccionada} 
      />
    </div>
  );
}
