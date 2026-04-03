import { useMemo, useState } from 'react'
import AddFriendForm from '../components/AddFriendForm'
import DashboardSidebar from '../components/DashboardSidebar'
import FriendsList from '../components/FriendsList'

const initialFriends = [
    {
        id: 'friend-1',
        name: 'Bex Abila',
        email: 'bex@example.com',
        note: 'Shared lunch from yesterday',
        status: 'Owes $18',
    },
    {
        id: 'friend-2',
        name: 'Yunus Abdurakhman',
        email: 'yunus@example.com',
        note: 'Trip costs still open',
        status: 'Paid $42',
    },
    {
        id: 'friend-3',
        name: 'Margulan Kudaibergen',
        email: 'margulan@example.com',
        note: 'Roommate expenses',
        status: 'Balanced',
    },
]

const initialAddFriendForm = {
    name: '',
    email: '',
    note: '',
}

function DashboardPage({ userName, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [friends, setFriends] = useState(initialFriends)
    const [addFriendForm, setAddFriendForm] = useState(initialAddFriendForm)
    const [notice, setNotice] = useState('')

    const summary = useMemo(
        () => [
            { value: '$126', label: 'total shared' },
            { value: '3', label: 'active people' },
            { value: '2', label: 'pending balances' },
            { value: '0', label: 'overdue items' },
        ],
        [],
    )

    const handleAddFriendChange = (event) => {
        const { name, value } = event.target
        setAddFriendForm((current) => ({ ...current, [name]: value }))
    }

    const handleAddFriendSubmit = (event) => {
        event.preventDefault()

        const newFriend = {
            id: `${Date.now()}`,
            name: addFriendForm.name || 'New Friend',
            email: addFriendForm.email || 'No email added',
            note: addFriendForm.note || 'Added from the dashboard',
            status: 'Just added',
        }

        setFriends((current) => [newFriend, ...current])
        setAddFriendForm(initialAddFriendForm)
        setActiveTab('friends')
        setNotice(`${newFriend.name} has been added locally.`)
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                    <div>
                        <div className="text-sm text-slate-300">Welcome back</div>
                        <div className="text-xl font-semibold text-white">{userName}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
                            Dashboard is live
                        </span>
                        <button className="btn-secondary" onClick={onLogout} type="button">
                            Log out
                        </button>
                    </div>
                </header>

                <div className="grid flex-1 gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
                    <DashboardSidebar
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                        onLogout={onLogout}
                        userName={userName}
                    />

                    <section className="glass-card rounded-[2rem] p-5 sm:p-6 lg:p-8">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-slate-400">Dashboard</div>
                                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                                    {activeTab === 'overview'
                                        ? 'Keep your group balance clear.'
                                        : activeTab === 'friends'
                                            ? 'All friends in one place.'
                                            : 'Add someone to the group.'}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                    The dashboard is fully frontend-only for now, but the layout is ready for
                                    real data later.
                                </p>
                            </div>

                            {notice ? (
                                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                                    {notice}
                                </div>
                            ) : null}
                        </div>

                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {summary.map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-3xl border border-white/10 bg-white/5 p-5"
                                        >
                                            <div className="text-3xl font-semibold text-white">{item.value}</div>
                                            <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-white">Recent activity</h2>
                                            <span className="text-sm text-slate-400">Today</span>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                'Bex added a lunch split of $24',
                                                'Trip balance updated for Yunus',
                                                'A new group settled one expense',
                                            ].map((item) => (
                                                <div
                                                    key={item}
                                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
                                                >
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h2 className="text-lg font-semibold text-white">Quick flow</h2>
                                        <div className="mt-4 space-y-3 text-sm text-slate-300">
                                            {[
                                                'Register or sign up',
                                                'Set up your profile',
                                                'Open the dashboard',
                                                'Browse the friends list',
                                                'Add a new friend',
                                            ].map((step, index) => (
                                                <div
                                                    key={step}
                                                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                                >
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-slate-950">
                                                        {index + 1}
                                                    </span>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'friends' && (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Friends List</h2>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => setActiveTab('add-friend')}
                                            type="button"
                                        >
                                            Add friend
                                        </button>
                                    </div>
                                    <FriendsList friends={friends} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'add-friend' && (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Add Friend</h2>
                                            <p className="text-sm text-slate-400">Save a new friend locally for now.</p>
                                        </div>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => setActiveTab('friends')}
                                            type="button"
                                        >
                                            View list
                                        </button>
                                    </div>

                                    <AddFriendForm
                                        form={addFriendForm}
                                        onChange={handleAddFriendChange}
                                        onSubmit={handleAddFriendSubmit}
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    )
}

export default DashboardPage