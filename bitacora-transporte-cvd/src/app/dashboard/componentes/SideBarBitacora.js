"use client";
import Link from "next/link";
import ExportDashBoard from "../../componentes/exportarAexcel/ExportDashBoard";
import FiltroFechas from "../componentes/FiltrosFechas";

export default function SidebarBitacora({
  sidebarOpen,
  setSidebarOpen,
  fechaInicio,
  fechaFin,
  setFechaInicio,
  setFechaFin,
  handleFiltrar,
  handleReset,
  vendedor,
  setVendedor,
  data,
}) {
  return (
    <>
      {/* Sidebar principal */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-white p-6 flex flex-col shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
        `}
      >
        {/* Header del sidebar */}
        <div className="flex justify-between items-center mb-6 md:block">
          <h2 className="text-2xl font-bold">Filtros</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white md:hidden transition"
            aria-label="Cerrar filtros"
          >
            ✕
          </button>
        </div>

        {/* Filtro de fechas */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-inner mb-6">
          <FiltroFechas
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            setFechaInicio={setFechaInicio}
            setFechaFin={setFechaFin}
            handleFiltrar={handleFiltrar}
            handleReset={handleReset}
          />
        </div>

        {/* Filtro por vendedor */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Vendedor
          </label>
          <select
            value={vendedor}
            onChange={(e) => setVendedor(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded-md text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="oscar.mojica">Oscar Mojica</option>
            <option value="maria.lopez">María López</option>
            <option value="juan.perez">Juan Pérez</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => handleFiltrar(vendedor)}
            className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-md shadow-md"
          >
            Aplicar filtros
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-700 hover:bg-gray-600 transition text-white py-2 rounded-md shadow-sm"
          >
            Resetear
          </button>
        </div>

        {/* Navegación inferior */}
        <div className="mt-auto flex flex-col gap-3 border-t border-gray-700 pt-4">
          <Link
            href="/"
            className="py-2 px-3 rounded-md hover:bg-gray-700 transition text-gray-300 hover:text-white"
          >
            Inicio
          </Link>
          <Link
            href="../productividad"
            className="py-2 px-3 rounded-md hover:bg-gray-700 transition text-gray-300 hover:text-white"
          >
            Productividad
          </Link>
          <div className="py-2 px-3">
            <ExportDashBoard data={data} />
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
