function FormField({ label, hint, children }) {
    return (
        <label className="space-y-2 text-sm text-slate-200">
            <span className="block font-medium">{label}</span>
            {children}
            {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
        </label>
    )
}

export default FormField