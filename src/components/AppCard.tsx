import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AppCardProps = {
  title: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export const AppCard: React.FC<AppCardProps> = ({
  title,
  badge,
  children,
  footer,
  className,
}) => {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-0">
        <div className="flex min-h-16 items-start justify-between gap-2">
          <CardTitle className="max-w-[70%] leading-tight">{title}</CardTitle>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">{children}</CardContent>

      {footer ? <CardFooter className="pt-0">{footer}</CardFooter> : null}
    </Card>
  );
};

export default AppCard;
