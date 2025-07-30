import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        correo: { label: 'Correo', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const usuario = await prisma.login.findUnique({
          where: { correo: credentials.correo },
        })

        if (!usuario) return null
        if (usuario.password !== credentials.password) return null

        return {
          id: usuario.id_login,
          email: usuario.correo,
          rol: usuario.rol || 'vendedor',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = user.rol
      }
      return token
    },
    async session({ session, token }) {
      session.user.rol = token.rol
      return session
    },
  },
  pages: {
    signIn: '/login', // tu propia página de login
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
})

export { handler as GET, handler as POST }
