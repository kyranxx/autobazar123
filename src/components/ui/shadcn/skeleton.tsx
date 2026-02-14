import { cn } from "@/utils/cn";

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse", variantClasses[variant], className)}
      style={{ ...style, width, height }}
      {...props}
    />
  );
}

export { Skeleton };
