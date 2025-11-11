import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import AdminDashboard from '../components/AdminDashboard'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login?callbackUrl=/dashboard&error=unauthorized')
  }

  if (session.user?.role !== 'admin') {
    redirect('/login?callbackUrl=/dashboard&error=unauthorized')
  }

  return <AdminDashboard />
}

