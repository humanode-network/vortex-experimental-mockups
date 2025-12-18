import * as React from "react";
import { Link } from "react-router";

import { Button } from "@/components/primitives/button";

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
};

const Landing: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [videoFailed, setVideoFailed] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);
  const [posterSrc, setPosterSrc] = React.useState("/landing/poster.png");
  const [videoSrc, setVideoSrc] = React.useState("/landing/Loop.mp4");
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/landing/config.json", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<{
          posterSrc: string;
          videoSrc: string;
        }>;
        if (json.posterSrc) setPosterSrc(json.posterSrc);
        if (json.videoSrc) setVideoSrc(json.videoSrc);
      } catch {
        // Optional config; ignore failures.
      }
    };
    void loadConfig();
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion) return;
    if (videoFailed) return;
    const video = videoRef.current;
    if (!video) return;

    const attempt = async () => {
      try {
        await video.play();
        setVideoReady(true);
      } catch {
        // Autoplay might be blocked; keep the poster visible.
      }
    };

    void attempt();
  }, [prefersReducedMotion, videoFailed]);

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      {(!videoReady || prefersReducedMotion || videoFailed) && (
        <img
          className="pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-cover blur-md brightness-[0.72] saturate-125 select-none"
          src={posterSrc}
          alt=""
          aria-hidden="true"
        />
      )}

      {!prefersReducedMotion && !videoFailed && (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-cover blur-md brightness-[0.72] saturate-125 select-none"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={posterSrc}
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          ref={videoRef}
        >
          <source src={videoSrc} />
          <source src="/landing/loop.mp4" />
          <source src="/landing/Loop.mp4" />
        </video>
      )}

      <div
        className="pointer-events-none absolute -inset-40 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(111,168,255,0.35),rgba(91,194,181,0.22),rgba(244,179,127,0.18),rgba(111,168,255,0.35))] opacity-35 blur-xl motion-safe:animate-[spin_120s_linear_infinite]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_circle_at_50%_10%,rgba(255,255,255,0.16),transparent_60%),linear-gradient(to_bottom,rgba(2,6,23,0.40),rgba(2,6,23,0.78))]"
        aria-hidden="true"
      />

      <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-10">
        <div className="flex flex-col items-center gap-4">
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="relative h-[76px] w-full max-w-[420px] overflow-hidden rounded-2xl border-2 border-[color:var(--pagehint)] bg-transparent px-12 text-2xl tracking-tight text-[color:var(--pagehint)] shadow-[var(--shadow-control)] ring-1 ring-white/10 transition-[background-color,border-color,color,box-shadow,transform] duration-200 ring-inset before:pointer-events-none before:absolute before:top-[-30%] before:bottom-[-30%] before:left-0 before:w-[42%] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)] before:opacity-0 after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(80%_120%_at_50%_0%,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0)_60%)] after:opacity-0 hover:border-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:text-[var(--primary-foreground)] hover:shadow-[var(--shadow-primary)] hover:ring-white/20 hover:before:animate-[landing-shimmer_1.1s_linear_infinite] hover:before:opacity-100 active:translate-y-[0.5px] active:shadow-[var(--shadow-popover)] active:after:animate-[btn-flash_520ms_ease-out] active:after:opacity-100 motion-reduce:hover:before:animate-none motion-reduce:active:after:animate-none"
          >
            <Link to="/app/feed">Enter Vortex</Link>
          </Button>

          <div className="grid w-full max-w-[420px] grid-cols-2 gap-3">
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-14 w-full px-7 text-lg"
            >
              <a
                href="https://gitbook.humanode.io/vortex-1.0"
                target="_blank"
                rel="noreferrer"
              >
                Paper
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-14 w-full px-7 text-lg"
            >
              <Link to="/guide">Guide</Link>
            </Button>
          </div>
        </div>

        <footer className="absolute right-0 bottom-0 left-0 px-6 pt-4 pb-6 text-center text-xs text-white/70">
          2021 – 2026 Humanode.io
        </footer>
      </div>
    </div>
  );
};

export default Landing;
