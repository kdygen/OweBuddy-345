import { useState } from 'react'
import AddFriendForm from '../components/AddFriendForm'
import DashboardSidebar from '../components/DashboardSidebar'
import FormField from '../components/FormField'
import FriendsList from '../components/FriendsList'

const summary = [
    { value: '0', label: 'total shared' },
    { value: '0', label: 'active people' },
    { value: '0', label: 'pending balances' },
    { value: '0', label: 'overdue items' },
]

const screenTitles = {
    overview: 'Keep your group balance clear.',
    friends: 'All friends in one place.',
    'add-friend': 'Add someone to the group.',
    groups: 'Groups list is ready.',
    'create-group': 'Create a new group.',
    'friend-profile': 'Friend profile and details.',
    'group-details': 'Group details, members, and expenses.',
    'invite-members': 'Invite or add members.',
    'add-expense': 'Add a new expense.',
    'expense-history': 'Expense history and all transactions.',
    'transaction-details': 'Transaction details.',
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

const initialInviteForm = {
    email: '',
    note: '',
}

const initialExpenseForm = {
    title: '',
    amount: '0',
    note: '',
}

function EmptyPanel({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold text-white">{title}</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>

            <div className="mt-5 flex flex-wrap gap-3">
                {actionLabel ? (
                    <button className="btn-primary" onClick={onAction} type="button">
                        {actionLabel}
                    </button>
                ) : null}

                {secondaryActionLabel ? (
                    <button className="btn-secondary" onClick={onSecondaryAction} type="button">
                        {secondaryActionLabel}
                    </button>
                ) : null}
            </div>
        </div>
    )
}

function DashboardPage({ userName, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [friends] = useState([])
    const [addFriendForm, setAddFriendForm] = useState(initialAddFriendForm)
    const [createGroupForm, setCreateGroupForm] = useState(initialCreateGroupForm)
    const [inviteForm, setInviteForm] = useState(initialInviteForm)
    const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
    const [notice, setNotice] = useState('')

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

    const handleInviteChange = (event) => {
        const { name, value } = event.target
        setInviteForm((current) => ({ ...current, [name]: value }))
    }

    const handleInviteSubmit = (event) => {
        event.preventDefault()
        setInviteForm(initialInviteForm)
        setNotice('Invite/Add Members is ready, but nothing is stored until the backend is connected.')
    }

    const handleExpenseChange = (event) => {
        const { name, value } = event.target
        setExpenseForm((current) => ({ ...current, [name]: value }))
    }

    const handleExpenseSubmit = (event) => {
        event.preventDefault()
        setExpenseForm(initialExpenseForm)
        setNotice('Add Expense is ready, but nothing is stored until the backend is connected.')
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
                                    {screenTitles[activeTab]}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                    The dashboard is fully frontend-only for now, with empty states and zeroed
                                    counts until the backend is connected.
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
                                            <span className="text-sm text-slate-400">0 items</span>
                                        </div>

                                        <EmptyPanel
                                            title="0 recent activities"
                                            description="No activity yet. Once the backend is connected, this area will show recent updates here."
                                        />
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h2 className="text-lg font-semibold text-white">Quick flow</h2>
                                        <div className="mt-4 grid gap-3 text-sm text-slate-300">
                                            {[
                                                ['Friends List', 'open the people screen', 'friends'],
                                                ['Groups List', 'open the group screen', 'groups'],
                                                ['Create Group', 'start a new group shell', 'create-group'],
                                                ['Add Friend', 'save a local contact form', 'add-friend'],
                                            ].map(([label, description, tab]) => (
                                                <button
                                                    key={label}
                                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                                                    onClick={() => setActiveTab(tab)}
                                                    type="button"
                                                >
                                                    <span>
                                                        <span className="block font-semibold text-white">{label}</span>
                                                        <span className="block text-sm text-slate-400">{description}</span>
                                                    </span>
                                                    <span className="text-xs text-slate-400">0</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
                                        Open friend profile
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
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Add Friend</h2>
                                            <p className="text-sm text-slate-400">
                                                This form resets after submit until backend storage is added.
                                            </p>
                                        </div>
                                        <button className="btn-secondary" onClick={() => setActiveTab('friends')} type="button">
                                            View list
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
                            </div>
                        )}

                        {activeTab === 'groups' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('create-group')} type="button">
                                        Create group
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('group-details')} type="button">
                                        Open group details
                                    </button>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Groups List</h2>
                                        <span className="text-sm text-slate-400">0 groups</span>
                                    </div>
                                    <EmptyPanel
                                        title="0 groups created"
                                        description="There are no groups yet. The list stays empty until the backend creates real group records."
                                        actionLabel="Create group"
                                        onAction={() => setActiveTab('create-group')}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'create-group' && (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Create Group</h2>
                                            <p className="text-sm text-slate-400">This screen is ready for backend wiring.</p>
                                        </div>
                                        <button className="btn-secondary" onClick={() => setActiveTab('groups')} type="button">
                                            View groups
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
                            </div>
                        )}

                        {activeTab === 'friend-profile' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('friends')} type="button">
                                        Back to friends
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('add-friend')} type="button">
                                        Add friend
                                    </button>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-3">
                                    {[
                                        { label: '0 shared expenses', value: '0' },
                                        { label: '0 open balances', value: '0' },
                                        { label: '0 groups linked', value: '0' },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <div className="text-3xl font-semibold text-white">{item.value}</div>
                                            <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">Friend Profile / Details</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        This profile is intentionally empty for now. Real friend records will fill
                                        this screen once the backend is connected.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'group-details' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('invite-members')} type="button">
                                        Invite / add members
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('add-expense')} type="button">
                                        Add expense
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('expense-history')} type="button">
                                        Expense history
                                    </button>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-3">
                                    {[
                                        { label: '0 members', value: '0' },
                                        { label: '0 expenses', value: '0' },
                                        { label: '0 balance', value: '0' },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <div className="text-3xl font-semibold text-white">{item.value}</div>
                                            <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-6 xl:grid-cols-2">
                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-white">Members + Expenses</h2>
                                            <span className="text-sm text-slate-400">0 / 0</span>
                                        </div>
                                        <EmptyPanel
                                            title="0 members and 0 expenses"
                                            description="No members or expenses yet. Both sections will populate after the backend is available."
                                            actionLabel="Invite members"
                                            onAction={() => setActiveTab('invite-members')}
                                            secondaryActionLabel="Add expense"
                                            onSecondaryAction={() => setActiveTab('add-expense')}
                                        />
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h2 className="text-lg font-semibold text-white">Group Details</h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">
                                            This is the combined group detail view from your diagram. It is wired as
                                            a shell only and shows zeroed metrics until real data exists.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'invite-members' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('group-details')} type="button">
                                        Back to group details
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('add-expense')} type="button">
                                        Add expense
                                    </button>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">Invite/Add Members</h2>
                                    <p className="mt-2 text-sm text-slate-400">This form is ready but does not persist yet.</p>

                                    <form className="mt-5 space-y-5" onSubmit={handleInviteSubmit}>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FormField label="Member email" hint="Stored later">
                                                <input
                                                    className="auth-input"
                                                    name="email"
                                                    onChange={handleInviteChange}
                                                    placeholder="friend@example.com"
                                                    type="email"
                                                    value={inviteForm.email}
                                                />
                                            </FormField>

                                            <FormField label="Note" hint="Optional">
                                                <input
                                                    className="auth-input"
                                                    name="note"
                                                    onChange={handleInviteChange}
                                                    placeholder="Invite for the next trip"
                                                    type="text"
                                                    value={inviteForm.note}
                                                />
                                            </FormField>
                                        </div>

                                        <button className="btn-primary" type="submit">
                                            Send invite
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'add-expense' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('group-details')} type="button">
                                        Back to group details
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('expense-history')} type="button">
                                        View history
                                    </button>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">Add Expense</h2>
                                    <p className="mt-2 text-sm text-slate-400">The form is local only and the amount starts at 0.</p>

                                    <form className="mt-5 space-y-5" onSubmit={handleExpenseSubmit}>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FormField label="Expense title" hint="Stored later">
                                                <input
                                                    className="auth-input"
                                                    name="title"
                                                    onChange={handleExpenseChange}
                                                    placeholder="Dinner"
                                                    type="text"
                                                    value={expenseForm.title}
                                                />
                                            </FormField>

                                            <FormField label="Amount" hint="Defaults to 0">
                                                <input
                                                    className="auth-input"
                                                    name="amount"
                                                    onChange={handleExpenseChange}
                                                    placeholder="0"
                                                    type="number"
                                                    value={expenseForm.amount}
                                                />
                                            </FormField>
                                        </div>

                                        <FormField label="Note" hint="Optional">
                                            <textarea
                                                className="auth-input min-h-28 resize-none"
                                                name="note"
                                                onChange={handleExpenseChange}
                                                placeholder="Split equally, reimburse later, and so on"
                                                value={expenseForm.note}
                                            />
                                        </FormField>

                                        <button className="btn-primary" type="submit">
                                            Save expense
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'expense-history' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('group-details')} type="button">
                                        Back to group details
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('transaction-details')} type="button">
                                        Open transaction details
                                    </button>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Expense History</h2>
                                        <span className="text-sm text-slate-400">0 transactions</span>
                                    </div>
                                    <EmptyPanel
                                        title="0 transactions"
                                        description="No transactions are stored yet. Once the backend is connected, this list will show every expense and settlement."
                                        actionLabel="Open transaction details"
                                        onAction={() => setActiveTab('transaction-details')}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'transaction-details' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('expense-history')} type="button">
                                        Back to history
                                    </button>
                                    <button className="btn-secondary" onClick={() => setActiveTab('group-details')} type="button">
                                        Back to group details
                                    </button>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-3">
                                    {[
                                        { label: '0 amount', value: '0' },
                                        { label: '0 settled', value: '0' },
                                        { label: '0 remaining', value: '0' },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <div className="text-3xl font-semibold text-white">{item.value}</div>
                                            <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h2 className="text-lg font-semibold text-white">Transaction Details</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        This screen is a zeroed detail view for a single transaction. Real balances,
                                        settlement dates, and split breakdowns will be connected later.
                                    </p>
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