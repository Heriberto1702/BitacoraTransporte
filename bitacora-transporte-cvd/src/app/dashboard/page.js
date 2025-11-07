"use client";
import { useState } from "react";
import useBitacoraData from "./hooks/useBitacoraData";
import CardsResumen from "../dashboard/componentes/CardsResumen";
import MontoFacturacion from "../dashboard/componentes/MontoFacturacion";
import GraficoEstado from "../dashboard/componentes/GraficoEstado";
import TopTipoEnvio from "../dashboard/componentes/TopTipoEnvio";
import TopTiendas from "../dashboard/componentes/TopTiendas";
import TopOrigenInventario from "../dashboard/componentes/TopOrigenInventario";
import VendedoresResumen from "../dashboard/componentes/VendedoresResumen";
import FiltroFechas from "../dashboard/componentes/FiltrosFechas";
import ExportDashBoard from "../componentes/exportarAexcel/ExportDashBoard";
import Link from "next/link";
import "./pageModule.css"; // Creamos un CSS separado

export default function DashboardBitacora() {
  const {
    data,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    handleFiltrar,
    handleResetMesActual,
  } = useBitacoraData();

  const [vendedor, setVendedor] = useState("");

  if (!data) return <div className="loading">Cargando estadísticas...</div>;

  return (
    <div className="dashboard-container">
      {/* Barra lateral */}
      <aside className="sidebar">
        <h2>Panel Bitácora</h2>

        <div className="filtros">
          <FiltroFechas
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            setFechaInicio={setFechaInicio}
            setFechaFin={setFechaFin}
            handleReset={handleResetMesActual}
          />

<select value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
  <option value="">Todos</option>
  {(data.vendedores || []).map((v) => (
    <option key={v.id_login} value={v.id_login}>
      {v.nombre}
    </option>
  ))}
</select>

          <div className="botones">
            <button onClick={() => handleFiltrar(vendedor)}>
              Aplicar filtros
            </button>
            <button onClick={handleResetMesActual}>Resetear</button>
          </div>
        </div>

        <div className="links">
          <Link href="/">Inicio</Link>
          <Link href="../productividad">Productividad</Link>
          <ExportDashBoard data={data} />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        <header>
          {vendedor && (
            <span>
              Mostrando datos de: <b>{vendedor}</b>
            </span>
          )}
        </header>

        <section className="cards-resumen">
          <CardsResumen data={data} />
        </section>

        <section className="montos">
          <MontoFacturacion data={data} />
        </section>

        <section className="graficos">
          <GraficoEstado data={data} />
        </section>

        <section className="otros-tops">
          <VendedoresResumen vendedores={data.vendedores} />
          <section className="otros-tops-column">
          <TopTipoEnvio data={data} />
          <TopTiendas data={data} />
          <TopOrigenInventario data={data} />
          </section>
          
        </section>

        <section className="otros-tops">
          
        </section>
      </main>
    </div>
  );
}
