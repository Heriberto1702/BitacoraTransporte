"use client";

export default function AdminPanel() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Panel de Administración</h1>
      <a href="/admin/nuevoUsuario">➕ Crear nuevo usuario</a>
      <a href="/dashboard">📋 Ver órdenes</a>
    </div>
  );
}
