import { Label } from "@/components/ui/shadcn/label";

export function FormField({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm font-medium text-primary">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
