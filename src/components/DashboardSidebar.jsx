import { useState } from 'react'

const items = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'groups', label: 'Groups' },
    { key: 'friends', label: 'Friends' },
]

function DashboardSidebar({ activeTab, onChangeTab, onLogout, userName, isDarkTheme }) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

    return (
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-semibold text-white">Owebuddy</h2>
            </div>

            <div className="mt-4 space-y-2">
                {items.map((item) => {
                    const isActive = activeTab === item.key

                    return (
                        <button
                            key={item.key}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                                isActive
                                    ? 'border-amber-300/60 bg-amber-300/15 text-white'
                                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-amber-300/50 hover:bg-amber-300/10'
                            }`}
                            onClick={() => onChangeTab(item.key)}
                            type="button"
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>

            <div className="relative mt-5 border-t border-white/10 pt-4">
                <button
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:border-amber-300/50 hover:bg-amber-300/10"
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                    type="button"
                >
                    Profile
                </button>

                {isProfileMenuOpen ? (
                    <div
                        className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-white/10 p-2 shadow-2xl ${
                            isDarkTheme ? 'bg-[#111827]' : 'bg-white'
                        }`}
                    >
                        <div className="border-b border-white/10 px-2 pb-2 text-xs text-slate-400">{userName}</div>
                        <button
                            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-amber-300/10"
                            onClick={() => {
                                onChangeTab('profile')
                                setIsProfileMenuOpen(false)
                            }}
                            type="button"
                        >
                            Go to profile
                        </button>
                        <button
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-300/10"
                            onClick={onLogout}
                            type="button"
                        >
                            Log out
                        </button>
                    </div>
                ) : null}
            </div>
        </aside>
    )
}

export default DashboardSidebar
