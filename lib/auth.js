import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import bcrypt from 'bcrypt'
import clientPromise from '@/lib/mongodb'

const databaseName = process.env.MONGODB_DB || 'waste_tracker'

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName }),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const client = await clientPromise
        const db = client.db(databaseName)
        const usersCollection = db.collection('users')

        const email = credentials.email.toLowerCase()
        const user = await usersCollection.findOne({ email })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)
        if (!isValidPassword) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.email,
          role: user.role || 'user',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role || 'user'
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const ADMIN_ROUTES = ['/dashboard', '/analytics']

