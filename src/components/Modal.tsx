import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  ariaLabel?: string;
  align?: "top" | "center";
  overlayClassName?: string;
  contentClassName?: string;
};

export function Modal({
  open,
  onOpenChange,
  children,
  ariaLabel,
  align = "center",
  overlayClassName,
  contentClassName,
}: ModalProps) {
  const labelId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const contentEl = contentRef.current;
    contentEl?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-(--veil) p-4 backdrop-blur-sm",
        align === "top" ? "items-start" : "items-center",
        overlayClassName,
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : labelId}
        tabIndex={-1}
        className={cn(
          "w-full outline-none",
          align === "top" ? "mt-8" : "",
          contentClassName,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {ariaLabel ? null : <span id={labelId} className="sr-only" />}
        {children}
      </div>
    </div>,
    document.body,
  );
}
