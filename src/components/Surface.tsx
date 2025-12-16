import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva(
  "border border-border [background-image:var(--card-grad)] bg-cover bg-no-repeat ring-1 ring-inset ring-[color:var(--glass-border)]",
  {
    variants: {
      variant: {
        panel: "bg-panel",
        panelAlt: "bg-panel-alt",
        transparent: "bg-transparent",
      },
      radius: {
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
      shadow: {
        none: "",
        control: "shadow-[var(--shadow-control)]",
        tile: "shadow-[var(--shadow-tile)]",
        card: "shadow-[var(--shadow-card)]",
        popover: "shadow-[var(--shadow-popover)]",
        primary: "shadow-[var(--shadow-primary)]",
      },
      borderStyle: {
        solid: "",
        dashed: "border-dashed",
      },
    },
    defaultVariants: {
      variant: "panel",
      radius: "2xl",
      shadow: "tile",
      borderStyle: "solid",
    },
  },
);

export type SurfaceProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceVariants> & {
    as?: React.ElementType;
  };

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      as: Comp = "div",
      className,
      variant,
      radius,
      shadow,
      borderStyle,
      ...props
    },
    ref,
  ) => {
    return (
      <Comp
        ref={ref as any}
        className={cn(
          surfaceVariants({ variant, radius, shadow, borderStyle }),
          className,
        )}
        {...(props as any)}
      />
    );
  },
);
Surface.displayName = "Surface";

export default Surface;
