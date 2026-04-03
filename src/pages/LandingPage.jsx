import FeatureCard from '../components/FeatureCard'
import StatCard from '../components/StatCard'

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

function LandingPage({ onLogin, onSignup }) {
    return (
        <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
                <header className="mb-8 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                    <div className="flex items-center gap-3 text-left">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-lg font-bold text-slate-950">
                            O
                        </span>
                        <span>
                            <span className="block text-sm text-slate-300">Simple split bills</span>
                            <span className="block text-lg font-semibold text-white">OweBuddy</span>
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button className="nav-pill nav-pill-active" onClick={onLogin} type="button">
                            Login
                        </button>
                        <button className="nav-pill" onClick={onSignup} type="button">
                            Sign up
                        </button>
                    </div>
                </header>

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
                            <button className="btn-primary" onClick={onSignup} type="button">
                                Start free
                            </button>
                            <button className="btn-secondary" onClick={onLogin} type="button">
                                Log in
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {stats.map((item) => (
                                <StatCard key={item.label} label={item.label} value={item.value} />
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
                                    <FeatureCard
                                        key={feature.title}
                                        description={feature.description}
                                        title={feature.title}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <button className="glass-button" onClick={onLogin} type="button">
                                <span className="text-sm text-slate-300">Already have an account?</span>
                                <span className="mt-1 text-lg font-semibold text-white">Open login</span>
                            </button>
                            <button className="glass-button" onClick={onSignup} type="button">
                                <span className="text-sm text-slate-300">New here?</span>
                                <span className="mt-1 text-lg font-semibold text-white">Create account</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default LandingPage