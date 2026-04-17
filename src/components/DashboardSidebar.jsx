import { useState } from 'react'

const items = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'groups', label: 'Groups' },
    { key: 'friends', label: 'Friends' },
]

function DashboardSidebar({ activeTab, onChangeTab, onLogout, onToggleTheme, userName, isDarkTheme }) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

    return (
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <h2 className="text-lg font-semibold text-white">Owebuddy</h2>

                <button
                    aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="sidebar-button ml-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-amber-300/60 hover:bg-amber-300/10 hover:text-black"
                    onClick={onToggleTheme}
                    type="button"
                    title={isDarkTheme ? 'Light mode' : 'Dark mode'}
                >
                    {isDarkTheme ? (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                            <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
                            <circle cx="12" cy="12" r="4" />
                        </svg>
                    ) : (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                            <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 1 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
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
