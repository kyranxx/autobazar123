import { CheckCircleIcon } from "@/components/ui/Icons";

export function TrustBadge({ label }: { label: string }) {
  return (
    <span className="trust-badge-enhanced">
      <CheckCircleIcon className="size-3" />
      {label}
    </span>
  );
}
