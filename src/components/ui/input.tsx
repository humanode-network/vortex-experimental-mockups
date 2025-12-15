import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const base =
  "flex h-10 w-full rounded-xl border border-border bg-[var(--panel-alt)] px-3 py-2 text-sm text-[var(--text)] shadow-sm transition " +
  "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input type={type} className={cn(base, className)} ref={ref} {...props} />
    );
  },
);
Input.displayName = "Input";
