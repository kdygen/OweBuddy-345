import FormField from './FormField'

function CreateGroupForm({
    groupName,
    onGroupNameChange,
    friends,
    selectedFriendIds,
    onToggleFriend,
    newGroupPerson,
    onNewGroupPersonChange,
    onAddPerson,
    extraPeople,
    onSubmit,
    onCancel,
}) {
    return (
        <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Group name" hint="Trip, Roommates, or Weekend plans">
                    <input
                        className="auth-input"
                        name="groupName"
                        onChange={onGroupNameChange}
                        placeholder="Trip to Lisbon"
                        type="text"
                        value={groupName}
                    />
                </FormField>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">Selected members</div>
                    <div className="mt-3 text-sm text-slate-300">
                        {selectedFriendIds.length === 0
                            ? 'Pick current friends below or add a person.'
                            : `${selectedFriendIds.length} friend(s) selected.`}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Choose current friends</div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {friends.map((friend) => (
                        <label
                            key={friend.id}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                        >
                            <input
                                className="accent-amber-300"
                                type="checkbox"
                                checked={selectedFriendIds.includes(friend.id)}
                                onChange={() => onToggleFriend(friend.id)}
                            />
                            <div>
                                <div className="font-semibold text-white">{friend.name}</div>
                                <div className="text-xs text-slate-400">{friend.email}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Add person name" hint="Optional extra member">
                    <input
                        className="auth-input"
                        name="name"
                        onChange={onNewGroupPersonChange}
                        placeholder="Alex"
                        type="text"
                        value={newGroupPerson.name}
                    />
                </FormField>

                <FormField label="Email address" hint="Optional for now">
                    <input
                        className="auth-input"
                        name="email"
                        onChange={onNewGroupPersonChange}
                        placeholder="alex@example.com"
                        type="email"
                        value={newGroupPerson.email}
                    />
                </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button className="btn-secondary" onClick={onAddPerson} type="button">
                    Add person
                </button>
                <div className="text-sm text-slate-300">{extraPeople.length} custom person(s) added.</div>
            </div>

            {extraPeople.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-white">People added to this group</div>
                    <div className="grid gap-2">
                        {extraPeople.map((person) => (
                            <div key={person.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <div className="font-medium text-white">{person.name}</div>
                                <div className="text-slate-400">{person.email}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <button className="btn-primary" type="submit">
                    Create group
                </button>
                <button className="btn-secondary" type="button" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default CreateGroupForm;
