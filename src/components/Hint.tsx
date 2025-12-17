import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import { getVortexopediaTerm } from "@/data/vortexopediaLookup";
import "./Hint.css";

type OverlayPosition = { x: number; y: number };

// Headless hover logic: track position, visibility, and “stable” state after dwell.
const useHoverOverlay = (dwellMs: number) => {
  const [visible, setVisible] = useState(false);
  const [stable, setStable] = useState(false);
  const [position, setPosition] = useState<OverlayPosition>({ x: 0, y: 0 });
  const hoverTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const hoveringRef = useRef(false);

  const clearTimers = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const showAt = (pos: OverlayPosition) => {
    setPosition(pos);
    setVisible(true);
    setStable(false);
    clearTimers();
    hoverTimer.current = window.setTimeout(() => setStable(true), dwellMs);
  };

  const hide = (force = false) => {
    if (!stable || force) {
      clearTimers();
      setVisible(false);
      setStable(false);
      return;
    }
    hideTimer.current = window.setTimeout(() => {
      if (!hoveringRef.current) {
        setVisible(false);
        setStable(false);
      }
    }, 180);
  };

  useEffect(() => () => clearTimers(), []);

  return {
    visible,
    stable,
    position,
    setHovering: (on: boolean) => {
      hoveringRef.current = on;
      if (!on && stable) {
        hide();
      }
    },
    showAt,
    hide,
  };
};

type OverlayPortalProps = {
  visible: boolean;
  position: OverlayPosition;
  children: React.ReactNode;
};

// Thin portal that positions content near the cursor.
const OverlayPortal: React.FC<OverlayPortalProps> = ({
  visible,
  position,
  children,
}) => {
  if (!visible) return null;
  return (
    <div
      className="fixed z-50 max-w-[360px] min-w-[260px] animate-in zoom-in-95 fade-in"
      style={{
        top: Math.min(position.y + 12, window.innerHeight - 240),
        left: Math.min(position.x + 12, window.innerWidth - 360),
      }}
    >
      {children}
    </div>
  );
};

type HintSurfaceProps = {
  title: string;
  description: string;
  stable: boolean;
  onNavigate?: () => void;
};

// UI surface: renders the styled card for any hint content.
const HintSurface: React.FC<HintSurfaceProps> = ({
  title,
  description,
  stable,
  onNavigate,
}) => {
  return (
    <Card className={cn("hint-card", stable && "stable")}>
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-sm font-semibold text-text">
          {title}
        </CardTitle>
        <p className="hint-desc text-sm leading-relaxed text-muted">
          {description}
        </p>
      </CardHeader>
      <CardContent className="hint-actions flex justify-center px-4 pt-1 pb-3">
        <Button
          size="sm"
          variant="primary"
          className="text-xs"
          onClick={onNavigate}
        >
          Vortexopedia
        </Button>
      </CardContent>
    </Card>
  );
};

type HintProps = {
  termId: string;
  children: React.ReactNode;
  dwellMs?: number;
  noUnderline?: boolean;
};

/**
 * Hint wraps inline text with an underlined hover-triggered tooltip that pulls
 * definitions from the Vortexopedia data set. It uses a headless hover hook,
 * a styled surface, and a data-binding layer for clarity.
 */
export const Hint: React.FC<HintProps> = ({
  termId,
  dwellMs = 2200,
  children,
  noUnderline,
}) => {
  const term = useMemo(() => getVortexopediaTerm(termId), [termId]);
  const navigate = useNavigate();
  const overlay = useHoverOverlay(dwellMs);

  if (!term) {
    return <span>{children}</span>;
  }

  return (
    <span className="relative inline-flex items-center align-baseline">
      <span
        className={cn(
          "hint-trigger tracking-normal whitespace-pre-wrap normal-case",
          noUnderline && "no-underline",
        )}
        onMouseEnter={(e) =>
          overlay.showAt({ x: e.clientX ?? 0, y: e.clientY ?? 0 })
        }
        onMouseLeave={() => {
          overlay.setHovering(false);
          overlay.hide();
        }}
      >
        {children}
      </span>
      <OverlayPortal visible={overlay.visible} position={overlay.position}>
        <div
          onMouseEnter={() => overlay.setHovering(true)}
          onMouseLeave={() => {
            overlay.setHovering(false);
            overlay.hide();
          }}
        >
          <HintSurface
            title={term.name}
            description={term.short}
            stable={overlay.stable}
            onNavigate={() => navigate(`/app/vortexopedia?term=${term.id}`)}
          />
        </div>
      </OverlayPortal>
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
