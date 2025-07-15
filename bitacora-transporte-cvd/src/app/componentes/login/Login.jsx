"use client"
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()

    if (!email || !password) {
      setMessage('Por favor completa todos los campos')
      return
    }

    // Aquí puedes agregar la lógica para conectar con tu backend después
    setMessage(`Intentando iniciar sesión con ${email}`)
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Iniciar sesión</button>
      <p>{message}</p>
    </form>
  )
}
