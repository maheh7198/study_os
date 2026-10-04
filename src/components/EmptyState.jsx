export default function EmptyState({ title, description, action }) {
  return (
    <div className="ui-empty-state">
      <div>
        <strong>{title}</strong>
        <div>{description}</div>
        {action ? <div style={{ marginTop: '0.8rem' }}>{action}</div> : null}
      </div>
    </div>
  );
}
