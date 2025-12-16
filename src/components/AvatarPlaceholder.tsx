import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarPlaceholderProps = {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses: Record<
  NonNullable<AvatarPlaceholderProps["size"]>,
  string
> = {
  sm: "h-20 w-20 text-base",
  md: "h-24 w-24 text-lg",
  lg: "h-28 w-28 text-lg",
};

export const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({
  initials,
  size = "lg",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-4 border-border bg-panel-alt font-semibold text-muted shadow-inner",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

export default AvatarPlaceholder;
