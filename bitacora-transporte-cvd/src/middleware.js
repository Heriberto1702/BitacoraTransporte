import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const baseURL =
    process.env.NODE_ENV === 'production'
      ? 'https://DOMINIO.com' // ⬅️ reemplazalo por tu dominio real en producción
      : 'http://localhost:3000'

  // Si no hay sesión, redirigir al login
  if (!token) {
    return NextResponse.redirect(new URL('/login', baseURL))
  }

  // Si hay token, continúa normalmente
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/ordenes/:path*',
    '/usuarios/:path*',
    '/', // proteges la raíz si querés
  ],
}

