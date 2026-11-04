export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon" aria-hidden="true">
          <Icon size={26} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
