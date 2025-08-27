"use client";

import { useState, useRef } from "react";
import BuscadorOrdenes from "../buscador/BuscadorOrdenes";
import RegistrarOrden from "../Registrocompra/Registrocompra";

export default function OrdenesManager({ session }) {
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // 🔹 Ref para recargar órdenes desde el formulario
  const buscadorRef = useRef(null);

  const handleFinish = () => {
    setOrdenSeleccionada(null);
  };

  const handleActualizado = () => {
    if (buscadorRef.current?.recargarOrdenes) {
      buscadorRef.current.recargarOrdenes();
    }
  };

  return (
    <div>
      <RegistrarOrden
        session={session}
        ordenSeleccionada={ordenSeleccionada}
        onFinish={handleFinish}
        onActualizado={handleActualizado} // 🔹 recarga tabla
      />
      <BuscadorOrdenes
        ref={buscadorRef}
        session={session}
        onEditar={setOrdenSeleccionada}
      />
    </div>
  );
}
