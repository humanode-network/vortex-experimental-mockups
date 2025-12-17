import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] [background-image:var(--btn-primary-grad),var(--btn-sheen)] bg-cover bg-no-repeat text-[var(--primary-foreground)] shadow-[var(--shadow-primary)] border border-[color:var(--glass-border)] hover:bg-[var(--primary-hover)] hover:[background-image:var(--btn-primary-hover-grad),var(--btn-sheen)] hover:shadow-[var(--shadow-popover)] hover:border-[color:var(--glass-border-strong)] focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--panel)]",
        ghost:
          "bg-transparent text-[var(--primary)] border border-border shadow-[var(--shadow-control)] hover:bg-[var(--primary-dim)] hover:border-[var(--primary)] focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--panel)]",
        outline:
          "bg-[var(--panel)] text-[var(--primary)] border border-[var(--primary)] shadow-[var(--shadow-control)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--panel)]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
