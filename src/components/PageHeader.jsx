export default function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <header className="ui-page-header">
      <div className={Icon ? 'ui-page-title-area' : undefined}>
        {Icon ? (
          <div className="ui-page-title-icon" aria-hidden="true">
            <Icon size={29} />
          </div>
        ) : null}
        <div className="ui-page-title-copy">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {action || null}
    </header>
  );
}
