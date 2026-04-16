import { useEffect, useMemo, useState } from 'react'
import AddFriendForm from '../components/AddFriendForm'
import DashboardSidebar from '../components/DashboardSidebar'
import FormField from '../components/FormField'
import FriendsList from '../components/FriendsList'
import { calculateGroupBalances } from '../utils/groupBalances'

const screenTitles = {
    overview: 'Dashboard overview',
    friends: 'Friends',
    'add-friend': 'Add friend',
    'friend-profile': 'Friend profile',
    groups: 'Groups',
    'create-group': 'Create group',
    'group-details': 'Group details',
    'add-expense': 'Add expense',
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

const initialExpenseForm = {
    amount: '',
    paidByMemberId: '',
    owedByMemberIds: [],
    editExpenseId: null,
}

const groupRecords = [
    {
        id: 1,
        name: 'Roommates',
        members: [
            { id: 'u1', name: 'You' },
            { id: 'r1', name: 'Kim' },
            { id: 'r2', name: 'Alex' },
            { id: 'r3', name: 'Mia' },
            { id: 'r4', name: 'Jordan' },
        ],
        expenses: [
            {
                id: 'r-exp-1',
                amount: 120,
                paidByMemberId: 'u1',
                owedByMemberIds: ['r1', 'r2', 'r3', 'r4'],
            },
        ],
    },
    {
        id: 2,
        name: 'Trip to Paris',
        members: [
            { id: 'u1', name: 'You' },
            { id: 'p1', name: 'Taylor' },
            { id: 'p2', name: 'Sam' },
            { id: 'p3', name: 'Chris' },
        ],
        expenses: [
            {
                id: 'p-exp-1',
                amount: 700,
                paidByMemberId: 'u1',
                owedByMemberIds: ['p1', 'p2', 'p3'],
            },
        ],
    },
    {
        id: 3,
        name: 'Food Group',
        members: [
            { id: 'u1', name: 'You' },
            { id: 'f1', name: 'Noah' },
            { id: 'f2', name: 'Emma' },
            { id: 'f3', name: 'Olivia' },
        ],
        expenses: [],
    },
]

function DashboardPage({ userName, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [theme, setTheme] = useState('dark')
    const [friends] = useState([])
    const [addFriendForm, setAddFriendForm] = useState(initialAddFriendForm)
    const [createGroupForm, setCreateGroupForm] = useState(initialCreateGroupForm)
    const [groups, setGroups] = useState(groupRecords)
    const [groupSearch, setGroupSearch] = useState('')
    const [selectedGroupId, setSelectedGroupId] = useState(groupRecords[0].id)
    const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
    const [notice, setNotice] = useState('')

    const groupsWithBalances = useMemo(() => {
        return groups.map((group) => calculateGroupBalances(group, 'You'))
    }, [groups])

    const selectedGroupRecord = useMemo(() => {
        return groups.find((group) => group.id === selectedGroupId) || groups[0]
    }, [groups, selectedGroupId])

    const filteredGroups = useMemo(() => {
        const value = groupSearch.trim().toLowerCase()
        if (!value) return groupsWithBalances
        return groupsWithBalances.filter((group) => group.name.toLowerCase().includes(value))
    }, [groupSearch, groupsWithBalances])

    const groupStats = useMemo(() => {
        const totalGroups = groupsWithBalances.length
        const totalYouOwe = groupsWithBalances.reduce((sum, group) => sum + group.youOwe, 0)
        const totalYouAreOwed = groupsWithBalances.reduce((sum, group) => sum + group.youAreOwed, 0)
        const netBalance = totalYouAreOwed - totalYouOwe

        return {
            totalGroups,
            totalYouOwe,
            totalYouAreOwed,
            netBalance,
        }
    }, [groupsWithBalances])

    const selectedGroup = useMemo(() => {
        return (
            groupsWithBalances.find((group) => group.id === selectedGroupId) ||
            groupsWithBalances[0]
        )
    }, [groupsWithBalances, selectedGroupId])

    useEffect(() => {
        if (!selectedGroupRecord) return
        const defaultPayerId = selectedGroupRecord.members[0]?.id || ''
        const defaultOwedByIds = selectedGroupRecord.members
            .filter((member) => member.id !== defaultPayerId)
            .map((member) => member.id)

        setExpenseForm({
            amount: '',
            paidByMemberId: defaultPayerId,
            owedByMemberIds: defaultOwedByIds,
            editExpenseId: null,
        })
    }, [selectedGroupRecord])

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

    const handleExpenseAmountChange = (event) => {
        const { value } = event.target
        setExpenseForm((current) => ({ ...current, amount: value }))
    }

    const handleExpensePayerChange = (event) => {
        const paidByMemberId = event.target.value
        setExpenseForm((current) => ({
            ...current,
            paidByMemberId,
            owedByMemberIds: current.owedByMemberIds.filter((memberId) => memberId !== paidByMemberId),
        }))
    }

    const handleExpenseParticipantToggle = (memberId) => {
        setExpenseForm((current) => {
            const isSelected = current.owedByMemberIds.includes(memberId)
            return {
                ...current,
                owedByMemberIds: isSelected
                    ? current.owedByMemberIds.filter((id) => id !== memberId)
                    : [...current.owedByMemberIds, memberId],
            }
        })
    }

    const resetExpenseForm = () => {
        if (!selectedGroupRecord) {
            setExpenseForm(initialExpenseForm)
            return
        }

        const defaultPayerId = selectedGroupRecord.members[0]?.id || ''
        const defaultOwedByIds = selectedGroupRecord.members
            .filter((member) => member.id !== defaultPayerId)
            .map((member) => member.id)

        setExpenseForm({
            amount: '',
            paidByMemberId: defaultPayerId,
            owedByMemberIds: defaultOwedByIds,
            editExpenseId: null,
        })
    }

    const handleExpenseSubmit = (event) => {
        event.preventDefault()
        if (!selectedGroupRecord) return

        const amount = Number(expenseForm.amount)
        if (!amount || amount <= 0) {
            setNotice('Please enter a valid expense amount greater than 0.')
            return
        }

        if (!expenseForm.paidByMemberId) {
            setNotice('Please choose who paid for this expense.')
            return
        }

        if (!expenseForm.owedByMemberIds.length) {
            setNotice('Please choose at least one participant who owes part of the expense.')
            return
        }

        const nextExpense = {
            id: expenseForm.editExpenseId || `exp-${Date.now()}`,
            amount,
            paidByMemberId: expenseForm.paidByMemberId,
            owedByMemberIds: expenseForm.owedByMemberIds,
        }

        setGroups((currentGroups) => {
            return currentGroups.map((group) => {
                if (group.id !== selectedGroupRecord.id) return group

                const nextExpenses = expenseForm.editExpenseId
                    ? group.expenses.map((expense) =>
                          expense.id === expenseForm.editExpenseId ? nextExpense : expense,
                      )
                    : [...group.expenses, nextExpense]

                return { ...group, expenses: nextExpenses }
            })
        })

        setNotice(expenseForm.editExpenseId ? 'Expense updated and balances recalculated.' : 'Expense added and balances recalculated.')
        resetExpenseForm()
        setActiveTab('group-details')
    }

    const handleExpenseEdit = (expense) => {
        if (!selectedGroupRecord) return

        const defaultOwedByIds = selectedGroupRecord.members
            .filter((member) => member.id !== expense.paidByMemberId)
            .map((member) => member.id)

        setExpenseForm({
            amount: String(expense.amount),
            paidByMemberId: expense.paidByMemberId,
            owedByMemberIds:
                Array.isArray(expense.owedByMemberIds) && expense.owedByMemberIds.length
                    ? expense.owedByMemberIds
                    : defaultOwedByIds,
            editExpenseId: expense.id,
        })

        setNotice('Editing expense. Save to recalculate balances.')
        setActiveTab('add-expense')
    }

    const handleExpenseDelete = (expenseId) => {
        if (!selectedGroupRecord) return

        setGroups((currentGroups) => {
            return currentGroups.map((group) => {
                if (group.id !== selectedGroupRecord.id) return group
                return {
                    ...group,
                    expenses: group.expenses.filter((expense) => expense.id !== expenseId),
                }
            })
        })

        if (expenseForm.editExpenseId === expenseId) {
            resetExpenseForm()
        }

        setNotice('Expense deleted and balances recalculated.')
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
                                            <div className="mt-1 text-xs text-slate-400">{group.membersCount} members</div>
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
                                        Add or edit expenses below. Balances and settlements recalculate instantly.
                                    </p>
                                    <div className="mt-4">
                                        <button className="btn-primary" onClick={() => setActiveTab('add-expense')} type="button">
                                            Add expense
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Expenses in this group</h3>
                                        <span className="text-sm text-slate-400">{selectedGroup.expenses.length} total</span>
                                    </div>

                                    {selectedGroup.expenses.length ? (
                                        <div className="space-y-3">
                                            {selectedGroup.expenses.map((expense) => {
                                                const payer = selectedGroupRecord.members.find(
                                                    (member) => member.id === expense.paidByMemberId,
                                                )
                                                const participantIds =
                                                    Array.isArray(expense.owedByMemberIds) && expense.owedByMemberIds.length
                                                        ? expense.owedByMemberIds
                                                        : selectedGroupRecord.members
                                                              .filter((member) => member.id !== expense.paidByMemberId)
                                                              .map((member) => member.id)
                                                const participants = participantIds
                                                    .map((memberId) =>
                                                        selectedGroupRecord.members.find((member) => member.id === memberId),
                                                    )
                                                    .filter(Boolean)

                                                return (
                                                    <div key={expense.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-semibold text-white">
                                                                    {payer?.name || 'Unknown'} paid ${expense.amount}
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-400">
                                                                    Split between {participants.map((person) => person.name).join(', ') || 'No one'}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="btn-secondary"
                                                                    onClick={() => handleExpenseEdit(expense)}
                                                                    type="button"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="btn-secondary"
                                                                    onClick={() => handleExpenseDelete(expense.id)}
                                                                    type="button"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                                            No expenses yet. Add one above to generate balances.
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Members in this group</h3>
                                        <span className="text-sm text-slate-400">{selectedGroup.membersCount} members</span>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {selectedGroup.people.map((person) => (
                                            <div key={person.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                                                    <div>
                                                        <div>Name</div>
                                                        <div className="mt-1 text-sm font-semibold text-white">{person.name}</div>
                                                    </div>
                                                    <div>
                                                        <div>Balance</div>
                                                        <div className="mt-1 text-sm font-semibold text-emerald-400">
                                                            {person.net > 0
                                                                ? `Gets $${Math.abs(person.net).toFixed(2)}`
                                                                : person.net < 0
                                                                  ? `Owes $${Math.abs(person.net).toFixed(2)}`
                                                                  : 'Settled'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Who owes who</h3>
                                        <span className="text-sm text-slate-400">{selectedGroup.settlements.length} transfers</span>
                                    </div>

                                    {selectedGroup.settlements.length ? (
                                        <div className="space-y-2">
                                            {selectedGroup.settlements.map((item, index) => (
                                                <div
                                                    key={`${item.fromMemberId}-${item.toMemberId}-${index}`}
                                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                                                >
                                                    <span className="font-semibold text-rose-300">{item.fromName}</span>
                                                    <span className="mx-2 text-slate-400">owes</span>
                                                    <span className="font-semibold text-emerald-300">{item.toName}</span>
                                                    <span className="mx-2 text-slate-400">$</span>
                                                    <span className="font-semibold text-white">{item.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                                            Everyone is settled.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'add-expense' && (
                            <div className="space-y-4">
                                <button className="btn-secondary" onClick={() => setActiveTab('group-details')} type="button">
                                    Back to group details
                                </button>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">
                                        {selectedGroup.name} - {expenseForm.editExpenseId ? 'Edit Expense' : 'Add Expense'}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Enter the expense details, then submit to return to this group page.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">
                                            {expenseForm.editExpenseId ? 'Edit expense' : 'Add expense'}
                                        </h3>
                                        {expenseForm.editExpenseId ? (
                                            <button className="btn-secondary" onClick={resetExpenseForm} type="button">
                                                Clear form
                                            </button>
                                        ) : null}
                                    </div>

                                    <form className="space-y-4" onSubmit={handleExpenseSubmit}>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="text-xs text-slate-400" htmlFor="expense-amount">
                                                    Amount
                                                </label>
                                                <input
                                                    id="expense-amount"
                                                    className="auth-input mt-2"
                                                    min="0"
                                                    onChange={handleExpenseAmountChange}
                                                    placeholder="120"
                                                    step="0.01"
                                                    type="number"
                                                    value={expenseForm.amount}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs text-slate-400" htmlFor="expense-payer">
                                                    Who paid?
                                                </label>
                                                <select
                                                    id="expense-payer"
                                                    className="auth-input mt-2"
                                                    onChange={handleExpensePayerChange}
                                                    value={expenseForm.paidByMemberId}
                                                >
                                                    {selectedGroupRecord.members.map((member) => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-slate-400">Who owes a share?</div>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                {selectedGroupRecord.members
                                                    .filter((member) => member.id !== expenseForm.paidByMemberId)
                                                    .map((member) => {
                                                        const checked = expenseForm.owedByMemberIds.includes(member.id)
                                                        return (
                                                            <label
                                                                key={member.id}
                                                                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                                                            >
                                                                <input
                                                                    checked={checked}
                                                                    className="h-4 w-4"
                                                                    onChange={() => handleExpenseParticipantToggle(member.id)}
                                                                    type="checkbox"
                                                                />
                                                                {member.name}
                                                            </label>
                                                        )
                                                    })}
                                            </div>
                                        </div>

                                        <button className="btn-primary" type="submit">
                                            {expenseForm.editExpenseId ? 'Save expense' : 'Add expense'}
                                        </button>
                                    </form>
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
