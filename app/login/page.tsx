import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LoginForm from './LoginForm'

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions)
  const callbackParam = typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : undefined
  const errorParam = typeof searchParams?.error === 'string' ? searchParams.error : undefined

  if (session) {
    const target =
      callbackParam ||
      (session.user?.role === 'admin' ? '/?page=admin' : '/')
    redirect(target)
  }

  return <LoginForm callbackUrl={callbackParam} error={errorParam} />
}

