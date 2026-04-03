const items = [
    { key: 'overview', label: 'Dashboard', description: 'Overview and quick stats' },
    { key: 'friends', label: 'Friends List', description: 'See who you owe' },
    { key: 'add-friend', label: 'Add Friend', description: 'Invite someone new' },
]

function DashboardSidebar({ activeTab, onChangeTab, onLogout, userName }) {
    return (
        <aside className="glass-card flex h-full flex-col rounded-[2rem] p-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-lg font-bold text-slate-950">
                    O
                </div>
                <div>
                    <div className="text-sm text-slate-400">Signed in as</div>
                    <div className="font-semibold text-white">{userName}</div>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {items.map((item) => {
                    const isActive = activeTab === item.key

                    return (
                        <button
                            key={item.key}
                            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${isActive
                                    ? 'border-amber-300/30 bg-amber-300/10 text-white'
                                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                                }`}
                            onClick={() => onChangeTab(item.key)}
                            type="button"
                        >
                            <div className="font-semibold">{item.label}</div>
                            <div className="mt-1 text-sm text-slate-400">{item.description}</div>
                        </button>
                    )
                })}
            </div>

            <div className="mt-auto pt-5">
                <button className="btn-secondary w-full" onClick={onLogout} type="button">
                    Log out
                </button>
            </div>
        </aside>
    )
}

export default DashboardSidebar