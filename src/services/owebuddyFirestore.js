import {
    addDoc,
    deleteDoc,
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const friendsCollection = () => collection(db, 'friends')
const groupsCollection = () => collection(db, 'groups')

const ensureDb = () => {
    if (!db) {
        throw new Error('Firebase is not configured. Set the VITE_FIREBASE_* environment variables.')
    }
}

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

export const watchUserFriends = (ownerId, onNext, onError) => {
    if (!db) {
        onNext([])
        return () => { }
    }

    const friendQuery = query(friendsCollection(), where('ownerId', '==', ownerId))

    return onSnapshot(
        friendQuery,
        (snapshot) => {
            onNext(snapshot.docs.map(mapDoc))
        },
        (error) => {
            if (onError) onError(error)
        },
    )
}

export const watchUserGroups = (ownerId, onNext, onError) => {
    if (!db) {
        onNext([])
        return () => { }
    }

    const groupQuery = query(groupsCollection(), where('ownerId', '==', ownerId))

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
    ensureDb()

    return addDoc(friendsCollection(), {
        ownerId,
        name: friend.name.trim(),
        email: friend.email.trim(),
        note: friend.note.trim(),
        status: friend.status || 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
}

export const createGroupRecord = async (ownerId, group) => {
    ensureDb()

    return addDoc(groupsCollection(), {
        ownerId,
        name: group.name.trim(),
        description: group.description.trim(),
        members: Array.isArray(group.members) ? group.members : [],
        expenses: [],
        createdAt: serverTimestamp(),
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

    return deleteDoc(doc(db, 'friends', friendId))
}

export const deleteGroupRecord = async (groupId) => {
    ensureDb()

    return deleteDoc(doc(db, 'groups', groupId))
}