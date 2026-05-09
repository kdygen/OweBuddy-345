import { useEffect, useMemo, useState } from 'react'
import AddFriendForm from '../components/AddFriendForm'
import Dock from '../components/Dock'
import DotField from '../components/DotField'
import FormField from '../components/FormField'
import FriendsList from '../components/FriendsList'
import {
    acceptFriendRequest,
    declineFriendRequest,
    deleteFriendRecord,
    deleteGroupRecord,
    createFriendRecord,
    createGroupRecord,
    updateGroupExpenses,
    updateGroupMembers,
    updateGroupPayments,
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
    name: '',
    email: '',
    note: '',
}

const initialCreateGroupForm = {
    name: '',
    description: '',
    selectedFriendIds: [],
}

const initialExpenseForm = {
    title: '',
    amount: '',
    paidByMemberId: '',
    owedByMemberIds: [],
    splitMethod: 'equal',
    shareAmounts: {},
    editExpenseId: null,
}

const buildShareAmountState = (group, values = {}) =>
    Object.fromEntries((group?.members || []).map(m => [m.id, values[m.id] ?? '']))

const toCents = (value) => Math.round(Number(value || 0) * 100)

const createPaymentRequestId = () => `pay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const buildSettlementKey = (fromMemberId, toMemberId, amount) => {
    return `${fromMemberId}__${toMemberId}__${toCents(amount)}`
}

const isMemberReferencedInExpenses = (expenses, memberId) => {
    return (Array.isArray(expenses) ? expenses : []).some((expense) => {
        if (!expense) return false
        if (expense.paidByMemberId === memberId) return true

        if (Array.isArray(expense.owedByMemberIds) && expense.owedByMemberIds.includes(memberId)) {
            return true
        }

        if (Array.isArray(expense.shares) && expense.shares.some((share) => share.memberId === memberId)) {
            return true
        }

        return false
    })
}

const computeExpensePaymentState = (expenses, payments) => {
    const expenseList = Array.isArray(expenses) ? expenses : []
    const confirmedPayments = (Array.isArray(payments) ? payments : [])
        .filter((payment) => payment?.status === 'confirmed')
        .sort((left, right) => {
            const leftTime = new Date(left.confirmedAt || left.updatedAt || left.createdAt || 0).getTime()
            const rightTime = new Date(right.confirmedAt || right.updatedAt || right.createdAt || 0).getTime()
            return leftTime - rightTime
        })

    const outstandingByExpenseId = {}

    expenseList.forEach((expense) => {
        const shareMap = {}
            ; (Array.isArray(expense.shares) ? expense.shares : []).forEach((share) => {
                if (!share?.memberId || share.memberId === expense.paidByMemberId) return
                const amountCents = toCents(share.amount)
                if (amountCents <= 0) return
                shareMap[share.memberId] = (shareMap[share.memberId] || 0) + amountCents
            })
        outstandingByExpenseId[expense.id] = shareMap
    })

    confirmedPayments.forEach((payment) => {
        let remaining = toCents(payment.amount)
        if (remaining <= 0) return

        for (const expense of expenseList) {
            if (remaining <= 0) break
            if (expense.paidByMemberId !== payment.toMemberId) continue

            const shareMap = outstandingByExpenseId[expense.id]
            const fromOutstanding = shareMap?.[payment.fromMemberId] || 0
            if (!fromOutstanding) continue

            const applied = Math.min(remaining, fromOutstanding)
            shareMap[payment.fromMemberId] = fromOutstanding - applied
            remaining -= applied
        }
    })

    const stateByExpenseId = {}
    expenseList.forEach((expense) => {
        const shareMap = outstandingByExpenseId[expense.id] || {}
        const remainingCents = Object.values(shareMap).reduce((sum, value) => sum + value, 0)
        stateByExpenseId[expense.id] = {
            isPaid: remainingCents === 0,
            remainingCents,
        }
    })

    return stateByExpenseId
}



const buildEqualSplitShares = (amount, memberIds) => {
    const totalCents = Math.round(Number(amount || 0) * 100)
    if (!totalCents || !Array.isArray(memberIds) || memberIds.length === 0) {
        return []
    }

    const baseShareCents = Math.floor(totalCents / memberIds.length)
    let remainderCents = totalCents % memberIds.length

    return memberIds.map((memberId) => {
        const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0)
        if (remainderCents > 0) remainderCents -= 1

        return {
            memberId,
            amount: Number((shareCents / 100).toFixed(2)),
        }
    })
}



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

function DashboardPage({ userId, userName, userEmail, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')
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
    const [memberToAddId, setMemberToAddId] = useState('')
    const [showGroupMembersPanel, setShowGroupMembersPanel] = useState(false)
    const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
    const [notice, setNotice] = useState('')

    const currentUserMember = useMemo(
        () => ({ id: userId, name: userName, email: userEmail || '' }),
        [userEmail, userId, userName],
    )

    const selectedGroupRecord = useMemo(
        () => groups.find(g => g.id === selectedGroupId) || groups[0] || null,
        [groups, selectedGroupId]
    )

    const groupsWithBalances = useMemo(() => {
        return groups
            .map(g => calculateGroupBalances(g, userName, userId))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [groups, userName, userId])

    const selectedGroup = useMemo(
        () => groupsWithBalances.find(g => g.id === selectedGroupId) || groupsWithBalances[0] || null,
        [groupsWithBalances, selectedGroupId]
    )

    const recentActivityGroups = useMemo(
        () => groupsWithBalances.slice(0, 3).map(g => ({
            ...g,
            membersCount: g.membersCount || 0,
        })),
        [groupsWithBalances]
    )

    const groupStats = useMemo(() => {
        const totalYouOwe = groupsWithBalances.reduce((sum, g) => sum + (g.youOwe || 0), 0)
        const totalYouAreOwed = groupsWithBalances.reduce((sum, g) => sum + (g.youAreOwed || 0), 0)
        return {
            totalGroups: groupsWithBalances.length,
            totalYouOwe: totalYouOwe.toFixed(2),
            totalYouAreOwed: totalYouAreOwed.toFixed(2),
        }
    }, [groupsWithBalances])

    const filteredGroups = useMemo(() => {
        const searchLower = groupSearch.toLowerCase().trim()
        if (!searchLower) return groupsWithBalances
        return groupsWithBalances.filter(g =>
            g.name.toLowerCase().includes(searchLower) ||
            g.description?.toLowerCase().includes(searchLower)
        )
    }, [groupsWithBalances, groupSearch])

    const selectedFriend = useMemo(() => {
        if (!selectedFriendId) return null
        return friends.find((friend) => friend.id === selectedFriendId || friend.userId === selectedFriendId) || null
    }, [friends, selectedFriendId])

    const addableFriends = useMemo(() => {
        if (!selectedGroupRecord) return []

        const currentMemberIds = new Set((selectedGroupRecord.members || []).map((member) => member.id))
        return friends
            .filter((friend) => friend.userId && !currentMemberIds.has(friend.userId))
            .map((friend) => ({
                id: friend.userId,
                name: friend.name,
                email: friend.email,
            }))
            .sort((left, right) => left.name.localeCompare(right.name))
    }, [friends, selectedGroupRecord])

    const pendingPaymentsBySettlementKey = useMemo(() => {
        const pendingPayments = (selectedGroupRecord?.payments || []).filter((payment) => payment.status === 'pending')
        return pendingPayments.reduce((accumulator, payment) => {
            const key = buildSettlementKey(payment.fromMemberId, payment.toMemberId, payment.amount)
            accumulator[key] = payment
            return accumulator
        }, {})
    }, [selectedGroupRecord])

    const expensePaymentStateById = useMemo(() => {
        if (!selectedGroupRecord) return {}
        return computeExpensePaymentState(selectedGroupRecord.expenses, selectedGroupRecord.payments)
    }, [selectedGroupRecord])

    const groupedExpenses = useMemo(() => {
        if (!selectedGroupRecord) {
            return { openExpenses: [], paidExpenses: [] }
        }

        const openExpenses = []
        const paidExpenses = []

        selectedGroupRecord.expenses.forEach((expense) => {
            const paymentState = expensePaymentStateById[expense.id]
            if (paymentState?.isPaid) {
                paidExpenses.push(expense)
                return
            }

            openExpenses.push(expense)
        })

        return {
            openExpenses,
            paidExpenses,
        }
    }, [expensePaymentStateById, selectedGroupRecord])

    const expenseSplitSummary = useMemo(() => {
        if (!selectedGroupRecord) return null

        const total = Number(expenseForm.amount)
        const participantIds = Array.isArray(expenseForm.owedByMemberIds) ? expenseForm.owedByMemberIds : []

        if (!total || total <= 0 || !participantIds.length) {
            return null
        }

        if (expenseForm.splitMethod === 'equal') {
            const share = total / participantIds.length
            return {
                method: 'equal',
                items: participantIds.map((memberId) => {
                    const member = selectedGroupRecord.members.find((item) => item.id === memberId)
                    return {
                        memberId,
                        name: member?.name || 'Unknown',
                        amount: share,
                    }
                }),
                total,
            }
        }

        const items = participantIds
            .map((memberId) => {
                const member = selectedGroupRecord.members.find((item) => item.id === memberId)
                const amount = Number(expenseForm.shareAmounts?.[memberId] || 0)
                return {
                    memberId,
                    name: member?.name || 'Unknown',
                    amount,
                }
            })

        const customShareTotal = items.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0)
        const payerAmount = Math.max(0, total - customShareTotal)

        return {
            method: 'custom',
            items: [
                ...items,
                {
                    memberId: expenseForm.paidByMemberId,
                    name: selectedGroupRecord.members.find((item) => item.id === expenseForm.paidByMemberId)?.name || 'Payer',
                    amount: payerAmount,
                },
            ],
            total: customShareTotal + payerAmount,
        }
    }, [expenseForm.amount, expenseForm.owedByMemberIds, expenseForm.shareAmounts, expenseForm.splitMethod, selectedGroupRecord])



    useEffect(() => {
        let isActive = true

        setFriendsLoading(true)
        setGroupsLoading(true)

        const unsubscribeFriends = watchUserFriends(
            userId,
            (nextFriends) => {
                if (!isActive) return
                setFriends(
                    nextFriends
                        .map(f => ({
                            id: f.id,
                            userId: f.userId,
                            name: f.name?.trim() || f.email?.trim() || 'Unnamed friend',
                            email: f.email?.trim() || '',
                            note: f.note?.trim() || '',
                            status: f.status || 'Active',
                        }))
                        .sort((a, b) => a.name.localeCompare(b.name))
                )
                setFriendsLoading(false)
            },
            () => isActive && setFriendsLoading(false),
        )

        const unsubscribeGroups = watchUserGroups(
            userId,
            (nextGroups) => {
                if (!isActive) return
                setGroups(
                    nextGroups
                        .map(g => ({
                            id: g.id,
                            createdBy: g.createdBy,
                            name: g.name?.trim() || 'Untitled group',
                            description: g.description?.trim() || '',
                            members: g.members || [],
                            expenses: g.expenses || [],
                            payments: g.payments || [],
                        }))
                        .sort((a, b) => a.name.localeCompare(b.name))
                )
                setGroupsLoading(false)
            },
            () => isActive && setGroupsLoading(false),
        )

        const unsubscribeFriendRequests = watchUserFriendRequests(
            userId,
            (nextFriendRequests) => isActive && setFriendRequests(nextFriendRequests),
            () => { },
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
        setShowGroupMembersPanel(false)
    }, [selectedGroupId])

    useEffect(() => {
        if (!selectedGroupRecord) {
            setExpenseForm(initialExpenseForm)
        } else {
            const defaultPayerId = selectedGroupRecord.members[0]?.id || ''
            const defaultOwedByIds = selectedGroupRecord.members
                .filter(m => m.id !== defaultPayerId)
                .map(m => m.id)

            setExpenseForm({
                amount: '',
                paidByMemberId: defaultPayerId,
                owedByMemberIds: defaultOwedByIds,
                splitMethod: 'equal',
                shareAmounts: buildShareAmountState(selectedGroupRecord),
                editExpenseId: null,
            })
        }
    }, [selectedGroupRecord])

    useEffect(() => {
        if (!selectedFriendId) return
        if (!friends.some((friend) => friend.id === selectedFriendId || friend.userId === selectedFriendId)) {
            setSelectedFriendId('')
        }
    }, [friends, selectedFriendId])

    useEffect(() => {
        if (!addableFriends.length) {
            setMemberToAddId('')
            return
        }

        if (!memberToAddId || !addableFriends.some((friend) => friend.id === memberToAddId)) {
            setMemberToAddId(addableFriends[0].id)
        }
    }, [addableFriends, memberToAddId])

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
            setActiveTab('friends')

        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleAcceptFriendRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId, userId)
            setNotice('Friend request accepted.')

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

    const handleExpenseSplitMethodChange = (e) => {
        setExpenseForm(f => ({
            ...f,
            splitMethod: e.target.value,
            shareAmounts: buildShareAmountState(selectedGroupRecord, f.shareAmounts),
        }))
    }

    const handleShareAmountChange = (memberId, value) => {
        setExpenseForm((current) => ({
            ...(current || initialExpenseForm),
            splitMethod: 'custom',
            shareAmounts: {
                ...(current?.shareAmounts || {}),
                [memberId]: value,
            },
        }))
    }

    const handleCreateGroupSubmit = async (event) => {
        event.preventDefault()

        const name = (createGroupForm?.name || '').trim()
        if (!name) {

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
            setNotice('Group saved.')
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
            shareAmounts: Object.fromEntries(
                Object.entries(current.shareAmounts || {}).filter(([memberId]) => memberId !== paidByMemberId),
            ),
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
                shareAmounts: isSelected
                    ? Object.fromEntries(
                        Object.entries(current.shareAmounts || {}).filter(([id]) => id !== memberId),
                    )
                    : {
                        ...(current.shareAmounts || {}),
                        [memberId]: current.shareAmounts?.[memberId] || '',
                    },
            }
        })
    }

    const buildDefaultExpenseForm = (group) => {
        if (!group) return initialExpenseForm
        const defaultPayerId = group.members[0]?.id || ''
        const defaultOwedByIds = group.members
            .filter(m => m.id !== defaultPayerId)
            .map(m => m.id)
        return {
            title: '',
            amount: '',
            paidByMemberId: defaultPayerId,
            owedByMemberIds: defaultOwedByIds,
            splitMethod: 'equal',
            shareAmounts: buildShareAmountState(group),
            editExpenseId: null,
        }
    }

    const resetExpenseForm = () => {
        setExpenseForm(buildDefaultExpenseForm(selectedGroupRecord))
    }

    const handleExpenseSubmit = async (event) => {
        event.preventDefault()
        if (!selectedGroupRecord) {

            return
        }

        const amount = Number(expenseForm.amount)
        const title = (expenseForm.title || '').trim()

        if (!title) {
            setNotice('Add a name for what this expense was for.')
            return
        }

        if (!amount || amount <= 0) {

            return
        }

        if (!expenseForm.paidByMemberId) {

            return
        }

        if (!expenseForm.owedByMemberIds.length) {

            return
        }

        let shares = []
        if (expenseForm.splitMethod === 'custom') {
            const customShares = expenseForm.owedByMemberIds.map((memberId) => ({
                memberId,
                amount: Number(expenseForm.shareAmounts?.[memberId] || 0),
            }))

            const invalidShare = customShares.some((share) => !Number.isFinite(share.amount) || share.amount < 0)
            if (invalidShare) {
                setNotice('Enter a valid amount for every custom split participant.')
                return
            }

            const shareTotal = customShares.reduce((sum, share) => sum + share.amount, 0)
            const payerShare = Number((amount - shareTotal).toFixed(2))

            if (payerShare < 0) {
                setNotice('Custom split amounts cannot be greater than the expense total.')
                return
            }

            shares = [
                ...customShares,
                ...(payerShare > 0
                    ? [{ memberId: expenseForm.paidByMemberId, amount: payerShare }]
                    : []),
            ]
        } else {
            const equalSplitParticipantIds = [
                expenseForm.paidByMemberId,
                ...expenseForm.owedByMemberIds,
            ].filter(Boolean)

            shares = buildEqualSplitShares(amount, equalSplitParticipantIds)
        }

        const nextExpense = {
            id: expenseForm.editExpenseId || `exp-${Date.now()}`,
            title,
            amount,
            paidByMemberId: expenseForm.paidByMemberId,
            owedByMemberIds: expenseForm.owedByMemberIds,
            splitMethod: expenseForm.splitMethod,
            shares,
            createdByMemberId:
                expenseForm.editExpenseId
                    ? (selectedGroupRecord.expenses.find((expense) => expense.id === expenseForm.editExpenseId)?.createdByMemberId || userId)
                    : userId,
            createdAt:
                expenseForm.editExpenseId
                    ? (selectedGroupRecord.expenses.find((expense) => expense.id === expenseForm.editExpenseId)?.createdAt || new Date().toISOString())
                    : new Date().toISOString(),
        }

        const nextExpenses = expenseForm.editExpenseId
            ? selectedGroupRecord.expenses.map((expense) =>
                expense.id === expenseForm.editExpenseId ? nextExpense : expense,
            )
            : [...selectedGroupRecord.expenses, nextExpense]

        try {
            await updateGroupExpenses(selectedGroupRecord.id, nextExpenses)
            resetExpenseForm()
            setNotice(expenseForm.editExpenseId ? 'Expense updated.' : 'Expense added.')
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
            title: expense.title || '',
            amount: String(expense.amount),
            paidByMemberId: expense.paidByMemberId,
            owedByMemberIds:
                Array.isArray(expense.owedByMemberIds) && expense.owedByMemberIds.length
                    ? expense.owedByMemberIds.filter((memberId) => memberId !== expense.paidByMemberId)
                    : defaultOwedByIds,
            splitMethod: expense.splitMethod === 'custom' ? 'custom' : 'equal',
            shareAmounts: buildShareAmountState(selectedGroupRecord, Object.fromEntries(
                (Array.isArray(expense.shares) ? expense.shares : []).map((share) => [share.memberId, String(share.amount)]),
            )),
            editExpenseId: expense.id,
        })


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
            setNotice('Expense deleted.')
            setActiveTab('group-details')

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
            setSelectedGroupId('')
            setActiveTab('groups')
        } catch (error) {
        }
    }

    const handleAddGroupMember = async () => {
        if (!selectedGroupRecord || !memberToAddId) return

        const friendToAdd = addableFriends.find((friend) => friend.id === memberToAddId)
        if (!friendToAdd) return

        const nextMembers = [
            ...(selectedGroupRecord.members || []),
            {
                id: friendToAdd.id,
                name: friendToAdd.name,
                email: friendToAdd.email,
            },
        ]

        try {
            await updateGroupMembers(selectedGroupRecord.id, nextMembers)
            setNotice(`${friendToAdd.name} was added to the group.`)
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleRemoveGroupMember = async (memberId) => {
        if (!selectedGroupRecord) return

        if (memberId === userId) {
            setNotice('You cannot remove yourself from this group.')
            return
        }

        if (isMemberReferencedInExpenses(selectedGroupRecord.expenses, memberId)) {
            setNotice('This member is used in expense history. Remove related expenses first.')
            return
        }

        const hasPaymentHistory = (selectedGroupRecord.payments || []).some(
            (payment) => payment.fromMemberId === memberId || payment.toMemberId === memberId,
        )
        if (hasPaymentHistory) {
            setNotice('This member has payment history. Clear payment records first.')
            return
        }

        const member = selectedGroupRecord.members.find((item) => item.id === memberId)
        const confirmed = window.confirm(`Remove ${member?.name || 'this member'} from the group?`)
        if (!confirmed) return

        const nextMembers = (selectedGroupRecord.members || []).filter((item) => item.id !== memberId)

        try {
            await updateGroupMembers(selectedGroupRecord.id, nextMembers)
            setNotice('Member removed from group.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleRequestSettlementPayment = async (settlement) => {
        if (!selectedGroupRecord || !settlement) return

        if (settlement.fromMemberId !== userId) {
            setNotice('Only the person who owes can mark this as paid.')
            return
        }

        const settlementAmountCents = toCents(settlement.amount)
        const hasPendingRequest = (selectedGroupRecord.payments || []).some((payment) => {
            if (payment.status !== 'pending') return false
            if (payment.fromMemberId !== settlement.fromMemberId || payment.toMemberId !== settlement.toMemberId) {
                return false
            }
            return toCents(payment.amount) === settlementAmountCents
        })

        if (hasPendingRequest) {
            setNotice('A payment confirmation request is already pending for this owe.')
            return
        }

        const paymentRequest = {
            id: createPaymentRequestId(),
            fromMemberId: settlement.fromMemberId,
            toMemberId: settlement.toMemberId,
            amount: Number(settlement.amount.toFixed(2)),
            status: 'pending',
            requestedBy: userId,
            requestedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        try {
            await updateGroupPayments(selectedGroupRecord.id, [...(selectedGroupRecord.payments || []), paymentRequest])
            setNotice('Payment marked as paid. Waiting for confirmation from the person who paid the expense.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const handleReviewPaymentRequest = async (paymentId, approved) => {
        if (!selectedGroupRecord || !paymentId) return

        const existingPayments = selectedGroupRecord.payments || []
        const targetPayment = existingPayments.find((payment) => payment.id === paymentId)

        if (!targetPayment || targetPayment.status !== 'pending') return
        if (targetPayment.toMemberId !== userId) {
            setNotice('Only the original payer can confirm this payment.')
            return
        }

        const nextPayments = existingPayments.map((payment) => {
            if (payment.id !== paymentId) return payment

            return {
                ...payment,
                status: approved ? 'confirmed' : 'declined',
                confirmedBy: userId,
                confirmedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        })

        try {
            await updateGroupPayments(selectedGroupRecord.id, nextPayments)
            setNotice(approved ? 'Payment confirmed. The owe is now settled.' : 'Payment request declined.')
        } catch (error) {
            setNotice(error.message)
        }
    }

    const shouldShowSubtitle = !['groups', 'overview', 'group-details', 'friends', 'add-friend', 'friend-profile', 'profile'].includes(activeTab)

    const dockItems = [
        {
            label: 'Home',
            onClick: () => setActiveTab('overview'),
            className: activeTab === 'overview' ? 'dock-item-active' : '',
            icon: <span className="flex h-5 w-5 items-center justify-center"><HomeIcon /></span>,
        },
        {
            label: 'Groups',
            onClick: () => setActiveTab('groups'),
            className: ['groups', 'create-group', 'group-details', 'add-expense'].includes(activeTab)
                ? 'dock-item-active'
                : '',
            icon: <span className="flex h-5 w-5 items-center justify-center"><GroupIcon /></span>,
        },
        {
            label: 'Friends',
            onClick: () => setActiveTab('friends'),
            className: ['friends', 'add-friend', 'friend-profile'].includes(activeTab)
                ? 'dock-item-active'
                : '',
            icon: <span className="flex h-5 w-5 items-center justify-center"><FriendsIcon /></span>,
        },
        {
            label: 'Profile',
            onClick: () => setActiveTab('profile'),
            className: activeTab === 'profile' ? 'dock-item-active' : '',
            icon: <span className="flex h-5 w-5 items-center justify-center"><ProfileIcon /></span>,
        },
    ]

    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#10172a,_#050816)] text-white">
            <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
                <DotField
                    dotRadius={1.5}
                    dotSpacing={14}
                    bulgeStrength={67}
                    glowRadius={160}
                    sparkle={false}
                    waveAmplitude={0}
                    gradientFrom="rgba(245, 158, 11, 0.28)"
                    gradientTo="rgba(56, 189, 248, 0.2)"
                    glowColor="#120F17"
                />
            </div>

            <Dock items={dockItems} panelHeight={66} baseItemSize={48} magnification={76} distance={180} />
            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-28 pt-5 sm:px-8 lg:px-12">
                <div className="flex-1">
                    <section className="p-2 sm:p-4 lg:p-6">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                {activeTab !== 'groups' && (
                                    <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                                        {screenTitles[activeTab]}
                                    </h1>
                                )}
                                {shouldShowSubtitle && (
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                        Manage your shared balances with a simple frontend dashboard.
                                    </p>
                                )}
                            </div>

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
                                                const hasOpenBalances = (group.settlements?.length || 0) > 0
                                                const expenseCount = hasOpenBalances ? (group.expenses?.length || 0) : 0

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
                                            setSelectedFriendId(friend.userId || friend.id)
                                            setActiveTab('friend-profile')
                                        }}
                                        onDeleteFriend={async (friendId) => {
                                            const confirmed = window.confirm('Delete this friend from Firebase?')
                                            if (!confirmed) return

                                            try {
                                                await deleteFriendRecord(friendId)
                                            } catch (error) {
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
                                                    const isChecked = selectedFriendIds.includes(friend.userId)

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
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => setShowGroupMembersPanel((current) => !current)}
                                                    type="button"
                                                >
                                                    {showGroupMembersPanel ? 'Hide members' : 'Manage members'}
                                                </button>
                                                <button className="btn-secondary" onClick={handleGroupDelete} type="button">
                                                    Delete group
                                                </button>
                                            </div>
                                        </div>

                                        {showGroupMembersPanel ? (
                                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-white">Manage members</h3>
                                                    <span className="text-sm text-slate-400">{selectedGroupRecord.members.length} members</span>
                                                </div>

                                                <div className="space-y-2">
                                                    {selectedGroupRecord.members.map((member) => {
                                                        const canRemove = member.id !== userId
                                                        return (
                                                            <div
                                                                key={member.id}
                                                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                                                            >
                                                                <div>
                                                                    <div className="text-sm font-semibold text-white">{member.name}</div>
                                                                    <div className="text-xs text-slate-400">{member.email || 'No email'}</div>
                                                                </div>

                                                                <button
                                                                    className="btn-secondary"
                                                                    disabled={!canRemove}
                                                                    onClick={() => handleRemoveGroupMember(member.id)}
                                                                    type="button"
                                                                >
                                                                    {canRemove ? 'Remove' : 'You'}
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                                    <div className="mb-2 text-sm font-semibold text-white">Add existing friend</div>
                                                    {addableFriends.length ? (
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <select
                                                                className="auth-input"
                                                                onChange={(event) => setMemberToAddId(event.target.value)}
                                                                value={memberToAddId}
                                                            >
                                                                {addableFriends.map((friend) => (
                                                                    <option key={friend.id} value={friend.id}>
                                                                        {friend.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button className="btn-primary" onClick={handleAddGroupMember} type="button">
                                                                Add member
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-400">
                                                            All your friends in this account are already in the group.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-white">Expenses in this group</h3>
                                                <span className="text-sm text-slate-400">{selectedGroup.expenses.length} total</span>
                                            </div>

                                            {selectedGroup.expenses.length ? (
                                                <div className="space-y-3">
                                                    {groupedExpenses.openExpenses.map((expense) => {
                                                        const payer = selectedGroupRecord.members.find(
                                                            (member) => member.id === expense.paidByMemberId,
                                                        )
                                                        const participantIds =
                                                            Array.isArray(expense.owedByMemberIds) && expense.owedByMemberIds.length
                                                                ? expense.owedByMemberIds.filter((memberId) => memberId !== expense.paidByMemberId)
                                                                : selectedGroupRecord.members
                                                                    .filter((member) => member.id !== expense.paidByMemberId)
                                                                    .map((member) => member.id)
                                                        const participants = participantIds
                                                            .map((memberId) =>
                                                                selectedGroupRecord.members.find((member) => member.id === memberId),
                                                            )
                                                            .filter(Boolean)
                                                        const isCustomSplit = expense.splitMethod === 'custom'
                                                        const canEditExpense =
                                                            expense.createdByMemberId
                                                                ? expense.createdByMemberId === userId
                                                                : expense.paidByMemberId === userId

                                                        return (
                                                            <div key={expense.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div>
                                                                        <div className="text-sm font-semibold text-white">
                                                                            {payer?.name || 'Unknown'} paid ${expense.amount} for {expense.title || 'Untitled expense'}
                                                                        </div>
                                                                        <div className="mt-1 text-xs text-slate-400">
                                                                            {isCustomSplit ? 'Custom split' : 'Equal split'} between {[expense.paidByMemberId, ...participantIds]
                                                                                .map((memberId) => selectedGroupRecord.members.find((member) => member.id === memberId)?.name)
                                                                                .filter(Boolean)
                                                                                .join(', ') || 'No one'}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            className="btn-secondary"
                                                                            disabled={!canEditExpense}
                                                                            onClick={() => handleExpenseEdit(expense)}
                                                                            type="button"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            className="btn-secondary"
                                                                            disabled={!canEditExpense}
                                                                            onClick={() => handleExpenseDelete(expense.id)}
                                                                            type="button"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {!canEditExpense ? (
                                                                    <div className="mt-2 text-xs text-slate-400">
                                                                        Only the member who added this expense can edit or delete it.
                                                                    </div>
                                                                ) : null}

                                                            </div>
                                                        )
                                                    })}

                                                    {groupedExpenses.paidExpenses.length ? (
                                                        <>
                                                            <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                                Already paid history
                                                            </div>

                                                            {groupedExpenses.paidExpenses.map((expense) => {
                                                                const payer = selectedGroupRecord.members.find(
                                                                    (member) => member.id === expense.paidByMemberId,
                                                                )
                                                                const paidAt = expense.createdAt

                                                                return (
                                                                    <div
                                                                        key={`paid-${expense.id}`}
                                                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                                                                    >
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <div>
                                                                                <span className="font-semibold text-emerald-300">{payer?.name || 'Unknown'}</span>
                                                                                <span className="mx-2 text-slate-400">paid</span>
                                                                                <span className="font-semibold text-white">${Number(expense.amount || 0).toFixed(2)}</span>
                                                                                <span className="mx-2 text-slate-400">for</span>
                                                                                <span className="font-semibold text-emerald-300">{expense.title || 'Untitled expense'}</span>
                                                                            </div>
                                                                            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                                                                                Confirmed paid
                                                                            </span>
                                                                        </div>
                                                                        <div className="mt-1 text-xs text-slate-400">
                                                                            {paidAt ? `Added ${new Date(paidAt).toLocaleString()}` : 'Recorded in payment history'}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                                                    No expenses yet. Add one above to generate balances.
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-white">Who owes who</h3>
                                                <span className="text-sm text-slate-400">{selectedGroup.settlements.length} transfers</span>
                                            </div>

                                            {selectedGroup.settlements.length ? (
                                                <div className="space-y-2">
                                                    {selectedGroup.settlements.map((item, index) => {
                                                        const settlementKey = buildSettlementKey(
                                                            item.fromMemberId,
                                                            item.toMemberId,
                                                            item.amount,
                                                        )
                                                        const pendingPayment = pendingPaymentsBySettlementKey[settlementKey]
                                                        const isCurrentUserDebtor = userId === item.fromMemberId
                                                        const isCurrentUserCreditor = userId === item.toMemberId

                                                        return (
                                                            <div
                                                                key={`${item.fromMemberId}-${item.toMemberId}-${index}`}
                                                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                                                            >
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <div>
                                                                        <span className="font-semibold text-rose-300">{item.fromName}</span>
                                                                        <span className="mx-2 text-slate-400">owes</span>
                                                                        <span className="font-semibold text-emerald-300">{item.toName}</span>
                                                                        <span className="mx-2 text-slate-400">$</span>
                                                                        <span className="font-semibold text-white">{item.amount.toFixed(2)}</span>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {pendingPayment ? (
                                                                            isCurrentUserCreditor ? (
                                                                                <>
                                                                                    <button
                                                                                        className="btn-primary"
                                                                                        onClick={() => handleReviewPaymentRequest(pendingPayment.id, true)}
                                                                                        type="button"
                                                                                    >
                                                                                        Confirm
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn-secondary"
                                                                                        onClick={() => handleReviewPaymentRequest(pendingPayment.id, false)}
                                                                                        type="button"
                                                                                    >
                                                                                        Decline
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
                                                                                    Pending confirmation
                                                                                </span>
                                                                            )
                                                                        ) : isCurrentUserDebtor ? (
                                                                            <button
                                                                                className="btn-primary"
                                                                                onClick={() => handleRequestSettlementPayment(item)}
                                                                                type="button"
                                                                            >
                                                                                Paid
                                                                            </button>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
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
                                                <div>
                                                    <label className="text-xs text-slate-400" htmlFor="expense-title">
                                                        What was this for?
                                                    </label>
                                                    <input
                                                        id="expense-title"
                                                        className="auth-input mt-2"
                                                        onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))}
                                                        placeholder="Groceries, rent, utilities..."
                                                        type="text"
                                                        value={expenseForm.title}
                                                    />
                                                </div>

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
                                                    <label className="text-xs text-slate-400" htmlFor="expense-split-method">
                                                        Split method
                                                    </label>
                                                    <select
                                                        id="expense-split-method"
                                                        className="auth-input mt-2"
                                                        onChange={handleExpenseSplitMethodChange}
                                                        value={expenseForm.splitMethod}
                                                    >
                                                        <option value="equal">Equal split</option>
                                                        <option value="custom">Custom split</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-slate-400">
                                                        {expenseForm.splitMethod === 'equal'
                                                            ? 'Who owes a share?'
                                                            : 'Specify who owes how much'}
                                                    </div>
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

                                                {expenseForm.splitMethod === 'custom' ? (
                                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                        <div className="mb-3 text-sm font-semibold text-white">Custom split amounts</div>
                                                        <div className="grid gap-3 md:grid-cols-2">
                                                            {selectedGroupRecord.members
                                                                .filter((member) => member.id !== expenseForm.paidByMemberId)
                                                                .map((member) => (
                                                                    <div key={member.id}>
                                                                        <label className="text-xs text-slate-400" htmlFor={`share-${member.id}`}>
                                                                            {member.name}
                                                                        </label>
                                                                        <input
                                                                            id={`share-${member.id}`}
                                                                            className="auth-input mt-2"
                                                                            min="0"
                                                                            step="0.01"
                                                                            type="number"
                                                                            value={expenseForm.shareAmounts?.[member.id] || ''}
                                                                            onChange={(event) => handleShareAmountChange(member.id, event.target.value)}
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                ))}
                                                        </div>

                                                        {expenseSplitSummary ? (
                                                            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <span className="font-semibold text-white">Split total</span>
                                                                    <span className={Math.abs(expenseSplitSummary.total - Number(expenseForm.amount || 0)) <= 0.01 ? 'text-emerald-300' : 'text-rose-300'}>
                                                                        ${expenseSplitSummary.total.toFixed(2)} / ${Number(expenseForm.amount || 0).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 space-y-1 text-xs text-slate-400">
                                                                    {expenseSplitSummary.items.map((item) => (
                                                                        <div key={item.memberId} className="flex items-center justify-between gap-3">
                                                                            <span>{item.name}</span>
                                                                            <span>${Number(item.amount || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}

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
                                            <p className="mt-1 text-sm text-slate-300">{userEmail || 'No email available'}</p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                {friendsLoading ? 'Loading friends...' : `${friends.length} friend${friends.length === 1 ? '' : 's'}`}
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
