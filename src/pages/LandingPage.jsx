import FeatureCard from '../components/FeatureCard'
import DotField from '../components/DotField'

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
        title: 'Transparent settlements',
        description: 'See exactly who owes who with clear, easy-to-understand settlement breakdowns.',
    },
]

function LandingPage({ onLogin, onSignup }) {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
            <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
                <DotField
                    dotRadius={1.5}
                    dotSpacing={14}
                    bulgeStrength={67}
                    glowRadius={160}
                    sparkle={false}
                    waveAmplitude={0}
                    gradientFrom="rgba(245, 158, 11, 0.28)"
                    gradientTo="rgba(56, 189, 248, 0.2)"
                    glowColor="#120F17"
                />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
                <header className="mb-8 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                    <div className="flex items-center text-left">
                        <span>
                            <span className="block text-2xl font-semibold tracking-tight text-white sm:text-3xl">OweBuddy</span>
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

                    </div>

                    <div className="space-y-5">
                        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
                            <div className="flex items-center justify-between text-sm text-slate-300">
                                <span>What you get</span>
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
                    </div>
                </section>
            </div>
        </main>
    )
}

export default LandingPage