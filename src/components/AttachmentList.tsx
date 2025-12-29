import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

export type AttachmentItem = {
  id: string;
  title: ReactNode;
  actionLabel?: ReactNode;
};

type AttachmentListProps = {
  items: AttachmentItem[];
  title?: ReactNode;
  className?: string;
};

export function AttachmentList({
  items,
  title = "Attachments",
  className,
}: AttachmentListProps) {
  return (
    <Surface
      variant="panelAlt"
      className={cn("space-y-2 px-4 py-3", className)}
    >
      <p className="text-sm font-semibold">{title}</p>
      <ul className="space-y-2 text-sm text-muted">
        {items.map((file) => (
          <Surface
            key={file.id}
            as="li"
            variant="panel"
            radius="xl"
            shadow="control"
            className="flex items-center justify-between px-3 py-2"
          >
            <span>{file.title}</span>
            <button
              type="button"
              className="text-sm font-semibold text-primary"
            >
              {file.actionLabel ?? "View"}
            </button>
          </Surface>
        ))}
      </ul>
    </Surface>
  );
}
