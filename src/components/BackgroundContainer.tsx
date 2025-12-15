import React from "react";
import { cn } from "@/lib/utils";

type BackgroundContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("app-page flex flex-col gap-6", className)}>
      {children}
    </div>
  );
};

export default BackgroundContainer;
