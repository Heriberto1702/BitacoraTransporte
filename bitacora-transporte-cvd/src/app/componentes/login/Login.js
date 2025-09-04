'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from './Login.module.css' // tu CSS

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    const res = await signIn('credentials', {
      redirect: false,
      correo: email,
      password,
    })

    if (res.ok) {
      router.push('/')
    } else {
      setMessage('Credenciales inválidas')
    }
  }

  return (
    <form onSubmit={handleLogin} className={styles.form}>
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
        required
      />

      <div className={styles.passwordWrapper}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button
          type="button"
          className={styles.togglePasswordButton}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '👁️‍🗨️' : '👁️'}
        </button>
      </div>

      <button type="submit" className={styles.submitButton}>
        Iniciar sesión
      </button>
      {message && <p className={styles.error}>{message}</p>}
    </form>
  )
}
