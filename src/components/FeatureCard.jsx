function FeatureCard({ title, description }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="font-medium text-white">{title}</div>
            <div className="mt-1 text-sm leading-6 text-slate-300">{description}</div>
        </div>
    )
}

export default FeatureCard