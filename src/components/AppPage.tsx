import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PageHint } from "@/components/PageHint";

type AppPageVariant = "stack6" | "stack5" | "stack4" | "custom";

const variantClasses: Record<AppPageVariant, string> = {
  stack6: "flex flex-col gap-6",
  stack5: "flex flex-col gap-5",
  stack4: "flex flex-col gap-4",
  custom: "",
};

type AppPageProps = {
  pageId?: string;
  variant?: AppPageVariant;
  className?: string;
  children: ReactNode;
};

export function AppPage({
  pageId,
  variant = "stack6",
  className,
  children,
}: AppPageProps) {
  return (
    <div className={cn("app-page", variantClasses[variant], className)}>
      {pageId ? <PageHint pageId={pageId} /> : null}
      {children}
    </div>
  );
}
