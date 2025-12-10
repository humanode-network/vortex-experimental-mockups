import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageHints } from "@/data/pageHints";
import { X, HelpCircle } from "lucide-react";

type PageHintProps = {
  pageId: string;
  className?: string;
};

export const PageHint: React.FC<PageHintProps> = ({ pageId, className }) => {
  const hint = pageHints[pageId];
  const [open, setOpen] = useState(false);

  if (!hint) return null;

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border text-(--text)"
        onClick={() => setOpen(true)}
        aria-label="Open page hint"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
          <div className="relative mt-8 w-full max-w-2xl">
            <Card className="bg-panel rounded-2xl border border-border shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide text-muted uppercase">
                      Page hint
                    </p>
                    <CardTitle className="text-xl font-semibold text-(--text)">
                      {hint.title}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close page hint"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-(--text)">
                <p className="text-muted">{hint.intro}</p>
                {hint.sections?.map((section) => (
                  <div key={section.heading} className="space-y-1">
                    <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                      {section.heading}
                    </p>
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
                    <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                      Actions
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      {hint.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
