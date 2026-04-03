function StatCard({ value, label }) {
    return (
        <div className="glass-card rounded-3xl p-5">
            <div className="text-3xl font-semibold text-white">{value}</div>
            <div className="mt-1 text-sm text-slate-300">{label}</div>
        </div>
    )
}

export default StatCard