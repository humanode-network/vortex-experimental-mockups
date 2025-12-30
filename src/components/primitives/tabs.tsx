import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: React.ReactNode }[];
  allowDeselect?: boolean;
  emptyValue?: string;
}

export function Tabs({
  value,
  onValueChange,
  options,
  allowDeselect = false,
  emptyValue = "",
  className,
  ...props
}: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-panel [background-image:var(--card-grad)] p-1 shadow-(--shadow-control) ring-1 ring-(--glass-border) ring-inset",
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
            aria-pressed={active}
            onClick={() =>
              onValueChange(
                allowDeselect && active ? emptyValue : String(opt.value),
              )
            }
            className={cn(
              "min-w-[90px] rounded-full px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "border border-(--glass-border) bg-(--btn-primary-hover-bg) text-primary-foreground shadow-(--shadow-control) supports-backdrop-filter:backdrop-blur-sm supports-backdrop-filter:backdrop-saturate-150"
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
