"use client"

import { useSession, signOut } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Cargando...</p>

  return (
    <>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.userInfo}>
          {session?.user?.email && (
            <span>Sesión iniciada como: <strong>{session.user.email} - {session.user.rol}</strong></span>
          )}
        </div>
        <button onClick={() => signOut()} style={styles.logoutButton}>Cerrar sesión</button>
      </nav>

      {/* Contenido principal */}
      <div style={styles.content}>
        <p>Bienvenido a la Bitácora de Transporte CVD</p>
        <p>Esta aplicación te permite registrar y gestionar la información de transporte de manera eficiente.</p>
      </div>
    </>
  )
}

// Estilos simples
const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#333',
    color: '#fff'
  },
  userInfo: {
    fontSize: '16px'
  },
  logoutButton: {
    backgroundColor: '#ff4d4f',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '4px'
  },
  content: {
    padding: '20px'
  }
}
