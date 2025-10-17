"use client";

import { useEffect, useState } from "react";
import styles from "./Registrocompra.module.css";

const estadoInicial = {
  id_registro: null,
  num_ticket: "",
  nombre_cliente: "",
  direccion_entrega: "",
  flete: "",
  fecha_entrega: "",
  id_tipenvio: "",
  id_originventario: "",
  id_tienda: "",
  id_tipopago: "",
  id_tiendasinsa: "",
  observacion: "",
  id_estado: "", // ahora es id_estado
  id_agente: "", // agente asignado
  monto_factura: "",
  cedula: "",
  telefono: "",
  tipo_identificacion: "", // nuevo campo
};

// Función para formatear cédula automáticamente
function formatCedula(value) {
  let raw = value.toUpperCase();

  let letter = "";
  if (raw.length > 15) {
    const lastChar = raw[raw.length - 1];
    if (/[A-Z]/.test(lastChar)) {
      letter = lastChar;
    }
  }

  raw = raw.slice(0, 15).replace(/\D/g, "");

  const block1 = raw.slice(0, 3);
  const block2 = raw.slice(3, 9);
  const block3 = raw.slice(9, 13);

  let result = "";
  if (block1) result += block1;
  if (block2) result += `-${block2}`;
  if (block3) result += `-${block3}`;

  if (letter) result += letter;

  return result;
}
// Función para formatear RUC automáticamente
function formatRuc(value) {
  // Convertir a mayúscula y eliminar todo lo que no sea dígito o letra
  let raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // El primer carácter debe ser letra (si no, lo ignoramos)
  let result = "";
  const firstChar = raw.charAt(0);
  if (/[A-Z]/.test(firstChar)) {
    result = firstChar;
  }

  // Tomamos hasta 13 dígitos después de la letra
  const digits = raw.slice(1).replace(/\D/g, "").slice(0, 13);
  result += digits;

  return result;
}
export default function RegistrarOrden({
  session,
  ordenSeleccionada,
  onFinish,
  onActualizado,
}) {
  const [formData, setFormData] = useState(estadoInicial);
  const [catalogos, setCatalogos] = useState({
    tiendas: [],
    envios: [],
    origenes: [],
    pagos: [],
    tiendasinsa: [],
    agente: [],
    estados: [],
    transiciones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activarDireccion, setActivarDireccion] = useState(false);
  const [activarTiendaSinsa, setActivarTiendaSinsa] = useState(false);
  const [estadoTemporal, setEstadoTemporal] = useState("");
  const [abierto, setAbierto] = useState(false);
  const rolUsuario = session?.user?.rol || "usuario";
  const soloLectura = rolUsuario === "agente";
  useEffect(() => {
    async function fetchCatalogos() {
      try {
        setLoading(true);

        const res = await fetch("/api/catalogos/todos");
        if (!res.ok) throw new Error("Error al cargar catálogos");

        const data = await res.json();

        setCatalogos({
          tiendas: data.tiendas || [],
          envios: data.envios || [],
          origenes: data.origenes || [],
          pagos: data.pagos || [],
          tiendasinsa: data.tiendasinsa || [],
          agente: data.agente || [],
          estados: data.estados || [],
          transiciones: data.transiciones || [],
        });
      } catch (err) {
        console.error(err);
        setError("Estamos teniendo problemas para conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }

    fetchCatalogos();
  }, []);

  useEffect(() => {
    if (!ordenSeleccionada) {
      setFormData(estadoInicial);
      setEstadoTemporal(""); // ← reset temporal
      return;
    }

    const merged = {
      ...estadoInicial,
      ...ordenSeleccionada,
      id_tipenvio: ordenSeleccionada.id_tipenvio?.toString() ?? "",
      id_originventario: ordenSeleccionada.id_originventario?.toString() ?? "",
      id_tienda: ordenSeleccionada.id_tienda?.toString() ?? "",
      id_tipopago: ordenSeleccionada.id_tipopago?.toString() ?? "",
      id_tiendasinsa: ordenSeleccionada.tiendasinsa?.nombre_tiendasinsa ?? "",
fecha_entrega: ordenSeleccionada.fecha_entrega
  ? new Date(ordenSeleccionada.fecha_entrega)
      .toLocaleDateString("en-CA") // formato YYYY-MM-DD compatible con <input type="date">
  : "",
      monto_factura:
        ordenSeleccionada.monto_factura !== null &&
        ordenSeleccionada.monto_factura !== undefined
          ? String(ordenSeleccionada.monto_factura)
          : "",
      tipo_identificacion:
        ordenSeleccionada.tipo_identificacion ||
        estadoInicial.tipo_identificacion,

      id_estado: ordenSeleccionada.id_estado?.toString() ?? "",
      id_agente: ordenSeleccionada.id_agente?.toString() ?? "",
    };

    const limpio = Object.fromEntries(
      Object.entries(merged).map(([k, v]) =>
        k === "tipo_identificacion" ? [k, v] : [k, v ?? ""]
      )
    );

    setFormData(limpio);
    setEstadoTemporal(ordenSeleccionada.id_estado?.toString() ?? ""); // <--- nuevo
  }, [ordenSeleccionada]);

  useEffect(() => {
    if (!ordenSeleccionada) {
      if (["1", "5", "6", "7"].includes(formData.id_tipenvio)) {
        setActivarDireccion(true);
        setActivarTiendaSinsa(false);
      } else if (["4"].includes(formData.id_tipenvio)) {
        setActivarDireccion(false);
        setActivarTiendaSinsa(true);
      } else if (["2"].includes(formData.id_tipenvio)) {
        setActivarDireccion(true);
        setActivarTiendaSinsa(true);
      } else {
        setActivarDireccion(false);
        setActivarTiendaSinsa(false);
      }
    }
  }, [formData.id_tipenvio, ordenSeleccionada]);
  const handleToggle = () => {
    setAbierto((prev) => !prev);
  };
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["num_ticket", "telefono"].includes(name)) {
      const soloNumeros = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: soloNumeros });
      return;
    }

    if (["monto_factura", "flete"].includes(name)) {
      let soloNumerosYDecimal = value.replace(/[^0-9.]/g, "");
      const partes = soloNumerosYDecimal.split(".");
      if (partes.length > 2) {
        soloNumerosYDecimal = partes[0] + "." + partes[1];
      }
      setFormData({ ...formData, [name]: soloNumerosYDecimal });
      return;
    }

    if (name === "cedula") {
      if (formData.tipo_identificacion === "cedula") {
        setFormData({ ...formData, [name]: formatCedula(value) });
      } else if (formData.tipo_identificacion === "ruc") {
        setFormData({ ...formData, [name]: formatRuc(value) });
      } else {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }

    if (name === "tipo_identificacion") {
      setFormData({ ...formData, tipo_identificacion: value, cedula: "" });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleLimpiar = () => {
    setFormData(estadoInicial);
    setActivarDireccion(false);
    setActivarTiendaSinsa(false);
    if (onFinish) onFinish();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.direccion_entrega &&
      formData.direccion_entrega.trim().length < 20
    ) {
      alert("La dirección de entrega debe tener al menos 20 caracteres.");
      return;
    }

    if (formData.tipo_identificacion === "cedula") {
      const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
      if (!cedulaRegex.test(formData.cedula)) {
        alert("La cédula debe tener el formato 001-210995-0038W");
        return;
      }
    } else if (formData.tipo_identificacion === "ruc") {
      const rucRegex = /^[A-Z]{1}[0-9]{13}$/;
      if (!rucRegex.test(formData.cedula)) {
        alert("El RUC debe tener el formato J0310000003456");
        return;
      }
    }

    const tiendaSinsaObj = catalogos.tiendasinsa.find(
      (t) => t.nombre_tiendasinsa === formData.id_tiendasinsa
    );
    const id_tiendasinsa = tiendaSinsaObj
      ? tiendaSinsaObj.id_tiendasinsa
      : null;

    const payload = {
      ...formData,
      id_estado: estadoTemporal, // <--- ✅ usar el temporal al guardar
      num_ticket: parseInt(formData.num_ticket),
      flete: formData.flete ? parseInt(formData.flete) : null,
      monto_factura: parseFloat(formData.monto_factura),
      id_tiendasinsa,
    };

    const isActualizar =
      formData.id_registro != null && formData.id_registro !== "";

    const url = isActualizar
      ? "/api/bitacora/actualizar"
      : "/api/bitacora/crear";
    const method = isActualizar ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.error) alert(result.error);
        else alert("Error guardando la orden");
        return;
      }

      alert(
        formData.id_registro
          ? "Orden actualizada con éxito"
          : "Orden registrada con éxito"
      );
      handleLimpiar();
      if (onActualizado) onActualizado();
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className={styles.errorMessage}>{error}</p>;

  const tieneDatos = Object.entries(formData).some(([key, value]) => {
    // Excluir campos con valor inicial fijo
    if (key === "estado" || key === "tipo_identificacion") return false;

    // Considerar llenado solo si no está vacío
    return value && value !== "";
  });
  function obtenerEstadosPermitidos(id_estado_actual) {
    if (!id_estado_actual) {
      // Si es creación o no hay estado aún, los vendedores solo pueden Nueva o Refacturada
      if (rolUsuario === "vendedor") {
        return catalogos.estados.filter(
          (e) => e.id_estado === 1 || e.id_estado === 2
        );
      }
      if (rolUsuario === "admin") {
        return catalogos.estados.filter(
          (e) =>
            e.id_estado === 1 ||
            e.id_estado === 2 ||
            e.id_estado === 3 ||
            e.id_estado === 4 ||
            e.id_estado === 7 ||
            e.id_estado === 8
        );
      }
      if (rolUsuario === "agente") {
        return catalogos.estados.filter(
          (e) => e.id_estado === 5 || e.id_estado === 6 || e.id_estado === 7
        );
      }
      return catalogos.estados;
    }

    // Para edición: filtrar transiciones válidas según rol
    const idsPermitidos = catalogos.transiciones
      .filter(
        (t) =>
          t.estado_origen === Number(id_estado_actual) && t.rol === rolUsuario
      )
      .map((t) => t.estado_destino);

    // Siempre incluir el estado actual
    return catalogos.estados.filter(
      (e) =>
        e.id_estado === Number(id_estado_actual) ||
        idsPermitidos.includes(e.id_estado)
    );
  }
  return (
    <div className={styles.accordionContainer}>
      {/* Botón para abrir/cerrar */}
      <button
        type="button"
        onClick={handleToggle}
        className={`${styles.accordionButton} ${abierto ? styles.abierto : ""}`}
      >
        {abierto ? "Ocultar Formulario" : "Mostrar Formulario"} <span>+</span>
      </button>

      {/* Contenedor con animación tipo cortina */}
      <div
        className={`${styles.accordionContent} ${
          abierto ? styles.abierto : ""
        }`}
      >
        {abierto && (
          <form onSubmit={handleSubmit} className={styles.formContainer}>
            <h2 className={styles.title}>
              {formData.id_registro
                ? "Editar Orden de Compra"
                : "Registrar Orden de Compra"}
            </h2>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* Datos de la Orden */}
            <fieldset className={styles.section}>
              <legend>Datos de la Orden</legend>
              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Tienda
                  </label>
                  <select
                    name="id_tienda"
                    value={formData.id_tienda}
                    onChange={(e) => {
                      if (!soloLectura) handleChange(e);
                    }}
                    className={styles.select}
                    required
                  >
                    <option value="">Seleccione una tienda</option>
                    {catalogos.tiendas.map((t) => (
                      <option key={t.id_tienda} value={t.id_tienda}>
                        {t.nombre_tienda}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Ticket
                  </label>
                  <input
                    type="text"
                    name="num_ticket"
                    value={formData.num_ticket}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    className={styles.input}
                    placeholder="Número de ticket"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Nombre Cliente
                  </label>
                  <input
                    type="text"
                    name="nombre_cliente"
                    value={formData.nombre_cliente}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    placeholder="Nombre completo"
                    className={styles.input}
                    required
                  />
                </div>

                {/* Tipo Identificación */}
                <div className={styles.formGroup}>
                  <div className={styles.formRadioGroup}>
                    <label
                      className={`${styles.label} ${styles.requiredLabel}`}
                    >
                      Identificación
                    </label>
                    <div>
                      <label>
                        <input
                          type="radio"
                          name="tipo_identificacion"
                          value="cedula"
                          checked={formData.tipo_identificacion === "cedula"}
                          onChange={handleChange}
                          disabled={soloLectura}
                        />{" "}
                        Cédula
                      </label>{" "}
                      <label>
                        <input
                          type="radio"
                          name="tipo_identificacion"
                          value="ruc"
                          checked={formData.tipo_identificacion === "ruc"}
                          onChange={handleChange}
                          disabled={soloLectura}
                        />{" "}
                        RUC
                      </label>{" "}
                      <label>
                        <input
                          type="radio"
                          name="tipo_identificacion"
                          value="otro"
                          checked={formData.tipo_identificacion === "otro"}
                          onChange={handleChange}
                          disabled={soloLectura}
                        />{" "}
                        Otro
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    readOnly={soloLectura || !formData.tipo_identificacion}
                    className={styles.input}
                    required
                    placeholder={
                      formData.tipo_identificacion === "cedula"
                        ? "Ej: 123-456789-0123X"
                        : formData.tipo_identificacion === "ruc"
                        ? "Ej: J0310000003456"
                        : formData.tipo_identificacion === "otro"
                        ? "Ingrese otro tipo de identificación"
                        : "Favor seleccione un tipo"
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    className={styles.input}
                    required
                    placeholder="Teléfono"
                  />
                </div>
              </div>
            </fieldset>

            {/* Logística */}
            <fieldset className={styles.section}>
              <legend>Logística</legend>
              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Tipo envío
                  </label>
                  <select
                    name="id_tipenvio"
                    value={formData.id_tipenvio}
                    onChange={(e) => {
                      if (!soloLectura) handleChange(e);
                    }}
                    className={styles.select}
                    required
                  >
                    <option value="">Seleccione tipo envío</option>
                    {catalogos.envios.map((e) => (
                      <option key={e.id_tipenvio} value={e.id_tipenvio}>
                        {e.nombre_Tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Origen inventario
                  </label>
                  <select
                    name="id_originventario"
                    value={formData.id_originventario}
                    onChange={(e) => {
                      if (!soloLectura) handleChange(e);
                    }}
                    className={styles.select}
                    required
                  >
                    <option value="">Seleccione origen</option>
                    {catalogos.origenes.map((o) => (
                      <option
                        key={o.id_originventario}
                        value={o.id_originventario}
                      >
                        {o.nombre_origen}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Fecha entrega
                  </label>
                  <input
                    type="date"
                    name="fecha_entrega"
                    value={formData.fecha_entrega}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    min={hoy}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tienda Sinsa</label>
                  <input
                    list="tiendasinsa-options"
                    name="id_tiendasinsa"
                    value={formData.id_tiendasinsa}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    className={styles.select}
                    placeholder="Seleccione tienda Sinsa"
                    disabled={ordenSeleccionada ? false : !activarTiendaSinsa}
                  />
                  <datalist id="tiendasinsa-options">
                    {catalogos.tiendasinsa.map((t) => (
                      <option
                        key={t.id_tiendasinsa}
                        value={t.nombre_tiendasinsa}
                      />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className={styles.grid}>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Dirección</label>
                  <input
                    type="text"
                    name="direccion_entrega"
                    value={formData.direccion_entrega}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    className={styles.input}
                    placeholder="Dirección de entrega"
                    disabled={ordenSeleccionada ? false : !activarDireccion}
                  />
                </div>
              </div>
            </fieldset>

            {/* Administración */}
            <fieldset className={styles.section}>
              <legend>Administración</legend>
              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Flete</label>
                  <input
                    type="text"
                    name="flete"
                    value={formData.flete}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    className={styles.input}
                    placeholder="Monto en córdobas"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Pago
                  </label>
                  <select
                    name="id_tipopago"
                    value={formData.id_tipopago}
                    onChange={(e) => {
                      if (!soloLectura) handleChange(e);
                    }}
                    className={styles.select}
                    required
                  >
                    <option value="">Seleccione pago</option>
                    {catalogos.pagos.map((p) => (
                      <option key={p.id_tipopago} value={p.id_tipopago}>
                        {p.nombre_tipopago}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.requiredLabel}`}>
                    Monto Factura
                  </label>
                  <input
                    type="text"
                    name="monto_factura"
                    value={formData.monto_factura}
                    onChange={handleChange}
                    readOnly={soloLectura}
                    className={styles.input}
                    required
                    placeholder="Monto en córdobas"
                  />
                </div>
                {(rolUsuario === "admin" || rolUsuario === "agente") && (
                  <div className={styles.formGroup}>
                    <label className={`${styles.label}`}>Asignado a:</label>
                    <select
                      name="id_agente"
                      value={formData.id_agente || ""}
                      onChange={(e) => {
                        if (!soloLectura) handleChange(e);
                      }}
                      className={styles.select}
                    >
                      <option value="">Seleccione agente</option>
                      {catalogos.agente.map((a) => (
                        <option key={a.id_agente} value={a.id_agente}>
                          {a.nombre_agente}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {(rolUsuario !== "vendedor" || !formData.id_registro) && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estado:</label>
                    <select
                      name="id_estado"
                      value={estadoTemporal || ""}
                      onChange={(e) => setEstadoTemporal(e.target.value)}
                      className={styles.select}
                      required
                    >
                      <option value="">Seleccione un estado</option>
                      {obtenerEstadosPermitidos(formData.id_estado).map((e) => (
                        <option key={e.id_estado} value={e.id_estado}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Observaciones</label>
                <textarea
                  name="observacion"
                  value={formData.observacion || ""}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </fieldset>

            {/* Botones */}
            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.button}>
                {formData.id_registro ? "Actualizar" : "Registrar"}
              </button>
              {tieneDatos && (
                <button
                  type="button"
                  onClick={handleLimpiar}
                  className={styles.limpiarButton}
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
