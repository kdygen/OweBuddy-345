import FormField from './FormField'

function AddFriendForm({ form, onChange, onSubmit }) {
    return (
        <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Friend name" hint="Anything is allowed here">
                    <input
                        className="auth-input"
                        name="name"
                        onChange={onChange}
                        placeholder="Jordan"
                        type="text"
                        value={form.name}
                    />
                </FormField>

                <FormField label="Email address" hint="Optional for now">
                    <input
                        className="auth-input"
                        name="email"
                        onChange={onChange}
                        placeholder="jordan@example.com"
                        type="email"
                        value={form.email}
                    />
                </FormField>
            </div>

            <FormField label="Note" hint="Add something helpful for later">
                <textarea
                    className="auth-input min-h-28 resize-none"
                    name="note"
                    onChange={onChange}
                    placeholder="Lunch, rent, trip, anything"
                    value={form.note}
                />
            </FormField>

            <button className="btn-primary w-full sm:w-auto" type="submit">
                Add friend
            </button>
        </form>
    )
}

export default AddFriendForm