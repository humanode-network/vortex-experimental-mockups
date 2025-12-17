import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "relative overflow-hidden bg-transparent text-[var(--primary)] shadow-[var(--shadow-control)] border border-[color:var(--primary)] ring-1 ring-inset ring-white/5 [filter:saturate(0.95)] supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150 after:pointer-events-none after:absolute after:inset-0 after:opacity-0 after:content-[''] after:bg-[radial-gradient(80%_120%_at_50%_0%,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0)_60%)] hover:bg-[color:var(--btn-primary-hover-bg)] hover:text-[var(--primary-foreground)] hover:shadow-[var(--shadow-primary)] hover:border-[color:var(--glass-border-strong)] hover:ring-white/15 hover:after:opacity-40 hover:[filter:saturate(1.25)] active:translate-y-[0.5px] active:bg-[color:var(--btn-primary-active-bg)] active:text-[var(--primary-foreground)] active:shadow-[var(--shadow-popover)] active:border-[color:var(--glass-border-strong)] active:ring-white/30 active:after:opacity-100 active:after:animate-[btn-flash_420ms_ease-out] active:[filter:saturate(1.45)] motion-reduce:active:after:animate-none focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--panel)]",
        ghost:
          "bg-transparent text-[var(--primary)] border border-border shadow-[var(--shadow-control)] hover:bg-[var(--primary-dim)] hover:border-[var(--primary)] focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--panel)]",
        outline:
          "bg-[var(--panel)] text-[var(--primary)] border border-[var(--primary)] shadow-[var(--shadow-control)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--panel)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-11 px-5 text-lg",
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
