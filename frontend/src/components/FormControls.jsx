export function FormField({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && <span className="required-mark" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="field-error">{error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`.trim()} {...props} />;
}

export function Textarea({ className = '', rows = 5, ...props }) {
  return <textarea className={`input textarea ${className}`.trim()} rows={rows} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`input select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
