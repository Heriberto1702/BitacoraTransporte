"use client";
import { useEffect, useState } from "react";

export default function NuevoUsuario() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [nombre_vendedor, setNombreVendedor] = useState("");
  const [apellido_vendedor, setApellidoVendedor] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  const obtenerUsuarios = async () => {
    const res = await fetch("/api/auth/usuarios"); // la vamos a crear abajo
    const data = await res.json();
    setUsuarios(data.usuarios || []);
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const crear = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/nuevousuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, rol, password, nombre_vendedor, apellido_vendedor }),
    });

    const data = await res.json();
    if (res.ok) {
      setMensaje("Usuario creado ✅");
      setCorreo("");
      setRol("");
      setNombreVendedor("");
      setApellidoVendedor("");
      setTimeout(() => setMensaje(""), 3000);
      obtenerUsuarios();
    } else {
      setMensaje(data.error || "Error al crear usuario");
    }
  };

  const eliminar = async (correo) => {
    if (!confirm(`¿Eliminar usuario ${correo}?`)) return;

    const res = await fetch("/api/auth/eliminarusuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo }),
    });

    const data = await res.json();
    if (res.ok) {
      setMensaje("Usuario eliminado ✅");
      setTimeout(() => setMensaje(""), 3000);
      obtenerUsuarios();
    } else {
      setMensaje(data.error || "Error al eliminar");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <form onSubmit={crear}>
        <h2>Registrar nuevo usuario</h2>
        <input
          type="text"
          value={nombre_vendedor}
          onChange={(e) => setNombreVendedor(e.target.value)}
          placeholder="Nombre"
          required/>
         <input
          type="text"
          value={apellido_vendedor}
          onChange={(e) => setApellidoVendedor(e.target.value)}
          placeholder="Apellido"
          required/>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Correo"
          required
        />
                <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit">Crear usuario</button>
      </form>

      <p>{mensaje}</p>

      <h3>Usuarios registrados</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id_login}>
              <td>{u.nombre_vendedor}</td>
              <td>{u.apellido_vendedor}</td>
              <td>{u.correo}</td>
              <td>{u.rol}</td>
              <td>
                <button onClick={() => eliminar(u.correo)}>🗑 Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
