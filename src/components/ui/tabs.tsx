import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function Tabs({
  value,
  onValueChange,
  options,
  className,
  ...props
}: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-panel [background-image:var(--card-grad)] p-1 shadow-[var(--shadow-control)] ring-1 ring-inset ring-[color:var(--glass-border)]",
        className,
      )}
      {...props}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "min-w-[90px] rounded-full px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-[var(--primary)] [background-image:var(--btn-primary-grad),var(--btn-sheen)] bg-cover bg-no-repeat text-[var(--primary-foreground)] shadow-[var(--shadow-control)] border border-[color:var(--glass-border)]"
                : "bg-transparent text-text hover:bg-panel-alt",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
