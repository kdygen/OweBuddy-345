const toCents = (value) => Math.round(Number(value || 0) * 100)
const fromCents = (value) => Number((value / 100).toFixed(2))

export function calculateGroupBalances(group, currentUser = 'You') {
    const members = Array.isArray(group.members) ? group.members : []
    const expenses = Array.isArray(group.expenses) ? group.expenses : []
    const memberNameById = new Map(members.map((member) => [member.id, member.name]))
    const balanceByMemberId = new Map(members.map((member) => [member.id, 0]))

    const currentUserMember = members.find((member) => member.name === currentUser)
    const currentUserId = currentUserMember?.id

    expenses.forEach((expense) => {
        const expenseTotalCents = toCents(expense.amount)
        if (!expenseTotalCents) return

        const payerId = expense.paidByMemberId
        if (!balanceByMemberId.has(payerId)) return

        balanceByMemberId.set(payerId, balanceByMemberId.get(payerId) + expenseTotalCents)

        if (Array.isArray(expense.shares) && expense.shares.length) {
            expense.shares.forEach((share) => {
                const shareAmountCents = toCents(share.amount)
                if (!balanceByMemberId.has(share.memberId)) return
                balanceByMemberId.set(
                    share.memberId,
                    balanceByMemberId.get(share.memberId) - shareAmountCents,
                )
            })
            return
        }

        const defaultOwedByIds = members
            .map((member) => member.id)
            .filter((memberId) => memberId !== expense.paidByMemberId)

        const owedByIds = Array.isArray(expense.owedByMemberIds) && expense.owedByMemberIds.length
            ? expense.owedByMemberIds
            : defaultOwedByIds

        if (!owedByIds.length) return

        const shareCents = Math.floor(expenseTotalCents / owedByIds.length)
        let remainderCents = expenseTotalCents % owedByIds.length

        owedByIds.forEach((memberId) => {
            if (!balanceByMemberId.has(memberId)) return
            const memberShare = shareCents + (remainderCents > 0 ? 1 : 0)
            balanceByMemberId.set(memberId, balanceByMemberId.get(memberId) - memberShare)
            if (remainderCents > 0) remainderCents -= 1
        })
    })

    const people = members.map((member) => ({
        id: member.id,
        name: member.name,
        net: fromCents(balanceByMemberId.get(member.id) || 0),
    }))

    const creditors = []
    const debtors = []

    balanceByMemberId.forEach((netAmount, memberId) => {
        if (netAmount > 0) creditors.push({ memberId, remainingCents: netAmount })
        if (netAmount < 0) debtors.push({ memberId, remainingCents: Math.abs(netAmount) })
    })

    const settlements = []
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex]
        const debtor = debtors[debtorIndex]
        const transferCents = Math.min(creditor.remainingCents, debtor.remainingCents)

        settlements.push({
            fromMemberId: debtor.memberId,
            fromName: memberNameById.get(debtor.memberId) || 'Unknown',
            toMemberId: creditor.memberId,
            toName: memberNameById.get(creditor.memberId) || 'Unknown',
            amount: fromCents(transferCents),
        })

        creditor.remainingCents -= transferCents
        debtor.remainingCents -= transferCents

        if (creditor.remainingCents === 0) creditorIndex += 1
        if (debtor.remainingCents === 0) debtorIndex += 1
    }

    const currentUserNetCents = currentUserId ? balanceByMemberId.get(currentUserId) || 0 : 0

    return {
        id: group.id,
        name: group.name,
        membersCount: members.length,
        people,
        settlements,
        expenses,
        youOwe: currentUserNetCents < 0 ? fromCents(Math.abs(currentUserNetCents)) : 0,
        youAreOwed: currentUserNetCents > 0 ? fromCents(currentUserNetCents) : 0,
    }
}
