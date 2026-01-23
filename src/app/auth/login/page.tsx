'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()
    const t = useTranslations('auth')
    const tErrors = useTranslations('errors')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login error:', error)
            if (error.message === 'Invalid login credentials') {
                setError(tErrors('generic'))
            } else if (error.message.includes('Email not confirmed')) {
                setError(tErrors('emailNotConfirmed'))
            } else {
                setError(error.message)
            }
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            setError(tErrors('required'))
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
            setError(error.message)
        } else {
            setMessage(t('forgotPassword'))
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Panel - Decorative (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-automotive">
                {/* Decorative elements */}
                <div className="absolute inset-0">
                    <div className="deco-circle w-[500px] h-[500px] -top-32 -left-32 opacity-30" />
                    <div className="deco-circle w-[400px] h-[400px] bottom-0 right-0 opacity-20" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' }} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <Link href="/" className="inline-flex items-center gap-2 mb-12">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-accent/30">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <span className="text-3xl font-bold text-white">Autobazar<span className="text-accent-vivid">123</span></span>
                    </Link>

                    <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                        Vitajte späť!
                    </h2>
                    <p className="text-lg text-white/70 mb-8 max-w-md">
                        Prihláste sa a pokračujte v hľadaní vášho dokonalého auta, alebo spravujte svoje inzeráty.
                    </p>

                    {/* Stats */}
                    <div className="flex gap-8">
                        <div>
                            <div className="text-3xl font-bold text-white">50k+</div>
                            <div className="text-sm text-white/60">Aktívnych inzerátov</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white">10k+</div>
                            <div className="text-sm text-white/60">Spokojných zákazníkov</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white">500+</div>
                            <div className="text-sm text-white/60">Overených predajcov</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
                <div className="max-w-md w-full space-y-8">
                    {/* Mobile Logo */}
                    <div className="text-center lg:hidden">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="text-2xl font-bold text-primary">Autobazar<span className="text-accent">123</span></span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-primary">
                            {t('login')}
                        </h2>
                        <p className="mt-2 text-secondary">
                            {t('noAccount')}{' '}
                            <Link href="/auth/register" className="font-semibold text-accent hover:text-accent-hover transition-colors">
                                {t('registerNow')}
                            </Link>
                        </p>
                    </div>

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-scale-in">
                                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-scale-in">
                                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                                    {t('email')}
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-premium w-full focus-premium"
                                    placeholder="vas@email.sk"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                                    {t('password')}
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-premium w-full focus-premium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                            >
                                {t('forgotPassword')}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-premium w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                t('login')
                            )}
                        </button>
                    </form>

                    {/* Social login */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full divider-gradient" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-background text-secondary">{t('orContinueWith')}</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="group flex items-center justify-center gap-2 py-3 px-4 border-2 border-border rounded-xl bg-background text-primary font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200"
                                onClick={() => {
                                    const redirectTo = `${window.location.origin}/auth/callback`
                                    supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            redirectTo,
                                        }
                                    })
                                }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>{t('google')}</span>
                            </button>

                            <button
                                type="button"
                                className="group flex items-center justify-center gap-2 py-3 px-4 border-2 border-border rounded-xl bg-background text-primary font-medium hover:border-[#1877F2] hover:bg-[#1877F2]/5 transition-all duration-200"
                                onClick={() => supabase.auth.signInWithOAuth({
                                    provider: 'facebook',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback`,
                                    }
                                })}
                            >
                                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span>{t('facebook')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
