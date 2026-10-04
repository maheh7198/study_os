export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button className={`ui-button ${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
