'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '../../componentes/login/Login'
import styles from './loginpage.module.css'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return <p className={styles.cargando}>Cargando...</p>
  }

  return (
    <div className={styles.container}>
      <div className={styles.subcontainer}>
      <h1 className={styles.title}>Iniciar sesión</h1>
      <p className={styles.subtitle}>Ingresa tus credenciales para acceder a tu cuenta.</p>
      <div >
        <Login />
      </div>
      </div>
    </div>
  )
}
