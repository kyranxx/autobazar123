import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
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
  children: ReactNode;
}) {
  const generatedId = useId();
  let controlId = generatedId;
  let renderedChild = children;

  // Keep label->input wiring reliable even when the caller does not provide an id.
  if (isValidElement(children)) {
    const child = children as ReactElement<{ id?: string }>;
    controlId = child.props.id || generatedId;

    if (!child.props.id) {
      renderedChild = cloneElement(child, { id: controlId });
    }
  }

  return (
    <div className={className}>
      <Label htmlFor={controlId} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </Label>
      {renderedChild}
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
