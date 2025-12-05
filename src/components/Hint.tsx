import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { vortexopediaTerms } from "@/data/vortexopedia";

type HintProps = {
  termId: string;
  children: React.ReactNode;
  dwellMs?: number;
  noUnderline?: boolean;
};

const termLookup = new Map(vortexopediaTerms.map((t) => [t.id, t]));

/**
 * Hint wraps inline text with an underlined hover-triggered tooltip that pulls
 * definitions from the Vortexopedia data set. After a dwell period the tooltip
 * becomes “stable” so users can hover onto it without it disappearing.
 */
export const Hint: React.FC<HintProps> = ({ termId, dwellMs = 2200, children, noUnderline }) => {
  const term = useMemo(() => termLookup.get(termId), [termId]);
  const [visible, setVisible] = useState(false);
  const [stable, setStable] = useState(false);
  const [progress, setProgress] = useState(0);
  const dwellStartRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const clearTimers = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      window.cancelAnimationFrame(progressRef.current);
      progressRef.current = null;
    }
  };

  const startHover = () => {
    if (!term) return;
    setVisible(true);
    setStable(false);
    setProgress(0);
    dwellStartRef.current = performance.now();
    timerRef.current = window.setTimeout(() => {
      setStable(true);
      setProgress(100);
    }, dwellMs);
    const step = () => {
      const elapsed = performance.now() - dwellStartRef.current;
      const pct = Math.min(100, (elapsed / dwellMs) * 100);
      setProgress(pct);
      if (pct < 100) {
        progressRef.current = window.requestAnimationFrame(step);
      }
    };
    progressRef.current = window.requestAnimationFrame(step);
  };

  const hide = () => {
    setVisible(false);
    setStable(false);
    clearTimers();
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  if (!term) {
    return <span>{children}</span>;
  }

  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          "cursor-help text-(--text) hover:text-primary",
          !noUnderline && "border-b border-dashed border-primary/60"
        )}
        onMouseEnter={startHover}
        onMouseLeave={() => {
          if (!stable) hide();
        }}
      >
        {children}
      </span>
      {visible && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[260px] max-w-[360px]",
            "animate-in fade-in zoom-in-95"
          )}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => hide()}
        >
          <Card className="border border-border bg-white shadow-lg rounded-xl w-[320px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span>{term.name}</span>
              </CardTitle>
              <p className="text-xs text-muted">{term.short}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted">
              {term.examples?.[0] && <p className="text-(--text)">{term.examples[0]}</p>}
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/30">
                  <div
                    className={cn("h-full rounded-full transition-[width]", stable ? "bg-ok" : "bg-primary")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[0.65rem] text-muted">{stable ? "Stable" : "Holding…"}</span>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/vortexopedia?term=${term.id}`)}
                >
                  Open in Vortexopedia
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </span>
  );
};
