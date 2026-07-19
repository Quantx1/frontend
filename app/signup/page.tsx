'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import AuthLayout from '@/components/auth/AuthLayout'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Zap,
  Shield,
  Sparkles,
} from '@/lib/icons'
import { GoogleLogo } from '@/components/icons/GoogleLogo'

const accountSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type AccountFormData = z.infer<typeof accountSchema>

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Trade the desk, on us',
    features: ['1 paper signal a day', 'Core technical analysis', 'Email alerts', '7-day trade history'],
    icon: Sparkles,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    description: 'Built for active traders',
    features: ['Unlimited signals', 'All 50+ scanners', 'Pattern detection', 'Copilot, explains every call', 'Push notifications', 'Portfolio analytics'],
    icon: Zap,
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 1999,
    description: 'The full trading desk',
    features: ['Everything in Pro', 'AutoPilot executes for you', 'F&O strategies', 'Unlimited Copilot', 'Priority support', 'Custom alerts'],
    icon: Shield,
  },
]

const inputClass =
  'w-full rounded-xl border border-line bg-main py-3 pl-11 pr-4 text-sm text-d-text-primary placeholder:text-d-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    if (password.length >= 12) score++
    return score
  }, [password])

  const colors = ['bg-down', 'bg-down', 'bg-warning', 'bg-primary', 'bg-up']
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < strength ? colors[strength - 1] : 'bg-line'
            }`}
          />
        ))}
      </div>
      <p className={`mt-1 text-xs ${strength <= 2 ? 'text-down' : strength <= 3 ? 'text-warning' : 'text-up'}`}>
        {labels[strength - 1] || 'Too short'}
      </p>
    </div>
  )
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp, signInWithGoogle } = useAuth()

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [formData, setFormData] = useState<AccountFormData | null>(null)
  const [refCode, setRefCode] = useState<string | null>(null)
  const [refValid, setRefValid] = useState<boolean | null>(null)

  // PR 42 — capture ?ref= from URL and validate it against the referrer's code.
  useEffect(() => {
    const ref = searchParams?.get('ref')?.toUpperCase() || null
    if (!ref) return
    setRefCode(ref)
    try {
      localStorage.setItem('pending_ref', ref)
    } catch {
      /* storage disabled — attribution will still be attempted in-memory */
    }
    ;(async () => {
      try {
        const r = await api.referrals.resolve(ref)
        setRefValid(r.valid)
      } catch {
        setRefValid(false)
      }
    })()
  }, [searchParams])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  })

  const passwordValue = watch('password', '')

  const onAccountSubmit = (data: AccountFormData) => {
    setFormData(data)
    setStep(2)
  }

  const handleFinalSignup = async () => {
    if (!formData) return
    setIsLoading(true)
    try {
      const { needsConfirmation } = await signUp(
        formData.email,
        formData.password,
        formData.full_name,
      )
      // PR 42 — attribute referral if we have a valid code. Best-effort;
      // a fallback attribution hook in the platform layout will retry
      // on first authed page load in case the session isn't ready yet.
      const pendingRef = refCode || (typeof window !== 'undefined' ? localStorage.getItem('pending_ref') : null)
      if (pendingRef) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.id) {
            await api.referrals.attribute({
              referred_user_id: user.id,
              code: pendingRef,
              referred_email: formData.email,
            })
            try { localStorage.removeItem('pending_ref') } catch {}
          }
        } catch {
          /* non-fatal — platform-layout fallback will retry */
        }
      }
      if (needsConfirmation) {
        toast.success('Account created! Please check your email to verify.')
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        // Email auto-confirmed (Supabase project setting). Drop the
        // user straight into the product.
        toast.success('Welcome to Quant X!')
        router.push('/copilot')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up with Google')
      setIsGoogleLoading(false)
    }
  }

  // Step 2+ renders without AuthLayout (needs wider layout for plan cards)
  if (step >= 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main p-4">
        <div className="w-full max-w-4xl animate-fade-in-up">
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    step >= i
                      ? 'bg-gradient-cta text-on-signature'
                      : 'border border-line bg-white/[0.06] text-d-text-muted'
                  }`}
                >
                  {step > i ? <Check className="h-4 w-4" /> : i}
                </div>
                {i < 3 && (
                  <div className={`h-0.5 w-12 rounded transition-all ${step > i ? 'bg-primary' : 'bg-line'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 2: Choose Plan */}
          {step === 2 && (
            <div className="rounded-2xl border border-line bg-wrap p-8 shadow-glass">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-d-text-primary">Pick your plan</h1>
                <p className="mt-2 text-sm text-d-text-secondary">Start free. Upgrade the day you need more.</p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                  const Icon = plan.icon
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-xl border-2 p-5 text-left transition-all hover:shadow-glass-hover ${
                        selectedPlan === plan.id
                          ? 'border-primary bg-primary/5'
                          : 'border-line bg-white/[0.06] hover:border-wrap-line'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[6px] bg-gradient-cta px-3 py-0.5 text-xs font-semibold text-on-signature">
                          Most Popular
                        </div>
                      )}
                      <div className="mb-3 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-d-text-primary">{plan.name}</h3>
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-d-text-primary">&#8377;{plan.price}</span>
                        <span className="text-xs text-d-text-muted">/month</span>
                      </div>
                      <p className="mb-3 text-xs text-d-text-secondary">{plan.description}</p>
                      <ul className="space-y-1.5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-d-text-secondary">
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-[6px] border border-line bg-white/[0.03] px-5 py-3 text-sm font-medium text-d-text-primary transition-all hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[6px] bg-gradient-cta px-6 py-3 text-sm font-bold text-on-signature transition-all hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="rounded-2xl border border-line bg-wrap p-8 shadow-glass text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-d-text-primary">You&apos;re in.</h1>
              <p className="mt-2 text-sm text-d-text-secondary">
                Create your account and put the five engines to work.
              </p>

              <div className="mx-auto mt-8 max-w-sm rounded-xl border border-line bg-hover p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-d-text-secondary">Selected Plan:</span>
                  <span className="font-semibold text-d-text-primary">
                    {plans.find((p) => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-d-text-secondary">Price:</span>
                  <span className="font-semibold text-d-text-primary">
                    &#8377;{plans.find((p) => p.id === selectedPlan)?.price}/month
                  </span>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-[6px] border border-line bg-white/[0.03] px-5 py-3 text-sm font-medium text-d-text-primary transition-all hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleFinalSignup}
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[6px] bg-gradient-cta px-6 py-3 text-sm font-bold text-on-signature transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 1: Account form inside AuthLayout
  return (
    <AuthLayout
      title="The AI trading desk for India"
      subtitle="Five engines. One gated signal. Every call explained. Built for serious NSE traders."
    >
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-d-text-primary">Create your account</h1>
          <p className="mt-2 text-sm text-d-text-secondary">
            Paper-trade the full stack, free. No card.
          </p>
        </div>

        {/* Google Signup */}
        <button
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-[6px] border border-line bg-white/[0.03] px-6 py-3 text-sm font-medium text-d-text-primary shadow-glass transition-all hover:shadow-glass-hover disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <GoogleLogo size={20} />
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-main px-4 text-d-text-muted">or</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onAccountSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-d-text-primary">Full Name</label>
            <div className="input-animated-wrapper relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-d-text-muted" />
              <input {...register('full_name')} type="text" placeholder="Your full name" className={inputClass} />
            </div>
            {errors.full_name && <p className="mt-1 text-xs text-down">{errors.full_name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-d-text-primary">Email Address</label>
            <div className="input-animated-wrapper relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-d-text-muted" />
              <input {...register('email')} type="email" placeholder="you@example.com" className={inputClass} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-down">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-d-text-primary">Password</label>
            <div className="input-animated-wrapper relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-d-text-muted" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                className={`${inputClass} !pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={passwordValue} />
            {errors.password && <p className="mt-1 text-xs text-down">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-d-text-primary">Confirm Password</label>
            <div className="input-animated-wrapper relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-d-text-muted" />
              <input
                {...register('confirm_password')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                className={`${inputClass} !pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm_password && <p className="mt-1 text-xs text-down">{errors.confirm_password.message}</p>}
          </div>

          {/* Terms */}
          <div>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                {...register('terms')}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-line accent-primary"
              />
              <span className="text-sm text-d-text-secondary">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && <p className="mt-1 text-xs text-down">{errors.terms.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-gradient-cta px-6 py-3 text-sm font-bold text-on-signature transition-all hover:opacity-90 hover:shadow-glow-primary"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-d-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary transition-colors hover:text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js 14 App Router —
// without it the entire page is statically prerendered with the loading
// state and never hydrates to the real form. Acquisition path — must not
// regress. (PR e2e — discovered by prod-build Playwright smoke.)
export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Create account" subtitle="Loading…">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </AuthLayout>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
