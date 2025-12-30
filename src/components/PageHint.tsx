import { useState } from "react";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { pageHints } from "@/data/pageHints";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kicker } from "@/components/Kicker";
import { Modal } from "@/components/Modal";

type PageHintProps = {
  pageId: string;
  className?: string;
};

export const PageHint: React.FC<PageHintProps> = ({ pageId, className }) => {
  const hint = pageHints[pageId];
  const [open, setOpen] = useState(false);

  if (!hint) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-1 z-40 sm:top-6 sm:right-2 md:right-3",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 rounded-full border border-(--pagehint) bg-(--pagehint) text-(--pagehint-foreground) shadow-(--shadow-pagehint) hover:bg-(--pagehint-hover) hover:text-(--pagehint-foreground) focus-visible:ring-(--pagehint-dim)"
        onClick={() => setOpen(true)}
        aria-label="Open page hint"
      >
        <span className="text-3xl leading-none font-bold" aria-hidden="true">
          ?
        </span>
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        ariaLabel="Page hint"
        align="top"
        contentClassName="max-w-2xl"
      >
        <Card className="shadow-(--shadow-popover)">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-semibold text-text">
                  {hint.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Close page hint"
                onClick={() => setOpen(false)}
                className="text-text"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text">
            <p className="text-muted">{hint.intro}</p>
            {hint.sections?.map((section) => (
              <div key={section.heading} className="space-y-1">
                <Kicker className="text-[0.7rem]">{section.heading}</Kicker>
                <ul className="list-disc space-y-1 pl-5">
                  {section.items.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {hint.actions && hint.actions.length > 0 && (
              <div className="space-y-1">
                <Kicker className="text-[0.7rem]">Actions</Kicker>
                <ul className="list-disc space-y-1 pl-5">
                  {hint.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </Modal>
    </div>
  );
};
