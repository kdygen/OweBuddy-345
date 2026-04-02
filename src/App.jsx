import { useMemo, useState } from 'react'

const features = [
  {
    title: 'Split expenses cleanly',
    description: 'Track shared costs with a calm, modern interface built for groups.',
  },
  {
    title: 'Fast onboarding',
    description: 'Move from landing to login or sign up in a single tap.',
  },
  {
    title: 'Frontend only for now',
    description: 'The forms work locally and can be connected to a backend later.',
  },
]

const stats = [
  { value: '0', label: 'backend required' },
  { value: '3', label: 'core screens' },
  { value: '100%', label: 'local interaction' },
]

const initialLogin = {
  email: '',
  password: '',
}

const initialSignup = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function App() {
  const [screen, setScreen] = useState('landing')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [signupForm, setSignupForm] = useState(initialSignup)
  const [notice, setNotice] = useState({ type: '', message: '' })

  const authTitle = useMemo(() => {
    if (screen === 'login') return 'Welcome back'
    if (screen === 'signup') return 'Create your account'
    return 'OweBuddy'
  }, [screen])

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
  }

  const handleSignupChange = (event) => {
    const { name, value } = event.target
    setSignupForm((current) => ({ ...current, [name]: value }))
  }

  const handleLoginSubmit = (event) => {
    event.preventDefault()
    setNotice({
      type: 'success',
      message: `Logged in locally as ${loginForm.email || 'guest user'}.`,
    })
    setScreen('landing')
  }

  const handleSignupSubmit = (event) => {
    event.preventDefault()
    setNotice({
      type: 'success',
      message: `Account created locally for ${signupForm.name || 'new user'}.`,
    })
    setScreen('landing')
  }

  const renderLanding = () => (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="space-y-8">
        <div className="space-y-5">
          <span className="inline-flex w-fit items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1 text-sm font-medium text-amber-100">
            Simple expense tracking for groups
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Keep shared money tidy without the noise.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              OweBuddy helps friends, roommates, and travel groups keep expenses in one
              place with a clear interface, instant local form interactions, and no
              backend setup yet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => setScreen('signup')} type="button">
            Start free
          </button>
          <button className="btn-secondary" onClick={() => setScreen('login')} type="button">
            Log in
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="glass-card rounded-3xl p-5">
              <div className="text-3xl font-semibold text-white">{item.value}</div>
              <div className="mt-1 text-sm text-slate-300">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>What you get</span>
            <span>Frontend only</span>
          </div>
          <div className="mt-6 space-y-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="font-medium text-white">{feature.title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-300">
                  {feature.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button className="glass-button" onClick={() => setScreen('login')} type="button">
            <span className="text-sm text-slate-300">Already have an account?</span>
            <span className="mt-1 text-lg font-semibold text-white">Open login</span>
          </button>
          <button className="glass-button" onClick={() => setScreen('signup')} type="button">
            <span className="text-sm text-slate-300">New here?</span>
            <span className="mt-1 text-lg font-semibold text-white">Create account</span>
          </button>
        </div>
      </div>
    </section>
  )

  const renderLogin = () => (
    <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
      <div className="space-y-6">
        <button className="nav-link" onClick={() => setScreen('landing')} type="button">
          ← Back to landing
        </button>
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
            {authTitle}
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to continue.
          </h2>
          <p className="max-w-lg text-base leading-7 text-slate-300">
            Use any email and password you want. This is frontend-only and every input
            works locally.
          </p>
        </div>
      </div>

      <form className="glass-card rounded-[2rem] p-6 sm:p-8" onSubmit={handleLoginSubmit}>
        <div className="space-y-5">
          <Field label="Email address">
            <input
              className="auth-input"
              name="email"
              onChange={handleLoginChange}
              placeholder="you@example.com"
              type="email"
              value={loginForm.email}
            />
          </Field>
          <Field label="Password">
            <input
              className="auth-input"
              name="password"
              onChange={handleLoginChange}
              placeholder="Enter any password"
              type="password"
              value={loginForm.password}
            />
          </Field>

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
            Log in
          </button>
          <button className="btn-secondary w-full" onClick={() => setScreen('signup')} type="button">
            Create a new account
          </button>
        </div>
      </form>
    </section>
  )

  const renderSignup = () => (
    <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="space-y-6">
        <button className="nav-link" onClick={() => setScreen('landing')} type="button">
          ← Back to landing
        </button>
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-sm text-emerald-100">
            {authTitle}
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Set up your OweBuddy profile.
          </h2>
          <p className="max-w-lg text-base leading-7 text-slate-300">
            Add whatever details you want. The form is fully interactive and does not
            call a backend yet.
          </p>
        </div>
      </div>

      <form className="glass-card rounded-[2rem] p-6 sm:p-8" onSubmit={handleSignupSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className="auth-input"
              name="name"
              onChange={handleSignupChange}
              placeholder="Your name"
              type="text"
              value={signupForm.name}
            />
          </Field>
          <Field label="Email address">
            <input
              className="auth-input"
              name="email"
              onChange={handleSignupChange}
              placeholder="you@example.com"
              type="email"
              value={signupForm.email}
            />
          </Field>
          <Field label="Password">
            <input
              className="auth-input"
              name="password"
              onChange={handleSignupChange}
              placeholder="Create any password"
              type="password"
              value={signupForm.password}
            />
          </Field>
          <Field label="Confirm password">
            <input
              className="auth-input"
              name="confirmPassword"
              onChange={handleSignupChange}
              placeholder="Repeat your password"
              type="password"
              value={signupForm.confirmPassword}
            />
          </Field>
        </div>

        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 text-sm text-slate-300">
            <input className="mt-1 accent-amber-300" type="checkbox" />
            <span>I want occasional updates about new features.</span>
          </label>

          <button className="btn-primary w-full" type="submit">
            Create account
          </button>
          <button className="btn-secondary w-full" onClick={() => setScreen('login')} type="button">
            I already have an account
          </button>
        </div>
      </form>
    </section>
  )

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="mb-8 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <button className="flex items-center gap-3 text-left" onClick={() => setScreen('landing')} type="button">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-lg font-bold text-slate-950">
              O
            </span>
            <span>
              <span className="block text-sm text-slate-300">Simple split bills</span>
              <span className="block text-lg font-semibold text-white">OweBuddy</span>
            </span>
          </button>

          <nav className="flex flex-wrap items-center gap-2">
            <button className={`nav-pill ${screen === 'landing' ? 'nav-pill-active' : ''}`} onClick={() => setScreen('landing')} type="button">
              Landing
            </button>
            <button className={`nav-pill ${screen === 'login' ? 'nav-pill-active' : ''}`} onClick={() => setScreen('login')} type="button">
              Login
            </button>
            <button className={`nav-pill ${screen === 'signup' ? 'nav-pill-active' : ''}`} onClick={() => setScreen('signup')} type="button">
              Sign up
            </button>
          </nav>
        </header>

        <div className="flex-1">
          {screen === 'landing' && renderLanding()}
          {screen === 'login' && renderLogin()}
          {screen === 'signup' && renderSignup()}
        </div>

        <div className="mt-8">
          {notice.message ? (
            <div
              className={`rounded-3xl border px-5 py-4 text-sm backdrop-blur ${
                notice.type === 'success'
                  ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-50'
                  : 'border-white/10 bg-white/5 text-slate-200'
              }`}
            >
              {notice.message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }) {
  return (
    <label className="space-y-2 text-sm text-slate-200">
      <span className="block font-medium">{label}</span>
      {children}
    </label>
  )
}

export default App