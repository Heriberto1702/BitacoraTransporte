"use client";

import { useState, useRef } from "react";
import BuscadorOrdenes from "../buscador/BuscadorOrdenes";
import RegistrarOrden from "../Registrocompra/Registrocompra";

export default function OrdenesManager({ session }) {
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const buscadorRef = useRef(null);

  const handleFinish = () => {
    setOrdenSeleccionada(null);
    if (buscadorRef.current?.limpiarFilaSeleccionada) {
      buscadorRef.current.limpiarFilaSeleccionada();
    }
  };

  
  const handleActualizado = () => {
    if (buscadorRef.current?.recargarOrdenes) {
      buscadorRef.current.recargarOrdenes();
    }
    if (buscadorRef.current?.limpiarFilaSeleccionada) {
      buscadorRef.current.limpiarFilaSeleccionada();
    }
  };

  return (
    <div>
      <RegistrarOrden
        session={session}
        ordenSeleccionada={ordenSeleccionada}
        onFinish={handleFinish}
        onActualizado={handleActualizado}
      />
      <BuscadorOrdenes
        ref={buscadorRef}
        session={session}
        onEditar={setOrdenSeleccionada}
      />
    </div>
  );
}
