export function TrustSignal({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-xl ${
        active ? "bg-success/10 text-success" : "bg-surface text-secondary"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
