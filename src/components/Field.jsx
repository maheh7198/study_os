export default function Field({ label, children, className = '' }) {
  return (
    <div className={`ui-field ${className}`.trim()}>
      {label ? <label>{label}</label> : null}
      {children}
    </div>
  );
}
