import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from "../../../../lib/prisma";

export const authOptions = {
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
          nombre_vendedor: usuario.nombre_vendedor,
          apellido_vendedor: usuario.apellido_vendedor
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
        token.nombre_vendedor = user.nombre_vendedor
        token.apellido_vendedor = user.apellido_vendedor
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.rol = token.rol
      session.user.nombre_vendedor = token.nombre_vendedor
      session.user.apellido_vendedor = token.apellido_vendedor
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
