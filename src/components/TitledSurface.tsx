import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type TitledSurfaceProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
} & Omit<ComponentProps<typeof Surface>, "className" | "children">;

export function TitledSurface({
  title,
  children,
  className,
  titleClassName,
  variant = "panelAlt",
  ...props
}: TitledSurfaceProps) {
  return (
    <Surface
      variant={variant}
      className={cn("space-y-2 px-4 py-3", className)}
      {...props}
    >
      <p className={cn("text-sm font-semibold", titleClassName)}>{title}</p>
      {children}
    </Surface>
  );
}
