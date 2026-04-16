import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import FormField from '../components/FormField'
import { auth } from '../lib/firebase'

const getSignupErrorMessage = (error) => {
    switch (error?.code) {
        case 'auth/configuration-not-found':
        case 'auth/operation-not-allowed':
            return 'Enable Email/Password sign-in in Firebase Console > Authentication > Sign-in method.'
        case 'auth/email-already-in-use':
            return 'That email is already registered. Use Log in instead.'
        case 'auth/invalid-email':
            return 'Enter a valid email address.'
        case 'auth/weak-password':
            return 'Use a stronger password with at least 6 characters.'
        default:
            return error?.message || 'Sign up failed. Check your Firebase Auth setup.'
    }
}

function SignupPage({ onBack, onOpenLogin, onSignupSuccess }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const normalizedEmail = form.email.trim().toLowerCase()
        const normalizedName = form.name.trim()

        if (!normalizedEmail || !form.password || !form.confirmPassword) {
            setErrorMessage('Email and password fields are required.')
            return
        }

        if (form.password !== form.confirmPassword) {
            setErrorMessage('Passwords do not match.')
            return
        }

        if (!auth) {
            setErrorMessage('Firebase is not configured.')
            return
        }

        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, form.password)
            await updateProfile(credentials.user, {
                displayName: normalizedName || normalizedEmail,
            })
            onSignupSuccess(credentials.user)
        } catch (error) {
            setErrorMessage(getSignupErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />

            <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-5 py-8 sm:px-8 lg:px-12">
                <section className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div className="space-y-6">
                        <button className="nav-link" onClick={onBack} type="button">
                            ← Back to landing
                        </button>

                        <div className="space-y-4">
                            <span className="inline-flex w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-sm text-emerald-100">
                                Create account
                            </span>
                            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                                Set up your OweBuddy profile.
                            </h1>
                            <p className="max-w-lg text-base leading-7 text-slate-300">
                                Create a Firebase account for this project and save your profile name.
                            </p>
                        </div>
                    </div>

                    <form className="glass-card rounded-[2rem] p-6 sm:p-8" onSubmit={handleSubmit}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Full name" hint="Saved to your Firebase profile">
                                <input
                                    className="auth-input"
                                    name="name"
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    type="text"
                                    value={form.name}
                                />
                            </FormField>

                            <FormField label="Email address" hint="Used for your Firebase account">
                                <input
                                    className="auth-input"
                                    name="email"
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    type="email"
                                    value={form.email}
                                />
                            </FormField>

                            <FormField label="Password" hint="Firebase Auth stores this securely">
                                <input
                                    className="auth-input"
                                    name="password"
                                    onChange={handleChange}
                                    placeholder="Create any password"
                                    type="password"
                                    value={form.password}
                                />
                            </FormField>

                            <FormField label="Confirm password" hint="Must match the password above">
                                <input
                                    className="auth-input"
                                    name="confirmPassword"
                                    onChange={handleChange}
                                    placeholder="Repeat your password"
                                    type="password"
                                    value={form.confirmPassword}
                                />
                            </FormField>
                        </div>

                        <div className="mt-5 space-y-4">
                            <label className="flex items-start gap-3 text-sm text-slate-300">
                                <input className="mt-1 accent-amber-300" type="checkbox" />
                                <span>I want occasional updates about new features.</span>
                            </label>

                            <button className="btn-primary w-full" type="submit">
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                            </button>
                            <button className="btn-secondary w-full" onClick={onOpenLogin} type="button">
                                I already have an account
                            </button>
                            {errorMessage ? <div className="text-sm text-rose-300">{errorMessage}</div> : null}
                        </div>
                    </form>
                </section>
            </div>
        </main>
    )
}

export default SignupPage