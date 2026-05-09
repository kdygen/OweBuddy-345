import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import FormField from '../components/FormField'
import { auth } from '../lib/firebase'

const getLoginErrorMessage = (error) => {
    switch (error?.code) {
        case 'auth/configuration-not-found':
        case 'auth/operation-not-allowed':
            return 'Enable Email/Password sign-in in Firebase Console > Authentication > Sign-in method.'
        case 'auth/invalid-email':
            return 'Enter a valid email address.'
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
            return 'Email or password is incorrect.'
        case 'auth/user-not-found':
            return 'No account found for that email. Create a new account first.'
        default:
            return error?.message || 'Login failed. Check your Firebase Auth setup.'
    }
}

function LoginPage({ onBack, onLoginSuccess, onOpenSignup }) {
    const [form, setForm] = useState({ email: '', password: '' })
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const normalizedEmail = form.email.trim().toLowerCase()

        if (!auth) {
            setErrorMessage('Firebase is not configured.')
            return
        }

        if (!normalizedEmail || !form.password) {
            setErrorMessage('Enter both email and password.')
            return
        }

        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, form.password)
            onLoginSuccess(credentials.user)
        } catch (error) {
            setErrorMessage(getLoginErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />

            <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-5 py-8 sm:px-8 lg:px-12">
                <section className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                    <div className="space-y-6">
                        <button className="nav-link" onClick={onBack} type="button">
                            ← Back to landing
                        </button>

                        <div className="space-y-4">
                            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
                                Welcome back
                            </span>
                            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                                Sign in to continue.
                            </h1>
                            <p className="max-w-lg text-base leading-7 text-slate-300">
                                Sign in with the Firebase account connected to this project.
                            </p>
                        </div>
                    </div>

                    <form className="glass-card rounded-[2rem] p-6 sm:p-8" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <FormField label="Email address" hint="Any email works">
                                <input
                                    className="auth-input"
                                    name="email"
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    type="email"
                                    value={form.email}
                                />
                            </FormField>

                            <FormField label="Password" hint="Firebase Auth validates this">
                                <input
                                    className="auth-input"
                                    name="password"
                                    onChange={handleChange}
                                    placeholder="Enter any password"
                                    type="password"
                                    value={form.password}
                                />
                            </FormField>

                            <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                                <label className="flex items-center gap-2">
                                    <input className="accent-amber-300" type="checkbox" />
                                    Remember me
                                </label>
                                <button className="text-amber-200 transition hover:text-amber-100" type="button">
                                    Forgot password?
                                </button>
                            </div>

                            <button className="btn-primary w-full" type="submit">
                                {isSubmitting ? 'Logging in...' : 'Log in'}
                            </button>
                            <button className="btn-secondary w-full" onClick={onOpenSignup} type="button">
                                Create a new account
                            </button>
                            {errorMessage ? <div className="text-sm text-rose-300">{errorMessage}</div> : null}
                        </div>
                    </form>
                </section>
            </div>
        </main>
    )
}

export default LoginPage