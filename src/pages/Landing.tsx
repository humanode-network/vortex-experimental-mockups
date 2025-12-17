import { Link } from "react-router";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Pill } from "@/components/Pill";

const Landing: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100vh-2rem)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col items-center gap-4 text-center">
          <Pill tone="muted" size="sm" className="px-3 py-1">
            Vortex · Humanode governance
          </Pill>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-text sm:text-5xl">
            A governance interface for a network of verified humans.
          </h1>
          <p className="max-w-2xl text-base text-pretty text-muted sm:text-lg">
            Explore proposals, chambers, human nodes, and the Vortexopedia —
            built to feel fast, consistent, and calm.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="min-w-[220px]">
              <Link to="/app/feed">
                Enter Vortex{" "}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-[220px]"
            >
              <Link to="/app/vortexopedia">Browse Vortexopedia</Link>
            </Button>
          </div>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Card className="bg-panel-alt">
            <CardHeader className="pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-panel">
                <Users className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-center">Human-first</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted">
              Built around human nodes and governor participation, with hints
              that explain every term in context.
            </CardContent>
          </Card>

          <Card className="bg-panel-alt">
            <CardHeader className="pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-panel">
                <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-center">Polished UI</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted">
              Token-driven design, glass controls, and consistent components —
              so the interface stays cohesive as it grows.
            </CardContent>
          </Card>

          <Card className="bg-panel-alt">
            <CardHeader className="pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-panel">
                <ShieldCheck
                  className="h-6 w-6 text-primary"
                  aria-hidden="true"
                />
              </div>
              <CardTitle className="text-center">Sustainable</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted">
              The app lives under <code className="text-text">/app</code>,
              keeping the landing page flexible for onboarding, marketing, and
              future auth.
            </CardContent>
          </Card>
        </section>

        <footer className="mt-10 text-center text-xs text-muted">
          <span className="font-semibold text-text">Tip:</span> Use Settings →
          Theme inside the app to switch Sky / Light / Night.
        </footer>
      </div>
    </div>
  );
};

export default Landing;
