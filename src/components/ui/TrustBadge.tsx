import { CheckCircleIcon } from "@/components/ui/Icons";

export function TrustBadge({ label }: { label: string }) {
    return (
        <span className="trust-badge-enhanced">
            <CheckCircleIcon className="w-3 h-3" />
            {label}
        </span>
    );
}
