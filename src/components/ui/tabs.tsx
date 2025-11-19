import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function Tabs({ value, onValueChange, options, className, ...props }: TabsProps) {
  return (
    <div className={cn("inline-flex rounded-full border border-border bg-panel p-1", className)} {...props}>
      {options.map((opt) => {
        const active = opt.value === value;
        const style = active
          ? { backgroundColor: "var(--primary)", color: "#fff", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }
          : { color: "var(--text)", backgroundColor: "transparent" };
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "min-w-[90px] rounded-full px-3 py-1.5 text-sm font-semibold transition",
              !active && "hover:bg-panel-alt",
            )}
            style={style}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
