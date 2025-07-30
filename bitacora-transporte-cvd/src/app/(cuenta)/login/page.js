'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '../../componentes/login/Login'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/') // o la ruta que querés redirigir
    }
  }, [status, router])

  if (status === 'loading') {
    return <p>Cargando...</p>
  }

  return (
    <div>
      <h1>Iniciar sesión</h1>
      <p>Ingresa tus credenciales para acceder a tu cuenta.</p>
      <Login />
    </div>
  )
}
