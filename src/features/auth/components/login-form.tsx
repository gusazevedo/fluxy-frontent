'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas'
import { loginUser } from '@/features/auth/actions'
import { isApiError } from '@/features/auth/types'

export function LoginForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      const tokens = await loginUser(values.email, values.password)
      localStorage.setItem('fluxy_access_token', tokens.access_token)
      localStorage.setItem('fluxy_refresh_token', tokens.refresh_token)
      const secure = location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `fluxy_access_token=${tokens.access_token}; path=/; SameSite=Lax; Max-Age=2592000${secure}`
      router.push('/dashboard')
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === 'INVALID_CREDENTIALS') {
          toast.error('Invalid email or password.')
        } else if (err.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email before logging in.')
        } else if (err.code === 'VALIDATION_ERROR') {
          toast.error(err.message)
        } else {
          toast.error('Something went wrong. Please try again.')
        }
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••"
          autoComplete="current-password"
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
