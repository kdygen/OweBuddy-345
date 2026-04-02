const features = [
  'Vite for fast local development',
  'React for component-driven UI',
  'Tailwind for utility-first styling',
]

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,1),_rgba(2,6,23,1))]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16 sm:px-10 lg:px-12">
        <section className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm font-medium text-cyan-200">
              React + Tailwind + Vite
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              A clean starter for building the OweBuddy app.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              This is a minimal foundation with a modern build setup, a polished landing
              page, and the files you need to start shipping features immediately.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
                href="https://vite.dev"
                target="_blank"
                rel="noreferrer"
              >
                Vite docs
              </a>
              <a
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                href="https://tailwindcss.com"
                target="_blank"
                rel="noreferrer"
              >
                Tailwind docs
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
            <div className="mb-5 flex items-center justify-between text-sm text-slate-300">
              <span>Project stack</span>
              <span>Ready to extend</span>
            </div>
            <div className="space-y-4">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}