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
  estado: "Nueva",
};

export default function RegistrarOrden({
  session,
  ordenSeleccionada,
  onFinish,
  onActualizado, // 🔹 función para refrescar tabla
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
        id_tipenvio: ordenSeleccionada.id_tipenvio || "",
        id_originventario: ordenSeleccionada.id_originventario || "",
        id_tienda: ordenSeleccionada.id_tienda || "",
        id_tipopago: ordenSeleccionada.id_tipopago || "",
        id_tiendasinsa:
          ordenSeleccionada.tiendasinsa?.nombre_tiendasinsa || "",
        estado: ordenSeleccionada.estado || "Nueva",
      });
    }
  }, [ordenSeleccionada]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLimpiar = () => {
    setFormData(estadoInicial);
    if (onFinish) onFinish();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

if (formData.direccion_entrega && formData.direccion_entrega.trim().length < 20) {
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
      direccion_entrega: formData.direccion_entrega ? formData.direccion_entrega : null,
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
      // 🔹 Aquí mostramos los mensajes que vengan del backend
      if (result.error) {
        alert(result.error);
      } else {
        alert("Error guardando la orden");
      }
      return;
    }

    alert(
      formData.id_registro
        ? "Orden actualizada con éxito"
        : "Orden registrada con éxito"
    );
      handleLimpiar();
    if (onActualizado) onActualizado(); // 🔹 refresca tabla
  } catch (err) {
    console.error(err);
    alert("Error de conexión con el servidor");
  }
};

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className={styles.errorMessage}>{error}</p>;

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2 className={styles.title}>
        {formData.id_registro
          ? "Editar Orden de Compra"
          : "Registrar Orden de Compra"}
      </h2>

      <div className={styles.formRow}>
        {/* Tienda */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Seleccione tienda:</label>
          <select
            name="id_tienda"
            value={formData.id_tienda}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Seleccione una tienda:</option>
            {catalogos.tiendas.map((t) => (
              <option key={t.id_tienda} value={t.id_tienda}>
                {t.nombre_tienda}
              </option>
            ))}
          </select>
        </div>

        {/* Número de ticket */}
        <div className={styles.formGroup}>
          <label className={styles.label}>TK:</label>
          <input
            type="number"
            name="num_ticket"
            placeholder="Número de ticket"
            value={formData.num_ticket}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* Nombre cliente */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Nombre del Cliente:</label>
          <input
            type="text"
            name="nombre_cliente"
            placeholder="Nombre del cliente"
            value={formData.nombre_cliente}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* Dirección */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Dirección de entrega:</label>
          <input
            type="text"
            name="direccion_entrega"
            placeholder="Dirección de entrega"
            value={formData.direccion_entrega}
            onChange={handleChange}
            className={styles.input}
           
          />
        </div>

        {/* Tipo de envío */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Tipo de envío:</label>
          <select
            name="id_tipenvio"
            value={formData.id_tipenvio}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Seleccione tipo de envío</option>
            {catalogos.envios.map((e) => (
              <option key={e.id_tipenvio} value={e.id_tipenvio}>
                {e.nombre_Tipo}
              </option>
            ))}
          </select>
        </div>

        {/* Tienda Sinsa */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Tienda Sinsa:</label>
          <input
            list="tiendasinsa-options"
            name="id_tiendasinsa"
            value={formData.id_tiendasinsa}
            onChange={handleChange}
            className={styles.select}
            placeholder="Seleccione tienda Sinsa (opcional)"
          />
          <datalist id="tiendasinsa-options">
            {catalogos.tiendasinsa.map((t) => (
              <option key={t.id_tiendasinsa} value={t.nombre_tiendasinsa} />
            ))}
          </datalist>
        </div>

        {/* Origen inventario */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Descargue inventario:</label>
          <select
            name="id_originventario"
            value={formData.id_originventario}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Seleccione origen de inventario</option>
            {catalogos.origenes.map((o) => (
              <option key={o.id_originventario} value={o.id_originventario}>
                {o.nombre_origen}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de pago */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Tipo de pago:</label>
          <select
            name="id_tipopago"
            value={formData.id_tipopago}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Seleccione tipo de pago</option>
            {catalogos.pagos.map((p) => (
              <option key={p.id_tipopago} value={p.id_tipopago}>
                {p.nombre_tipopago}
              </option>
            ))}
          </select>
        </div>

        {/* Flete */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Flete:</label>
          <input
            type="number"
            name="flete"
            placeholder="Flete (opcional)"
            value={formData.flete}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* Fecha de entrega */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Fecha de entrega:</label>
          <input
            type="date"
            name="fecha_entrega"
            value={formData.fecha_entrega}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* Estado */}
        {!(rolUsuario === "vendedor" && formData.id_registro) && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Estado:</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className={styles.select}
              required
            >
              {rolUsuario === "vendedor" && (
                <>
                  <option value="Nueva">Nueva</option>
                  <option value="Refacturada">Refacturada</option>
                </>
              )}
              {(rolUsuario === "admin" || rolUsuario === "superusuario") && (
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
      </div>

      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.button}>
          {formData.id_registro ? "Actualizar" : "Registrar"}
        </button>
        <button
          type="button"
          onClick={handleLimpiar}
          className={styles.limpiarButton}
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
