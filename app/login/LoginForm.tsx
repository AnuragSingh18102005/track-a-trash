'use client'

import { FormEvent, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'

interface LoginFormProps {
  callbackUrl?: string
  error?: string
}

export default function LoginForm({ callbackUrl, error }: LoginFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (error === 'unauthorized') {
      toast.error('Please sign in with an admin account to continue.')
    }
  }, [error])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || '/?page=admin',
    })

    if (result?.error) {
      setFormError('Invalid credentials. Please try again.')
      setIsSubmitting(false)
      return
    }

    try {
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()
      const role = sessionData?.user?.role
      const destination =
        result?.url ||
        callbackUrl ||
        (role === 'admin' ? '/?page=admin' : '/')

      router.replace(destination)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-teal-500 py-2 text-white font-medium hover:bg-teal-400 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

