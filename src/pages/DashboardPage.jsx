import { useEffect, useMemo, useState } from 'react'
import AddFriendForm from '../components/AddFriendForm'
import Dock from '../components/Dock'
import FormField from '../components/FormField'
import FriendsList from '../components/FriendsList'
import StaggeredMenu from '../components/StaggeredMenu'
import { hasFirebaseConfig } from '../lib/firebase'
import {
    acceptFriendRequest,
    declineFriendRequest,
    deleteFriendRecord,
    deleteGroupRecord,
    createFriendRecord,
    createGroupRecord,
    updateGroupExpenses,
    watchUserFriends,
    watchUserFriendRequests,
    watchUserGroups,
} from '../services/owebuddyFirestore'
import { calculateGroupBalances } from '../utils/groupBalances'

const screenTitles = {
    overview: 'Home',
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
    email: '',
    note: '',
}

const initialCreateGroupForm = {
    name: '',
    description: '',
    selectedFriendIds: [],
}

const initialExpenseForm = {
    amount: '',
    paidByMemberId: '',
    owedByMemberIds: [],
    editExpenseId: null,
}

const sortByName = (items) => [...items].sort((left, right) => left.name.localeCompare(right.name))

const buildDefaultExpenseForm = (group) => {
    if (!group) {
        return initialExpenseForm
    }

    const defaultPayerId = group.members[0]?.id || ''
    const defaultOwedByIds = group.members
        .filter((member) => member.id !== defaultPayerId)
        .map((member) => member.id)

    return {
        amount: '',
        paidByMemberId: defaultPayerId,
        owedByMemberIds: defaultOwedByIds,
        editExpenseId: null,
    }
}

const normalizeFriendRecord = (friend) => ({
    id: friend.id,
    userId: friend.userId,
    name: friend.name?.trim() || friend.email?.trim() || 'Unnamed friend',
    email: friend.email?.trim() || '',
    note: friend.note?.trim() || '',
    status: friend.status || 'Active',
})

const normalizeGroupRecord = (group) => ({
    id: group.id,
    createdBy: group.createdBy,
    name: group.name?.trim() || 'Untitled group',
    description: group.description?.trim() || '',
    members: Array.isArray(group.members) ? group.members : [],
    expenses: Array.isArray(group.expenses) ? group.expenses : [],
})

const DockGlyph = ({ children }) => (
    <span className="flex h-5 w-5 items-center justify-center text-inherit">{children}</span>
)

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 9.75V21h10.5V9.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const GroupIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19h14" strokeLinecap="round" />
        <path d="M6.5 19v-5.5h11V19" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 13.5V10h6v3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.25 10V7.5h1.5V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const FriendsIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true">
        <circle cx="9" cy="8" r="2.5" />
        <circle cx="16" cy="9" r="2" />
        <path d="M4.5 18.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" strokeLinecap="round" />
        <path d="M13 18.5c.1-1.8 1.5-3.2 3.3-3.2 1.8 0 3.2 1.4 3.2 3.2" strokeLinecap="round" />
    </svg>
)

const ProfileIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c0-3.1 3.1-5 7-5s7 1.9 7 5" strokeLinecap="round" />
    </svg>
)

function DashboardPage({ userId, userName, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [theme, setTheme] = useState('light')
    const [friends, setFriends] = useState([])
    const [groups, setGroups] = useState([])
    const [friendsLoading, setFriendsLoading] = useState(true)
    const [groupsLoading, setGroupsLoading] = useState(true)
    const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] })
    const [addFriendForm, setAddFriendForm] = useState(initialAddFriendForm)
    const [createGroupForm, setCreateGroupForm] = useState(initialCreateGroupForm)
    const [groupSearch, setGroupSearch] = useState('')
    const [selectedFriendId, setSelectedFriendId] = useState('')
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
    const [notice, setNotice] = useState(
        hasFirebaseConfig
            ? ''
            : 'Firebase is not configured yet. Add the VITE_FIREBASE_* variables to connect the dashboard.',
    )

    const currentUserMember = useMemo(
        () => ({ id: userId, name: userName, email: userEmail || '' }),
        [userEmail, userId, userName],
    )

    const selectedGroupRecord = useMemo(() => {
        if (!groups.length) return null
        return groups.find((group) => group.id === selectedGroupId) || groups[0]
    }, [groups, selectedGroupId])

    const groupsWithBalances = useMemo(() => {
        return sortByName(groups.map((group) => calculateGroupBalances(group, userName, userId)))
    }, [groups, userName, userId])

    const filteredGroups = useMemo(() => {
        const value = groupSearch.trim().toLowerCase()
        if (!value) return groupsWithBalances
        return groupsWithBalances.filter((group) => group.name.toLowerCase().includes(value))
    }, [groupSearch, groupsWithBalances])

    const groupStats = useMemo(() => {
        const totalGroups = groupsWithBalances.length
        const totalYouOwe = groupsWithBalances.reduce((sum, group) => sum + group.youOwe, 0)
        const totalYouAreOwed = groupsWithBalances.reduce((sum, group) => sum + group.youAreOwed, 0)

        return {
            totalGroups,
            totalYouOwe,
            totalYouAreOwed,
        }
    }, [groupsWithBalances])

    const selectedGroup = useMemo(() => {
        if (!groupsWithBalances.length) return null
        return (
            groupsWithBalances.find((group) => group.id === selectedGroupId) ||
            groupsWithBalances[0]
        )
    }, [groupsWithBalances, selectedGroupId])

    const recentActivityGroups = useMemo(() => {
        if (!groupsWithBalances.length) return []

        const byExpenseCount = [...groupsWithBalances].sort(
            (left, right) => (right.expenses?.length || 0) - (left.expenses?.length || 0),
        )

        if (!selectedGroupId) {
            return byExpenseCount.slice(0, 3)
        }

        const selected = groupsWithBalances.find((group) => group.id === selectedGroupId)
        const remaining = byExpenseCount.filter((group) => group.id !== selectedGroupId)

        return [selected, ...remaining].filter(Boolean).slice(0, 3)
    }, [groupsWithBalances, selectedGroupId])

    const selectedFriend = useMemo(() => {
        if (!friends.length || !selectedFriendId) return null
        return friends.find((friend) => friend.id === selectedFriendId) || null
    }, [friends, selectedFriendId])

    useEffect(() => {
        let isActive = true

        setFriendsLoading(true)
        setGroupsLoading(true)

        const unsubscribeFriends = watchUserFriends(
            userId,
            (nextFriends) => {
                if (!isActive) return
                setFriends(sortByName(nextFriends.map(normalizeFriendRecord)))
                setFriendsLoading(false)
            },
            (error) => {
                if (!isActive) return
                setNotice(error.message)
                setFriendsLoading(false)
            },
        )

        const unsubscribeGroups = watchUserGroups(
            userId,
            (nextGroups) => {
                if (!isActive) return
                setGroups(sortByName(nextGroups.map(normalizeGroupRecord)))
                setGroupsLoading(false)
            },
            (error) => {
                if (!isActive) return
                setNotice(error.message)
                setGroupsLoading(false)
            },
        )

        const unsubscribeFriendRequests = watchUserFriendRequests(
            userId,
            (nextFriendRequests) => {
                if (!isActive) return
                setFriendRequests(nextFriendRequests)
            },
            (error) => {
                if (!isActive) return
                setNotice(error.message)
            },
        )

        return () => {
            isActive = false
            unsubscribeFriends()
            unsubscribeGroups()
            unsubscribeFriendRequests()
        }
    }, [userId])

    useEffect(() => {
        if (!groups.length) {
            setSelectedGroupId('')
            return
        }

        if (!selectedGroupId || !groups.some((group) => group.id === selectedGroupId)) {
            setSelectedGroupId(groups[0].id)
        }
    }, [groups, selectedGroupId])

    useEffect(() => {
        setExpenseForm(buildDefaultExpenseForm(selectedGroupRecord))
    }, [selectedGroupRecord])

    useEffect(() => {
        if (!selectedFriendId) return
        if (!friends.some((friend) => friend.id === selectedFriendId)) {
            setSelectedFriendId('')
        }
    }, [friends, selectedFriendId])

    const handleAddFriendChange = (event) => {
        const { name, value } = event.target
        setAddFriendForm((current) => ({ ...current, [name]: value }))
    }

    const handleAddFriendSubmit = async (event) => {
        event.preventDefault()

        try {
            await createFriendRecord(userId, {
                name: userName,
                requesterEmail: userEmail,
                email: addFriendForm.email,
                note: addFriendForm.note,
            })
            setAddFriendForm(initialAddFriendForm)
            setNotice('Friend request sent.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleAcceptFriendRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId, userId)
            setNotice('Friend request accepted. You can now add this friend to groups.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleDeclineFriendRequest = async (requestId) => {
        try {
            await declineFriendRequest(requestId, userId)
            setNotice('Friend request declined.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleCreateGroupChange = (event) => {
        const { name, value } = event.target
        setCreateGroupForm((current) => ({
            ...(current || initialCreateGroupForm),
            [name]: value,
        }))
    }

    const handleCreateGroupFriendToggle = (friendId) => {
        setCreateGroupForm((current) => {
            const selectedFriendIds = current?.selectedFriendIds || []
            const isSelected = selectedFriendIds.includes(friendId)

            return {
                ...(current || initialCreateGroupForm),
                selectedFriendIds: isSelected
                    ? selectedFriendIds.filter((id) => id !== friendId)
                    : [...selectedFriendIds, friendId],
            }
        })
    }

    const handleCreateGroupSubmit = async (event) => {
        event.preventDefault()

        const name = (createGroupForm?.name || '').trim()
        if (!name) {
            setNotice('Please enter a group name.')
            return
        }

        const selectedFriendMembers = friends
            .filter((friend) => (createGroupForm?.selectedFriendIds || []).includes(friend.userId))
            .map((friend) => ({
                id: friend.userId,
                name: friend.name,
                email: friend.email,
            }))

        try {
            await createGroupRecord(userId, {
                name,
                description: createGroupForm?.description || '',
                members: [currentUserMember, ...selectedFriendMembers],
                ownerName: userName,
                ownerEmail: userEmail,
            })
            setCreateGroupForm(initialCreateGroupForm)
            setNotice('Group saved to Firebase.')
            setActiveTab('groups')
        } catch (error) {
            setNotice(error.message)
        }
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
        setExpenseForm(buildDefaultExpenseForm(selectedGroupRecord))
    }

    const handleExpenseSubmit = async (event) => {
        event.preventDefault()
        if (!selectedGroupRecord) {
            setNotice('Select a group before adding an expense.')
            return
        }

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

        const nextExpenses = expenseForm.editExpenseId
            ? selectedGroupRecord.expenses.map((expense) =>
                expense.id === expenseForm.editExpenseId ? nextExpense : expense,
            )
            : [...selectedGroupRecord.expenses, nextExpense]

        try {
            await updateGroupExpenses(selectedGroupRecord.id, nextExpenses)
            setNotice(
                expenseForm.editExpenseId
                    ? 'Expense updated and balances recalculated.'
                    : 'Expense added and balances recalculated.',
            )
            resetExpenseForm()
            setActiveTab('group-details')
        } catch (error) {
            setNotice(error.message)
        }
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

    const handleExpenseDelete = async (expenseId) => {
        if (!selectedGroupRecord) return

        const nextExpenses = selectedGroupRecord.expenses.filter((expense) => expense.id !== expenseId)

        try {
            await updateGroupExpenses(selectedGroupRecord.id, nextExpenses)

            if (expenseForm.editExpenseId === expenseId) {
                resetExpenseForm()
            }

            setNotice('Expense deleted and balances recalculated.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleGroupDelete = async () => {
        if (!selectedGroup) return

        const confirmed = window.confirm('Delete this group from Firebase?')
        if (!confirmed) return

        try {
            await deleteGroupRecord(selectedGroup.id)
            setNotice('Group deleted from Firebase Firestore: groups.')
            setSelectedGroupId('')
            setActiveTab('groups')
        } catch (error) {
            setNotice(error.message)
        }
    }

    useEffect(() => {
        const savedTheme = window.localStorage.getItem('owebuddy-theme')
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme)
        }
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    const isDarkTheme = theme === 'dark'

    const staggeredMenuItems = [
        { label: 'Home', ariaLabel: 'Go to home', link: '#home', onClick: () => setActiveTab('overview') },
        { label: 'Groups', ariaLabel: 'Go to groups', link: '#groups', onClick: () => setActiveTab('groups') },
        { label: 'Friends', ariaLabel: 'Go to friends', link: '#friends', onClick: () => setActiveTab('friends') },
        { label: 'Profile', ariaLabel: 'Go to profile', link: '#profile', onClick: () => setActiveTab('profile') },
        { label: 'Logout', ariaLabel: 'Log out', link: '#logout', onClick: onLogout },
    ]

    const dockItems = [
        {
            label: 'Home',
            onClick: () => setActiveTab('overview'),
            className: activeTab === 'overview' ? 'dock-item-active' : '',
            icon: <DockGlyph><HomeIcon /></DockGlyph>,
        },
        {
            label: 'Groups',
            onClick: () => setActiveTab('groups'),
            className: ['groups', 'create-group', 'group-details', 'add-expense'].includes(activeTab)
                ? 'dock-item-active'
                : '',
            icon: <DockGlyph><GroupIcon /></DockGlyph>,
        },
        {
            label: 'Friends',
            onClick: () => setActiveTab('friends'),
            className: ['friends', 'add-friend', 'friend-profile'].includes(activeTab)
                ? 'dock-item-active'
                : '',
            icon: <DockGlyph><FriendsIcon /></DockGlyph>,
        },
        {
            label: 'Profile',
            onClick: () => setActiveTab('profile'),
            className: activeTab === 'profile' ? 'dock-item-active' : '',
            icon: <DockGlyph><ProfileIcon /></DockGlyph>,
        },
    ]

    return (
        <main
            className={`min-h-screen overflow-hidden transition-colors ${theme === 'dark'
                ? 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white'
                : 'bg-[linear-gradient(180deg,_#f8fafc,_#e2e8f0)] text-slate-900'
                }`}
            data-theme={theme}
        >
            <StaggeredMenu
                position="right"
                items={staggeredMenuItems}
                socialItems={[]}
                displaySocials={false}
                displayItemNumbering={true}
                menuButtonColor={isDarkTheme ? '#f8fafc' : '#0f172a'}
                openMenuButtonColor="#ffffff"
                changeMenuColorOnOpen={true}
                colors={['#0f172a', '#1e293b', '#111827']}
                accentColor="#f97316"
                isFixed={true}
            />
            <Dock items={dockItems} panelHeight={66} baseItemSize={48} magnification={76} distance={180} />
            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-28 pt-5 sm:px-8 lg:px-12">
                <div className="flex-1">
                    <section className="p-2 sm:p-4 lg:p-6">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                {activeTab !== 'groups' ? (
                                    <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                                        {screenTitles[activeTab]}
                                    </h1>
                                ) : null}
                                {activeTab !== 'groups' && activeTab !== 'overview' && activeTab !== 'group-details' && activeTab !== 'friends' && activeTab !== 'add-friend' && activeTab !== 'profile' ? (
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                        Manage your shared balances with a simple frontend dashboard.
                                    </p>
                                ) : null}
                            </div>

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
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-semibold text-white">Recent activity</h3>
                                        <span className="text-xs text-slate-400">Top 3 groups</span>
                                    </div>

                                    {recentActivityGroups.length ? (
                                        <div className="mt-4 space-y-3">
                                            {recentActivityGroups.map((group) => {
                                                const expenseCount = group.expenses?.length || 0

                                                return (
                                                    <button
                                                        key={group.id}
                                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-amber-300/60 hover:bg-amber-300/10"
                                                        onClick={() => {
                                                            setSelectedGroupId(group.id)
                                                            setActiveTab('group-details')
                                                        }}
                                                        type="button"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="text-sm font-semibold text-white">{group.name}</div>
                                                            <div className="text-xs text-slate-400">
                                                                {group.membersCount} members · {expenseCount} expenses
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="mt-4 text-sm text-slate-400">
                                            No groups yet. Create a group to start tracking activity.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'friends' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn-primary" onClick={() => setActiveTab('add-friend')} type="button">
                                        Add friend
                                    </button>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Friends List</h2>
                                        <span className="text-sm text-slate-400">
                                            {friendsLoading ? 'Loading...' : `${friends.length} friends`}
                                        </span>
                                    </div>
                                    <FriendsList
                                        friends={friends}
                                        isLoading={friendsLoading}
                                        onSelectFriend={(friend) => {
                                            setSelectedFriendId(friend.id)
                                            setActiveTab('friend-profile')
                                        }}
                                        onDeleteFriend={async (friendId) => {
                                            const confirmed = window.confirm('Delete this friend from Firebase?')
                                            if (!confirmed) return

                                            try {
                                                await deleteFriendRecord(friendId)
                                                setNotice('Friend connection removed.')
                                            } catch (error) {
                                                setNotice(error.message)
                                            }
                                        }}
                                    />
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Incoming requests</h2>
                                        <span className="text-sm text-slate-400">{friendRequests.incoming.length} pending</span>
                                    </div>

                                    {friendRequests.incoming.length ? (
                                        <div className="space-y-3">
                                            {friendRequests.incoming.map((request) => (
                                                <div
                                                    key={request.id}
                                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                                >
                                                    <div>
                                                        <div className="font-semibold text-white">{request.requesterName}</div>
                                                        <div className="text-sm text-slate-400">{request.requesterEmail}</div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn-primary"
                                                            onClick={() => handleAcceptFriendRequest(request.id)}
                                                            type="button"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="btn-secondary"
                                                            onClick={() => handleDeclineFriendRequest(request.id)}
                                                            type="button"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                                            No incoming requests.
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-white">Sent requests</h2>
                                        <span className="text-sm text-slate-400">{friendRequests.outgoing.length} pending</span>
                                    </div>

                                    {friendRequests.outgoing.length ? (
                                        <div className="space-y-3">
                                            {friendRequests.outgoing.map((request) => (
                                                <div
                                                    key={request.id}
                                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                                >
                                                    <div className="font-semibold text-white">{request.recipientName}</div>
                                                    <div className="text-sm text-slate-400">{request.recipientEmail}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                                            No pending sent requests.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'add-friend' && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Add Friend</h2>
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
                                    {selectedFriend ? (
                                        <div className="mt-4 space-y-3 text-sm">
                                            <div>
                                                <div className="text-xs text-slate-400">Name</div>
                                                <div className="text-base font-semibold text-white">{selectedFriend.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400">Email</div>
                                                <div className="text-slate-200">{selectedFriend.email || 'No email added'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400">Status</div>
                                                <div className="text-slate-200">{selectedFriend.status || 'Active'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400">Note</div>
                                                <div className="text-slate-200">{selectedFriend.note || 'No note added'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm leading-6 text-slate-300">
                                            Select a friend from the Friends list to view their profile.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'groups' && (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-2xl font-semibold text-white">Groups</h2>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setCreateGroupForm(initialCreateGroupForm)
                                            setActiveTab('create-group')
                                        }}
                                        type="button"
                                    >
                                        + New Group
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <input
                                        id="group-search"
                                        className="auth-input mt-2"
                                        onChange={(event) => setGroupSearch(event.target.value)}
                                        placeholder="Search groups..."
                                        type="text"
                                        value={groupSearch}
                                    />
                                </div>

                                {groupsLoading ? (
                                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                                        Loading groups from Firebase...
                                    </div>
                                ) : filteredGroups.length ? (
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
                                ) : (
                                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                                        No groups yet. Create one to start tracking balances.
                                    </div>
                                )}
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
                                                value={createGroupForm?.name || ''}
                                            />
                                        </FormField>

                                        <FormField label="Description" hint="Optional for now">
                                            <input
                                                className="auth-input"
                                                name="description"
                                                onChange={handleCreateGroupChange}
                                                placeholder="Trips, rent, or shared meals"
                                                type="text"
                                                value={createGroupForm?.description || ''}
                                            />
                                        </FormField>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="mb-2 text-sm font-semibold text-white">Select friends</div>
                                        <p className="mb-3 text-xs text-slate-400">Only accepted friends can be added. You are included automatically in every group.</p>

                                        {friendsLoading ? (
                                            <div className="rounded-xl border border-dashed border-white/20 px-3 py-4 text-sm text-slate-400">
                                                Loading friends...
                                            </div>
                                        ) : friends.length ? (
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {friends.map((friend) => {
                                                    const selectedFriendIds = createGroupForm?.selectedFriendIds || []
                                                    const isChecked = selectedFriendIds.includes(friend.id)

                                                    return (
                                                        <label
                                                            key={friend.id}
                                                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                                                        >
                                                            <input
                                                                checked={isChecked}
                                                                className="h-4 w-4"
                                                                onChange={() => handleCreateGroupFriendToggle(friend.userId)}
                                                                type="checkbox"
                                                            />
                                                            <span>{friend.name}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-white/20 px-3 py-4 text-sm text-slate-400">
                                                No friends yet. Add friends first, or create a solo group.
                                            </div>
                                        )}
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

                                {selectedGroup ? (
                                    <>
                                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <h2 className="text-lg font-semibold text-white">{selectedGroup.name} - Group Details</h2>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <button className="btn-primary" onClick={() => setActiveTab('add-expense')} type="button">
                                                    Add expense
                                                </button>
                                                <button className="btn-secondary" onClick={handleGroupDelete} type="button">
                                                    Delete group
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
                                    </>
                                ) : (
                                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                                        No group is selected yet. Create a group or pick one from the groups tab.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'add-expense' && (
                            <div className="space-y-4">
                                <button className="btn-secondary" onClick={() => setActiveTab('group-details')} type="button">
                                    Back to group details
                                </button>

                                {selectedGroup ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                                        Select a group first so an expense can be stored in Firebase.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-white">{userName}</h2>
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
