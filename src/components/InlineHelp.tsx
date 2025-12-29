import { cn } from "@/lib/utils";
import { getInlineHelp } from "@/data/inlineHelp";

export type InlineHelpProps = {
  pageId?: string;
  sectionId?: string;
  text?: string;
  className?: string;
};

export const InlineHelp: React.FC<InlineHelpProps> = ({
  pageId,
  sectionId,
  text,
  className,
}) => {
  const resolvedText =
    text ??
    (pageId && sectionId ? getInlineHelp(pageId, sectionId) : undefined);

  if (!resolvedText) return null;

  return (
    <p className={cn("text-sm leading-snug text-muted", className)}>
      {resolvedText}
    </p>
  );
};
