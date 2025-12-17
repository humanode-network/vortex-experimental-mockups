import { Link } from "react-router";

import { Button } from "@/components/primitives/button";

const Paper: React.FC = () => {
  return (
    <div className="relative min-h-[100svh] overflow-hidden px-6 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_10%,rgba(255,255,255,0.10),transparent_60%),linear-gradient(to_bottom,rgba(2,6,23,0.55),rgba(2,6,23,0.88))]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-xl flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Paper
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          The Vortex 1.0 paper lives on GitBook.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="primary" className="min-w-[200px]">
            <a
              href="https://gitbook.humanode.io/vortex-1.0"
              target="_blank"
              rel="noreferrer"
            >
              Open paper
            </a>
          </Button>
          <Button asChild variant="ghost" className="min-w-[160px]">
            <Link to="/">Back</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Paper;
