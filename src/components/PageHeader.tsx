import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  right?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  right,
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  const alignClasses = align === "center" ? "text-center" : "text-left";
  const blockAlign =
    align === "center" ? "items-center justify-center" : "items-start";

  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className={cn("flex flex-col gap-1", blockAlign, alignClasses)}>
        {eyebrow ? (
          <p
            className={cn(
              "text-xs tracking-wide text-muted uppercase",
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn("text-xl font-semibold text-text", titleClassName)}>
          {title}
        </h1>
        {description ? (
          <p className={cn("text-sm text-muted", descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export default PageHeader;
