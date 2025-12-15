import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 cursor-pointer items-center",
          className,
        )}
      >
        <input type="checkbox" className="peer sr-only" ref={ref} {...props} />
        <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-[color:var(--primary-dim)]" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full border border-border bg-panel shadow-sm transition peer-checked:translate-x-5" />
      </label>
    );
  },
);
Switch.displayName = "Switch";
