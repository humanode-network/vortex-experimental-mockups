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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative mt-8 w-full max-w-2xl">
            <Card className="rounded-2xl border border-white/10 bg-slate-900 text-white shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide text-slate-300 uppercase">
                      Page hint
                    </p>
                    <CardTitle className="text-xl font-semibold text-white">
                      {hint.title}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close page hint"
                    onClick={() => setOpen(false)}
                    className="text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white">
                <p className="text-slate-200">{hint.intro}</p>
                {hint.sections?.map((section) => (
                  <div key={section.heading} className="space-y-1">
                    <p className="text-[0.7rem] tracking-wide text-slate-300 uppercase">
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
                    <p className="text-[0.7rem] tracking-wide text-slate-300 uppercase">
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
