import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVortexopediaTerm } from "@/data/vortexopediaLookup";
import "./Hint.css";

type HintProps = {
  termId: string;
  children: React.ReactNode;
  dwellMs?: number;
  noUnderline?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
};

/**
 * Hint wraps inline text with an underlined hover-triggered tooltip that pulls
 * definitions from the Vortexopedia data set. After a dwell period the tooltip
 * becomes “stable” so users can hover onto it without it disappearing.
 */
export const Hint: React.FC<HintProps> = ({
  termId,
  dwellMs = 2200,
  children,
  noUnderline,
  placement = "bottom",
}) => {
  const term = useMemo(() => getVortexopediaTerm(termId), [termId]);
  const [visible, setVisible] = useState(false);
  const [stable, setStable] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const dwellStartRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const hoveringPopupRef = useRef(false);
  const navigate = useNavigate();

  const clearTimers = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const startHover = (clientX: number, clientY: number) => {
    if (!term) return;
    setMousePos({ x: clientX + 12, y: clientY + 12 });
    setVisible(true);
    setStable(false);
    dwellStartRef.current = performance.now();
    timerRef.current = window.setTimeout(() => {
      setStable(true);
    }, dwellMs);
  };

  const hide = () => {
    setVisible(false);
    setStable(false);
    clearTimers();
  };

  const scheduleHideIfNeeded = () => {
    if (!stable) {
      hide();
      return;
    }
    hideTimerRef.current = window.setTimeout(() => {
      if (!hoveringPopupRef.current) {
        hide();
      }
    }, 200);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  if (!term) {
    return <span>{children}</span>;
  }

  return (
    <span className="relative inline-flex items-center align-baseline">
      <span
        className={cn("hint-trigger", noUnderline && "no-underline")}
        onMouseEnter={(e) => {
          startHover(e.clientX, e.clientY);
        }}
        onMouseLeave={scheduleHideIfNeeded}
      >
        {children}
      </span>
      {visible && (
        <div
          className={cn(
            "fixed z-50 max-w-[360px] min-w-[260px]",
            "animate-in zoom-in-95 fade-in",
          )}
          style={{
            top: Math.min(mousePos.y + 12, window.innerHeight - 220),
            left: Math.min(mousePos.x + 12, window.innerWidth - 340),
          }}
          onMouseEnter={() => {
            hoveringPopupRef.current = true;
            setVisible(true);
          }}
          onMouseLeave={() => {
            hoveringPopupRef.current = false;
            hide();
          }}
        >
          <Card className={cn("hint-card", stable && "stable")}>
            <CardHeader className="px-4 pt-3 pb-2">
              <CardTitle className="text-sm font-semibold text-(--text)">
                {term.name}
              </CardTitle>
              <p className="hint-desc text-sm leading-relaxed text-muted">
                {term.short}
              </p>
            </CardHeader>
            <CardContent className="hint-actions flex justify-center px-4 pt-1 pb-3">
              <Button
                size="sm"
                variant="default"
                className="bg-primary text-xs text-white hover:bg-primary/90"
                onClick={() => navigate(`/vortexopedia?term=${term.id}`)}
              >
                Vortexopedia
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </span>
  );
};

type HintLabelProps = {
  termId: string;
  prefix?: string;
  termText?: string;
  children?: React.ReactNode;
  suffix?: string;
  underline?: boolean;
  className?: string;
};

/**
 * HintLabel helps when only a portion of a label should be underlined/linked to a hint.
 */
export const HintLabel: React.FC<HintLabelProps> = ({
  termId,
  prefix,
  termText,
  children,
  suffix,
  underline = true,
  className,
}) => {
  const content = children ?? termText ?? "";
  return (
    <Hint termId={termId} noUnderline>
      <span
        className={cn(
          "inline-flex items-center space-x-1 align-baseline text-inherit",
          className,
        )}
      >
        {prefix && <span className="font-normal">{prefix}</span>}
        <span
          className={cn(
            "font-semibold text-inherit",
            underline && "hint-underline",
          )}
        >
          {content}
        </span>
        {suffix && <span className="font-normal">{suffix}</span>}
      </span>
    </Hint>
  );
};
