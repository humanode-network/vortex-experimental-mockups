import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";

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
      <CardHeader className="relative pb-0">
        {badge ? (
          <div className="absolute top-4 right-4 z-10">{badge}</div>
        ) : null}
        <div className="flex min-h-16 items-center justify-center text-center">
          <CardTitle className="leading-tight">{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">{children}</CardContent>

      {footer ? <CardFooter className="pt-0">{footer}</CardFooter> : null}
    </Card>
  );
};

export default AppCard;
