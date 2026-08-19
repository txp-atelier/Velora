import { PackageOpen } from "lucide-react";

export default function EmptyState({ icon: Icon = PackageOpen, title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
