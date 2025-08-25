'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    if (error) setMessage(error.message)
    else setMessage('Check your email to complete sign up.')
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Sign Up</h1>
      <form onSubmit={handleEmailSignUp} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Send Magic Link
        </button>
      </form>
      <button
        onClick={handleGoogle}
        className="mt-4 border px-4 py-2 w-full"
      >
        Sign up with Google
      </button>
      {message && <p className="mt-4 text-sm">{message}</p>}
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <a href="/login" className="underline">
          Log in
        </a>
      </p>
    </div>
  )
}
