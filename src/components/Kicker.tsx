import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type KickerProps = {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  as?: "p" | "span" | "div" | "dt";
};

export function Kicker({
  children,
  className,
  align = "left",
  as: Component = "p",
}: KickerProps) {
  return (
    <Component
      className={cn(
        "text-xs tracking-wide text-muted uppercase",
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left",
        className,
      )}
    >
      {children}
    </Component>
  );
}
