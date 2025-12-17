import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "muted";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
  };
  const variants = {
    default:
      "bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--primary-dim)]",
    outline: "border border-border bg-transparent text-text",
    muted: "border border-border bg-panel-alt text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
