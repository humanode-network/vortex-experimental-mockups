import * as React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type PillOwnProps = {
  variant?: "panel" | "panelAlt";
  tone?: "muted" | "primary" | "default";
  size?: "xs" | "sm";
  className?: string;
  children: React.ReactNode;
};

type SurfacePropKeys =
  | "variant"
  | "radius"
  | "shadow"
  | "borderStyle"
  | "className";

export type PillProps<C extends React.ElementType = "span"> = PillOwnProps & {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, SurfacePropKeys | "as">;

const sizeClass: Record<NonNullable<PillProps["size"]>, string> = {
  xs: "px-2 py-0.5 text-[0.7rem]",
  sm: "px-2 py-1 text-[0.75rem]",
};

export function Pill<C extends React.ElementType = "span">({
  as = "span" as C,
  variant = "panel",
  tone = "muted",
  size = "xs",
  className,
  children,
  ...rest
}: PillProps<C>) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "default"
        ? "text-text"
        : "text-muted";

  return (
    <Surface
      as={as}
      variant={variant}
      radius="full"
      shadow="control"
      className={cn(
        "border border-border tracking-wide",
        sizeClass[size],
        toneClass,
        className,
      )}
      {...(rest as Omit<
        React.ComponentPropsWithoutRef<C>,
        SurfacePropKeys | "as"
      >)}
    >
      {children}
    </Surface>
  );
}
