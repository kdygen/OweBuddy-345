import DotField from '../components/DotField'
import oweBuddyLogo from '../assets/owebuddy-logo.svg'

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
                        <img
                            src={oweBuddyLogo}
                            alt="OweBuddy"
                            className="h-10 w-auto sm:h-12"
                        />
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

                <section className="flex flex-1 items-center justify-center text-center">
                    <div className="-mt-6 space-y-5 sm:-mt-8">
                        <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Keep shared money tidy without the noise.
                        </h1>
                        <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                            OweBuddy helps friends, roommates, and travel groups keep expenses in one
                            place with a clear interface, instant local form interactions, and no backend
                            setup yet.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default LandingPage