import { useEffect, useMemo, useState } from 'react'
import AddFriendForm from '../components/AddFriendForm'
import DashboardSidebar from '../components/DashboardSidebar'
import FormField from '../components/FormField'
import FriendsList from '../components/FriendsList'

const screenTitles = {
    overview: 'Dashboard overview',
    friends: 'Friends',
    'add-friend': 'Add friend',
    'friend-profile': 'Friend profile',
    groups: 'Groups',
    'create-group': 'Create group',
    'group-details': 'Group details',
    profile: 'Your profile',
}

const initialAddFriendForm = {
    name: '',
    email: '',
    note: '',
}

const initialCreateGroupForm = {
    name: '',
    description: '',
}

const groupRecords = [
    {
        id: 1,
        name: 'Roommates',
        members: 4,
        youOwe: 100,
        youAreOwed: 0,
        people: [
            { id: 'r1', name: 'Kim', theyOwe: 0, iOwe: 60, paidBy: 'You' },
            { id: 'r2', name: 'Alex', theyOwe: 20, iOwe: 0, paidBy: 'Alex' },
            { id: 'r3', name: 'Mia', theyOwe: 30, iOwe: 20, paidBy: 'Mia' },
            { id: 'r4', name: 'Jordan', theyOwe: 0, iOwe: 20, paidBy: 'You' },
        ],
    },
    {
        id: 2,
        name: 'Trip to Paris',
        members: 3,
        youOwe: 0,
        youAreOwed: 700,
        people: [
            { id: 'p1', name: 'Taylor', theyOwe: 250, iOwe: 0, paidBy: 'You' },
            { id: 'p2', name: 'Sam', theyOwe: 300, iOwe: 0, paidBy: 'You' },
            { id: 'p3', name: 'Chris', theyOwe: 150, iOwe: 0, paidBy: 'You' },
        ],
    },
    {
        id: 3,
        name: 'Food Group',
        members: 3,
        youOwe: 0,
        youAreOwed: 0,
        people: [
            { id: 'f1', name: 'Noah', theyOwe: 0, iOwe: 0, paidBy: 'No one' },
            { id: 'f2', name: 'Emma', theyOwe: 0, iOwe: 0, paidBy: 'No one' },
            { id: 'f3', name: 'Olivia', theyOwe: 0, iOwe: 0, paidBy: 'No one' },
        ],
    },
]

function DashboardPage({ userName, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [theme, setTheme] = useState('dark')
    const [friends] = useState([])
    const [addFriendForm, setAddFriendForm] = useState(initialAddFriendForm)
    const [createGroupForm, setCreateGroupForm] = useState(initialCreateGroupForm)
    const [groupSearch, setGroupSearch] = useState('')
    const [selectedGroupId, setSelectedGroupId] = useState(groupRecords[0].id)
    const [notice, setNotice] = useState('')

    const filteredGroups = useMemo(() => {
        const value = groupSearch.trim().toLowerCase()
        if (!value) return groupRecords
        return groupRecords.filter((group) => group.name.toLowerCase().includes(value))
    }, [groupSearch])

    const groupStats = useMemo(() => {
        const totalGroups = groupRecords.length
        const totalYouOwe = groupRecords.reduce((sum, group) => sum + group.youOwe, 0)
        const totalYouAreOwed = groupRecords.reduce((sum, group) => sum + group.youAreOwed, 0)
        const netBalance = totalYouAreOwed - totalYouOwe

        return {
            totalGroups,
            totalYouOwe,
            totalYouAreOwed,
            netBalance,
        }
    }, [])

    const selectedGroup = useMemo(() => {
        return groupRecords.find((group) => group.id === selectedGroupId) || groupRecords[0]
    }, [selectedGroupId])

    const handleAddFriendChange = (event) => {
        const { name, value } = event.target
        setAddFriendForm((current) => ({ ...current, [name]: value }))
    }

    const handleAddFriendSubmit = (event) => {
        event.preventDefault()
        setAddFriendForm(initialAddFriendForm)
        setNotice('Add Friend is ready, but nothing is stored until the backend is connected.')
    }

    const handleCreateGroupChange = (event) => {
        const { name, value } = event.target
        setCreateGroupForm((current) => ({ ...current, [name]: value }))
    }

    const handleCreateGroupSubmit = (event) => {
        event.preventDefault()
        setCreateGroupForm(initialCreateGroupForm)
        setNotice('Create Group is ready, but nothing is stored until the backend is connected.')
    }

    useEffect(() => {
        const savedTheme = window.localStorage.getItem('owebuddy-theme')
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme)
        }
    }, [])

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
            window.localStorage.setItem('owebuddy-theme', nextTheme)
            return nextTheme
        })
    }

    const isDarkTheme = theme === 'dark'

    return (
        <main
            className={`min-h-screen overflow-hidden transition-colors ${
                theme === 'dark'
                    ? 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white'
                    : 'bg-[linear-gradient(180deg,_#f8fafc,_#e2e8f0)] text-slate-900'
            }`}
            data-theme={theme}
        >
            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
                <div className="grid flex-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
                    <DashboardSidebar
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                        onLogout={onLogout}
                        userName={userName}
                    />

                    <section className="p-2 sm:p-4 lg:p-6">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-slate-400">Split Share</div>
                                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                                    {screenTitles[activeTab]}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                    Manage your shared balances with a simple frontend dashboard.
                                </p>
                            </div>

                            <button
                                aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                                className="sidebar-button flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-amber-300/60 hover:bg-amber-300/10 hover:text-black"
                                onClick={toggleTheme}
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

                            {notice ? (
                                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                                    {notice}
                                </div>
                            ) : null}
                        </div>

                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h2 className="text-xl font-semibold text-white">Welcome back</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        {userName}, use the left menu to manage friends and groups.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'friends' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('add-friend')} type="button">
                                        Add friend
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('friend-profile')} type="button">
                                        Friend profile
                                    </button>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Friends List</h2>
                                        <span className="text-sm text-slate-400">0 friends</span>
                                    </div>
                                    <FriendsList friends={friends} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'add-friend' && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Add Friend</h2>
                                        <p className="text-sm text-slate-400">Create a friend entry locally.</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => setActiveTab('friends')} type="button">
                                        Back to friends
                                    </button>
                                </div>

                                <div className="mt-5">
                                    <AddFriendForm
                                        form={addFriendForm}
                                        onChange={handleAddFriendChange}
                                        onSubmit={handleAddFriendSubmit}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'friend-profile' && (
                            <div className="space-y-4">
                                <button className="btn-secondary" onClick={() => setActiveTab('friends')} type="button">
                                    Back to friends
                                </button>
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">Friend Profile</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Profile details will appear here once backend data is connected.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'groups' && (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-2xl font-semibold text-white">Groups</h2>
                                    <button className="btn-secondary" onClick={() => setActiveTab('create-group')} type="button">
                                        + New Group
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="text-xs text-slate-400">Total Groups</div>
                                        <div className="mt-2 text-2xl font-semibold text-white">{groupStats.totalGroups}</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="text-xs text-slate-400">You Owe</div>
                                        <div className="mt-2 text-2xl font-semibold text-rose-400">${groupStats.totalYouOwe}</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="text-xs text-slate-400">You're Owed</div>
                                        <div className="mt-2 text-2xl font-semibold text-emerald-400">${groupStats.totalYouAreOwed}</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="text-xs text-slate-400">Net Balance</div>
                                        <div className="mt-2 text-2xl font-semibold text-emerald-400">${groupStats.netBalance}</div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <label className="text-xs text-slate-400" htmlFor="group-search">
                                        Search groups
                                    </label>
                                    <input
                                        id="group-search"
                                        className="auth-input mt-2"
                                        onChange={(event) => setGroupSearch(event.target.value)}
                                        placeholder="Search groups..."
                                        type="text"
                                        value={groupSearch}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {filteredGroups.map((group) => (
                                        <button
                                            key={group.id}
                                            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-amber-300/60"
                                            onClick={() => {
                                                setSelectedGroupId(group.id)
                                                setActiveTab('group-details')
                                            }}
                                            type="button"
                                        >
                                            <div className="text-base font-semibold text-white">{group.name}</div>
                                            <div className="mt-1 text-xs text-slate-400">{group.members} members</div>
                                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <div className="text-xs text-slate-400">You Owe</div>
                                                    <div className="font-semibold text-rose-400">${group.youOwe}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400">You're Owed</div>
                                                    <div className="font-semibold text-emerald-400">${group.youAreOwed}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'create-group' && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Create Group</h2>
                                        <p className="text-sm text-slate-400">This screen is ready for backend wiring.</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => setActiveTab('groups')} type="button">
                                        Back to groups
                                    </button>
                                </div>

                                <form className="mt-5 space-y-5" onSubmit={handleCreateGroupSubmit}>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField label="Group name" hint="Stored later">
                                            <input
                                                className="auth-input"
                                                name="name"
                                                onChange={handleCreateGroupChange}
                                                placeholder="Roommates"
                                                type="text"
                                                value={createGroupForm.name}
                                            />
                                        </FormField>

                                        <FormField label="Description" hint="Optional for now">
                                            <input
                                                className="auth-input"
                                                name="description"
                                                onChange={handleCreateGroupChange}
                                                placeholder="Trips, rent, or shared meals"
                                                type="text"
                                                value={createGroupForm.description}
                                            />
                                        </FormField>
                                    </div>

                                    <button className="btn-primary" type="submit">
                                        Create group
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'group-details' && (
                            <div className="space-y-4">
                                <button className="btn-secondary" onClick={() => setActiveTab('groups')} type="button">
                                    Back to groups
                                </button>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">{selectedGroup.name} - Group Details</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Members and balances for this group.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Friends in this group</h3>
                                        <span className="text-sm text-slate-400">{selectedGroup.members} members</span>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {selectedGroup.people.map((person) => (
                                            <div key={person.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="text-base font-semibold text-white">{person.name}</div>
                                                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-400">
                                                    <div>
                                                        <div>They Owe</div>
                                                        <div className="mt-1 text-sm font-semibold text-emerald-400">${person.theyOwe}</div>
                                                    </div>
                                                    <div>
                                                        <div>I Owe</div>
                                                        <div className="mt-1 text-sm font-semibold text-rose-400">${person.iOwe}</div>
                                                    </div>
                                                    <div>
                                                        <div>Paid By</div>
                                                        <div className="mt-1 text-sm font-semibold text-white">{person.paidBy}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm text-slate-400">Profile</div>
                                            <h2 className="text-2xl font-semibold text-white">{userName}</h2>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                                Manage your account from here.
                                            </p>
                                        </div>

                                        <button className="btn-primary" onClick={onLogout} type="button">
                                            Log out
                                        </button>
                                    </div>
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
