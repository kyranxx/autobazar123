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
            redirectTo: `https://autobazar123.sk/auth/reset-password`,
        })

        if (error) {
            setError(error.message)
        } else {
            setMessage(t('forgotPassword'))
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Panel - Desktop only */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-digital/30" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2583&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />

                <div className="relative z-10 max-w-lg text-white">
                    <Link href="/" className="inline-flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center text-sm font-bold shadow-glow">
                            AB
                        </div>
                        <span className="text-3xl font-display font-bold">
                            Autobazar<span className="text-accent font-light">123</span>
                        </span>
                    </Link>

                    <h1 className="text-4xl xl:text-5xl font-display font-semibold mb-6 leading-tight">
                        Vitajte späť vo svete <br /> <span className="text-accent">prémiových áut</span>
                    </h1>
                    <p className="text-lg text-gray-300 mb-12 leading-relaxed">
                        Prihláste sa a pokračujte v hľadaní vášho dokonalého auta, alebo spravujte svoje inzeráty.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">50k+</div>
                            <div className="text-sm text-gray-400">Aktívnych inzerátov</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">10k+</div>
                            <div className="text-sm text-gray-400">Spokojných zákazníkov</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <span className="text-2xl font-display font-bold text-text-primary">
                                Autobazar<span className="text-accent font-light">123</span>
                            </span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div>
                        <h2 className="text-3xl font-display font-bold text-text-primary">
                            {t('login')}
                        </h2>
                        <p className="mt-2 text-text-tertiary">
                            {t('noAccount')}{' '}
                            <Link href="/auth/register" className="font-medium text-accent hover:text-accent-hover transition-colors underline decoration-transparent hover:decoration-current">
                                {t('registerNow')}
                            </Link>
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="bg-success-subtle border border-success/20 text-success px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {message}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
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
                                    className="w-full px-5 py-3.5 rounded-xl bg-background-tertiary border-2 border-transparent focus:border-digital focus:bg-white transition-all outline-none font-medium"
                                    placeholder="vas@email.sk"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                                        {t('password')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-sm font-medium text-text-tertiary hover:text-accent transition-colors"
                                    >
                                        {t('forgotPassword')}
                                    </button>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-xl bg-background-tertiary border-2 border-transparent focus:border-digital focus:bg-white transition-all outline-none font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                t('login')
                            )}
                        </button>
                    </form>

                    {/* Social login */}
                    <div className="pt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full h-px bg-border-subtle" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                <span className="px-4 bg-background text-text-muted font-medium">{t('orContinueWith')}</span>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-3 px-4 py-3 border border-border-strong rounded-xl hover:bg-background-tertiary hover:border-text-primary transition-all"
                                onClick={() => {
                                    const redirectTo = `https://autobazar123.sk/auth/callback`
                                    supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: { redirectTo }
                                    })
                                }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="font-medium text-text-primary">{t('google')}</span>
                            </button>

                            <button
                                type="button"
                                className="flex items-center justify-center gap-3 px-4 py-3 border border-border-strong rounded-xl hover:bg-background-tertiary hover:border-text-primary transition-all"
                                onClick={() => supabase.auth.signInWithOAuth({
                                    provider: 'facebook',
                                    options: {
                                        redirectTo: `https://autobazar123.sk/auth/callback`,
                                    }
                                })}
                            >
                                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span className="font-medium text-text-primary">{t('facebook')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
