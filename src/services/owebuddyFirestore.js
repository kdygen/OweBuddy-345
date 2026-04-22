import {
    addDoc,
    deleteDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const usersCollection = () => collection(db, 'users')
const friendRequestsCollection = () => collection(db, 'friendRequests')
const friendshipsCollection = () => collection(db, 'friendships')
const groupsCollection = () => collection(db, 'groups')

const ensureDb = () => {
    if (!db) {
        throw new Error('Firebase is not configured. Set the VITE_FIREBASE_* environment variables.')
    }
}

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

const normalizeEmail = (email) => email?.trim().toLowerCase() || ''

const buildPairId = (leftUserId, rightUserId) => {
    return [leftUserId, rightUserId].sort().join('__')
}

const getUserRef = (userId) => doc(db, 'users', userId)

export const ensureUserProfileRecord = async (user) => {
    ensureDb()

    if (!user?.uid) {
        throw new Error('A logged-in user is required.')
    }

    const displayName = user.displayName?.trim() || user.email?.trim() || 'User'
    const email = user.email?.trim() || ''

    return setDoc(
        getUserRef(user.uid),
        {
            uid: user.uid,
            name: displayName,
            email,
            emailLower: normalizeEmail(email),
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        },
        { merge: true },
    )
}

export const findUserByEmail = async (email) => {
    ensureDb()

    const emailLower = normalizeEmail(email)
    if (!emailLower) {
        throw new Error('Please enter an email address.')
    }

    const usersByEmailQuery = query(usersCollection(), where('emailLower', '==', emailLower))
    const snapshot = await getDocs(usersByEmailQuery)

    if (snapshot.empty) {
        return null
    }

    const [first] = snapshot.docs
    return { id: first.id, ...first.data() }
}

export const watchUserFriends = (ownerId, onNext, onError) => {
    if (!db) {
        onNext([])
        return () => { }
    }

    const friendQuery = query(friendshipsCollection(), where('userIds', 'array-contains', ownerId))

    return onSnapshot(
        friendQuery,
        (snapshot) => {
            const friendRows = snapshot.docs
                .map(mapDoc)
                .map((friendship) => {
                    const users = friendship.users || {}
                    const otherUserId = (friendship.userIds || []).find((id) => id !== ownerId)
                    const otherUser = otherUserId ? users[otherUserId] : null

                    if (!otherUserId || !otherUser) {
                        return null
                    }

                    return {
                        id: friendship.id,
                        userId: otherUserId,
                        name: otherUser.name || otherUser.email || 'Unnamed friend',
                        email: otherUser.email || '',
                        note: '',
                        status: 'Active',
                    }
                })
                .filter(Boolean)

            onNext(friendRows)
        },
        (error) => {
            if (onError) onError(error)
        },
    )
}

export const watchUserFriendRequests = (ownerId, onNext, onError) => {
    if (!db) {
        onNext({ incoming: [], outgoing: [] })
        return () => { }
    }

    let incoming = []
    let outgoing = []

    const emit = () => {
        onNext({ incoming, outgoing })
    }

    const incomingQuery = query(
        friendRequestsCollection(),
        where('recipientId', '==', ownerId),
        where('status', '==', 'pending'),
    )
    const outgoingQuery = query(
        friendRequestsCollection(),
        where('requesterId', '==', ownerId),
        where('status', '==', 'pending'),
    )

    const unsubscribeIncoming = onSnapshot(
        incomingQuery,
        (snapshot) => {
            incoming = snapshot.docs.map(mapDoc)
            emit()
        },
        (error) => {
            if (onError) onError(error)
        },
    )

    const unsubscribeOutgoing = onSnapshot(
        outgoingQuery,
        (snapshot) => {
            outgoing = snapshot.docs.map(mapDoc)
            emit()
        },
        (error) => {
            if (onError) onError(error)
        },
    )

    return () => {
        unsubscribeIncoming()
        unsubscribeOutgoing()
    }
}

export const sendFriendRequestByEmail = async ({ requesterId, requesterName, requesterEmail, targetEmail }) => {
    ensureDb()

    const normalizedTargetEmail = normalizeEmail(targetEmail)
    if (!normalizedTargetEmail) {
        throw new Error('Please enter your friend\'s email.')
    }

    const targetUser = await findUserByEmail(normalizedTargetEmail)
    if (!targetUser) {
        throw new Error('No account exists with that email yet.')
    }

    if (targetUser.id === requesterId) {
        throw new Error('You cannot send a friend request to yourself.')
    }

    const pairId = buildPairId(requesterId, targetUser.id)
    const friendshipRef = doc(db, 'friendships', pairId)
    const friendshipSnapshot = await getDoc(friendshipRef)
    if (friendshipSnapshot.exists()) {
        throw new Error('You are already friends.')
    }

    const requestRef = doc(db, 'friendRequests', pairId)
    const existingRequest = await getDoc(requestRef)
    const requestData = existingRequest.exists() ? existingRequest.data() : null

    if (requestData?.status === 'pending') {
        if (requestData.requesterId === requesterId) {
            throw new Error('Friend request already sent and awaiting approval.')
        }
        throw new Error('This user already sent you a friend request. Accept it from your requests list.')
    }

    await setDoc(requestRef, {
        requesterId,
        requesterName: requesterName?.trim() || requesterEmail || 'User',
        requesterEmail: normalizeEmail(requesterEmail),
        recipientId: targetUser.id,
        recipientName: targetUser.name?.trim() || targetUser.email || 'User',
        recipientEmail: normalizeEmail(targetUser.email),
        status: 'pending',
        updatedAt: serverTimestamp(),
        createdAt: existingRequest.exists() ? requestData.createdAt || serverTimestamp() : serverTimestamp(),
    })

    return targetUser
}

export const acceptFriendRequest = async (requestId, currentUserId) => {
    ensureDb()

    const requestRef = doc(db, 'friendRequests', requestId)
    const requestSnapshot = await getDoc(requestRef)

    if (!requestSnapshot.exists()) {
        throw new Error('Friend request was not found.')
    }

    const request = requestSnapshot.data()
    if (request.status !== 'pending') {
        throw new Error('This friend request is no longer pending.')
    }

    if (request.recipientId !== currentUserId) {
        throw new Error('You can only accept requests sent to you.')
    }

    const requesterProfileSnapshot = await getDoc(getUserRef(request.requesterId))
    const recipientProfileSnapshot = await getDoc(getUserRef(request.recipientId))

    const requesterProfile = requesterProfileSnapshot.data() || {
        name: request.requesterName,
        email: request.requesterEmail,
    }
    const recipientProfile = recipientProfileSnapshot.data() || {
        name: request.recipientName,
        email: request.recipientEmail,
    }

    const pairId = buildPairId(request.requesterId, request.recipientId)
    const friendshipRef = doc(db, 'friendships', pairId)
    const batch = writeBatch(db)

    batch.set(friendshipRef, {
        userIds: [request.requesterId, request.recipientId].sort(),
        users: {
            [request.requesterId]: {
                name: requesterProfile.name?.trim() || requesterProfile.email || 'User',
                email: normalizeEmail(requesterProfile.email),
            },
            [request.recipientId]: {
                name: recipientProfile.name?.trim() || recipientProfile.email || 'User',
                email: normalizeEmail(recipientProfile.email),
            },
        },
        status: 'accepted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })

    batch.update(requestRef, {
        status: 'accepted',
        updatedAt: serverTimestamp(),
    })

    await batch.commit()
}

export const declineFriendRequest = async (requestId, currentUserId) => {
    ensureDb()

    const requestRef = doc(db, 'friendRequests', requestId)
    const requestSnapshot = await getDoc(requestRef)

    if (!requestSnapshot.exists()) {
        throw new Error('Friend request was not found.')
    }

    const request = requestSnapshot.data()
    if (request.recipientId !== currentUserId) {
        throw new Error('You can only decline requests sent to you.')
    }

    return updateDoc(requestRef, {
        status: 'declined',
        updatedAt: serverTimestamp(),
    })
}

export const watchUserGroups = (ownerId, onNext, onError) => {
    if (!db) {
        onNext([])
        return () => { }
    }

    const groupQuery = query(groupsCollection(), where('memberIds', 'array-contains', ownerId))

    return onSnapshot(
        groupQuery,
        (snapshot) => {
            onNext(snapshot.docs.map(mapDoc))
        },
        (error) => {
            if (onError) onError(error)
        },
    )
}

export const createFriendRecord = async (ownerId, friend) => {
    return sendFriendRequestByEmail({
        requesterId: ownerId,
        requesterName: friend.name,
        requesterEmail: friend.requesterEmail,
        targetEmail: friend.email,
    })
}

export const createGroupRecord = async (ownerId, group) => {
    ensureDb()

    const incomingMembers = Array.isArray(group.members) ? group.members : []
    const membersById = incomingMembers.reduce((accumulator, member) => {
        if (!member?.id) return accumulator
        accumulator[member.id] = {
            id: member.id,
            name: member.name?.trim() || member.email?.trim() || 'Unnamed member',
            email: normalizeEmail(member.email),
        }
        return accumulator
    }, {})

    if (!membersById[ownerId]) {
        membersById[ownerId] = {
            id: ownerId,
            name: group.ownerName?.trim() || 'You',
            email: normalizeEmail(group.ownerEmail),
        }
    }

    const members = Object.values(membersById)
    const memberIds = members.map((member) => member.id)

    return addDoc(groupsCollection(), {
        createdBy: ownerId,
        name: group.name.trim(),
        description: group.description.trim(),
        members,
        memberIds,
        expenses: [],
        payments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
}

export const updateGroupMembers = async (groupId, members) => {
    ensureDb()

    const dedupedMembers = (Array.isArray(members) ? members : []).reduce((accumulator, member) => {
        if (!member?.id) return accumulator
        if (accumulator.some((item) => item.id === member.id)) return accumulator

        return [
            ...accumulator,
            {
                id: member.id,
                name: member.name?.trim() || member.email?.trim() || 'Unnamed member',
                email: normalizeEmail(member.email),
            },
        ]
    }, [])

    return updateDoc(doc(db, 'groups', groupId), {
        members: dedupedMembers,
        memberIds: dedupedMembers.map((member) => member.id),
        updatedAt: serverTimestamp(),
    })
}

export const updateGroupPayments = async (groupId, payments) => {
    ensureDb()

    return updateDoc(doc(db, 'groups', groupId), {
        payments: Array.isArray(payments) ? payments : [],
        updatedAt: serverTimestamp(),
    })
}

export const updateGroupExpenses = async (groupId, expenses) => {
    ensureDb()

    return updateDoc(doc(db, 'groups', groupId), {
        expenses,
        updatedAt: serverTimestamp(),
    })
}

export const deleteFriendRecord = async (friendId) => {
    ensureDb()

    return deleteDoc(doc(db, 'friendships', friendId))
}

export const deleteGroupRecord = async (groupId) => {
    ensureDb()

    return deleteDoc(doc(db, 'groups', groupId))
}