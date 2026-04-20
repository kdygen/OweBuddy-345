function FriendsList({ friends, isLoading = false, onDeleteFriend, onSelectFriend }) {
    if (isLoading) {
        return (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center">
                <div className="text-lg font-semibold text-white">Loading friends</div>
                <div className="mt-2 text-sm text-slate-400">Fetching friend records from Firebase.</div>
            </div>
        )
    }

    if (!friends.length) {
        return (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center">
                <div className="text-lg font-semibold text-white">0 friends saved</div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {friends.map((friend) => (
                <div
                    key={friend.id}
                    className={`rounded-3xl border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10 ${
                        onSelectFriend ? 'cursor-pointer' : ''
                    }`}
                    onClick={onSelectFriend ? () => onSelectFriend(friend) : undefined}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-lg font-semibold text-white">{friend.name}</div>
                            <div className="text-sm text-slate-400">{friend.email}</div>
                            {friend.note ? <div className="mt-2 text-sm text-slate-300">{friend.note}</div> : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm font-medium text-emerald-100">
                                {friend.status}
                            </div>
                            {onDeleteFriend ? (
                                <button
                                    className="btn-secondary"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onDeleteFriend(friend.id)
                                    }}
                                    type="button"
                                >
                                    Delete
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default FriendsList