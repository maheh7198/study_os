export default function Badge({ children, className = '' }) {
  return <span className={`ui-badge ${className}`.trim()}>{children}</span>;
}
