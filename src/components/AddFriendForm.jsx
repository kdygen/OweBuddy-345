import FormField from './FormField'

function AddFriendForm({ form, onChange, onSubmit }) {
    return (
        <form className="space-y-5" onSubmit={onSubmit}>
            <FormField label="Friend email" hint="Must match an existing OweBuddy account">
                <input
                    className="auth-input"
                    name="email"
                    onChange={onChange}
                    placeholder="jordan@example.com"
                    required
                    type="email"
                    value={form.email}
                />
            </FormField>

            <FormField label="Message" hint="Optional note with your friend request">
                <textarea
                    className="auth-input min-h-28 resize-none"
                    name="note"
                    onChange={onChange}
                    placeholder="Hey, let\'s track expenses together"
                    value={form.note}
                />
            </FormField>

            <button className="btn-primary w-full sm:w-auto" type="submit">
                Send request
            </button>
        </form>
    )
}

export default AddFriendForm