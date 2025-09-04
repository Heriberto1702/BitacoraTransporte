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
  estado: "Nueva",
};

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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activarDireccion, setActivarDireccion] = useState(false);
  const [activarTiendaSinsa, setActivarTiendaSinsa] = useState(false);

  const rolUsuario = session?.user?.rol || "usuario";

  // Cargar catálogos
  useEffect(() => {
    async function fetchCatalogos() {
      try {
        setLoading(true);
        const res = await fetch("/api/catalogos/todos");
        if (!res.ok) throw new Error("Error al cargar catálogos");
        const data = await res.json();
        setCatalogos(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los catálogos");
      } finally {
        setLoading(false);
      }
    }
    fetchCatalogos();
  }, []);

// Cargar datos de la orden seleccionada
useEffect(() => {
  if (ordenSeleccionada) {
    setFormData({
      id_registro: ordenSeleccionada.id_registro,
      num_ticket: ordenSeleccionada.num_ticket || "",
      nombre_cliente: ordenSeleccionada.nombre_cliente || "",
      direccion_entrega: ordenSeleccionada.direccion_entrega || "",
      flete: ordenSeleccionada.flete || "",
      fecha_entrega: ordenSeleccionada.fecha_entrega || "",
      id_tipenvio: ordenSeleccionada.id_tipenvio?.toString() || "",
      id_originventario: ordenSeleccionada.id_originventario?.toString() || "",
      id_tienda: ordenSeleccionada.id_tienda?.toString() || "",
      id_tipopago: ordenSeleccionada.id_tipopago?.toString() || "",
      id_tiendasinsa: ordenSeleccionada.tiendasinsa?.nombre_tiendasinsa || "",
      observacion: ordenSeleccionada.observacion || "",
      estado: ordenSeleccionada.estado || "Nueva",
    });
  }
}, [ordenSeleccionada]);

  // Habilitar/deshabilitar campos según tipo de envío (solo creación)
  useEffect(() => {
    if (!ordenSeleccionada) {
      if (
        formData.id_tipenvio === "1" ||
        formData.id_tipenvio === "5"
      ) {
        setActivarDireccion(true);
        setActivarTiendaSinsa(false);
      } else if (
        formData.id_tipenvio === "6" ||
        formData.id_tipenvio === "4" ||
        formData.id_tipenvio === "2"
      ) {
        setActivarDireccion(false);
        setActivarTiendaSinsa(true);
      } else {
        setActivarDireccion(false);
        setActivarTiendaSinsa(false);
      }
    }
  }, [formData.id_tipenvio, ordenSeleccionada]);
  const hoy = new Date().toISOString().split("T")[0];
  // Manejo de cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validar solo números para campos numéricos
    if (name === "num_ticket" || name === "flete") {
      const soloNumeros = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: soloNumeros });
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

    const tiendaSinsaObj = catalogos.tiendasinsa.find(
      (t) => t.nombre_tiendasinsa === formData.id_tiendasinsa
    );
    const id_tiendasinsa = tiendaSinsaObj
      ? tiendaSinsaObj.id_tiendasinsa
      : null;

    const payload = {
      ...formData,
      num_ticket: parseInt(formData.num_ticket),
      direccion_entrega: formData.direccion_entrega || null,
      flete: formData.flete ? parseInt(formData.flete) : null,
      id_tiendasinsa,
    };

    const url = formData.id_registro
      ? "/api/bitacora/actualizar"
      : "/api/bitacora/crear";
    const method = formData.id_registro ? "PUT" : "POST";

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

  const tieneDatos = Object.values(formData).some((v) => v && v !== "Nueva");

  return (
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
              onChange={handleChange}
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
              className={styles.input}
              placeholder="Número de ticket"
              inputMode="numeric"
              pattern="\d*"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={`${styles.label} ${styles.requiredLabel}`}>
              Cliente
            </label>
            <input
              type="text"
              name="nombre_cliente"
              value={formData.nombre_cliente}
              onChange={handleChange}
              className={styles.input}
              required
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
              onChange={handleChange}
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
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Seleccione origen</option>
              {catalogos.origenes.map((o) => (
                <option key={o.id_originventario} value={o.id_originventario}>
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
            <label className={styles.label}>Dirección</label>
            <input
              type="text"
              name="direccion_entrega"
              value={formData.direccion_entrega}
              onChange={handleChange}
              className={styles.input}
              placeholder="Dirección de entrega"
              disabled={ordenSeleccionada ? false : !activarDireccion}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tienda Sinsa</label>
            <input
              list="tiendasinsa-options"
              name="id_tiendasinsa"
              value={formData.id_tiendasinsa}
              onChange={handleChange}
              className={styles.select}
              placeholder="Seleccione tienda Sinsa"
              disabled={ordenSeleccionada ? false : !activarTiendaSinsa}
            />
            <datalist id="tiendasinsa-options">
              {catalogos.tiendasinsa.map((t) => (
                <option key={t.id_tiendasinsa} value={t.nombre_tiendasinsa} />
              ))}
            </datalist>
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
              className={styles.input}
              placeholder="Opcional"
              inputMode="numeric"
              pattern="\d*"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={`${styles.label} ${styles.requiredLabel}`}>
              Pago
            </label>
            <select
              name="id_tipopago"
              value={formData.id_tipopago}
              onChange={handleChange}
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

          {(rolUsuario !== "vendedor" || !formData.id_registro) && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className={styles.select}
                required
              >
                {rolUsuario === "vendedor" ? (
                  <>
                    <option value="Nueva">Nueva</option>
                    <option value="Refacturada">Refacturada</option>
                  </>
                ) : (
                  <>
                    <option value="Nueva">Nueva</option>
                    <option value="Recibida">Recibida</option>
                    <option value="Refacturada">Refacturada</option>
                    <option value="Refacturada-Recibida">
                      Refacturada-Recibida
                    </option>
                  </>
                )}
              </select>
            </div>
          )}

          <div className={styles.formGroupFull}>
            <label className={styles.label}>Observaciones</label>
            <textarea
              name="observacion"
              value={formData.observacion}
              onChange={handleChange}
              className={styles.textarea}
              rows={3}
            />
          </div>
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
  );
}
