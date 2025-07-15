"use client"
import { useState } from 'react'

export default function RegistroForm() {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nombres || !apellidos || !correo || !password) {
      setMensaje('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setMensaje('')

    const body = { nombres, apellidos, correo, password }

    try {
      const res = await fetch('/api/usuario/guardarTrabajador', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Indicar que enviamos JSON
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        setMensaje('Trabajador registrado con éxito')
        setNombres('')
        setApellidos('')
        setCorreo('')
        setPassword('')
      } else {
        setMensaje(data.error || 'Error al registrar')
      }
    } catch (err) {
      console.error(err)
      setMensaje('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registro de Trabajador</h2>

      <input
        type="text"
        placeholder="Nombres"
        value={nombres}
        onChange={(e) => setNombres(e.target.value)}
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Apellidos"
        value={apellidos}
        onChange={(e) => setApellidos(e.target.value)}
        disabled={loading}
      />
      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar'}
      </button>

      {mensaje && <p>{mensaje}</p>}
    </form>
  )
}
