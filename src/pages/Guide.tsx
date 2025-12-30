import { Link } from "react-router";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/components/primitives/button";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingPage } from "@/components/marketing/MarketingPage";

const PARTICLES: Array<{
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}> = [
  {
    top: "86%",
    left: "8%",
    size: 3,
    delay: "0s",
    duration: "12s",
    opacity: 0.7,
  },
  {
    top: "82%",
    left: "18%",
    size: 2,
    delay: "-3s",
    duration: "14s",
    opacity: 0.55,
  },
  {
    top: "90%",
    left: "28%",
    size: 4,
    delay: "-6s",
    duration: "16s",
    opacity: 0.65,
  },
  {
    top: "78%",
    left: "36%",
    size: 2,
    delay: "-1s",
    duration: "13s",
    opacity: 0.5,
  },
  {
    top: "88%",
    left: "44%",
    size: 3,
    delay: "-8s",
    duration: "17s",
    opacity: 0.7,
  },
  {
    top: "84%",
    left: "52%",
    size: 2,
    delay: "-4s",
    duration: "15s",
    opacity: 0.55,
  },
  {
    top: "92%",
    left: "60%",
    size: 4,
    delay: "-10s",
    duration: "18s",
    opacity: 0.65,
  },
  {
    top: "80%",
    left: "68%",
    size: 2,
    delay: "-2s",
    duration: "12.5s",
    opacity: 0.5,
  },
  {
    top: "88%",
    left: "76%",
    size: 3,
    delay: "-7s",
    duration: "16.5s",
    opacity: 0.7,
  },
  {
    top: "84%",
    left: "84%",
    size: 2,
    delay: "-5s",
    duration: "14.5s",
    opacity: 0.55,
  },
  {
    top: "91%",
    left: "92%",
    size: 4,
    delay: "-9s",
    duration: "18.5s",
    opacity: 0.65,
  },
  {
    top: "74%",
    left: "12%",
    size: 2,
    delay: "-11s",
    duration: "17.5s",
    opacity: 0.45,
  },
  {
    top: "70%",
    left: "24%",
    size: 3,
    delay: "-13s",
    duration: "19s",
    opacity: 0.6,
  },
  {
    top: "72%",
    left: "40%",
    size: 2,
    delay: "-12s",
    duration: "16s",
    opacity: 0.45,
  },
  {
    top: "68%",
    left: "56%",
    size: 3,
    delay: "-15s",
    duration: "20s",
    opacity: 0.6,
  },
  {
    top: "71%",
    left: "70%",
    size: 2,
    delay: "-14s",
    duration: "18s",
    opacity: 0.45,
  },
  {
    top: "66%",
    left: "84%",
    size: 3,
    delay: "-16s",
    duration: "21s",
    opacity: 0.6,
  },
  {
    top: "62%",
    left: "18%",
    size: 2,
    delay: "-17s",
    duration: "20.5s",
    opacity: 0.4,
  },
  {
    top: "60%",
    left: "34%",
    size: 3,
    delay: "-19s",
    duration: "22s",
    opacity: 0.55,
  },
  {
    top: "58%",
    left: "50%",
    size: 2,
    delay: "-18s",
    duration: "19.5s",
    opacity: 0.4,
  },
  {
    top: "56%",
    left: "66%",
    size: 3,
    delay: "-21s",
    duration: "23s",
    opacity: 0.55,
  },
  {
    top: "54%",
    left: "82%",
    size: 2,
    delay: "-20s",
    duration: "21.5s",
    opacity: 0.4,
  },
];

const GuideSection: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}> = ({ id, title, subtitle, children }) => {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 shadow-(--shadow-card) backdrop-blur-md sm:px-7"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-white! [text-shadow:0_0_22px_rgba(244,179,127,0.22),0_0_2px_rgba(255,255,255,0.35)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm leading-relaxed text-white! [text-shadow:0_0_16px_rgba(244,179,127,0.16)]">
            {subtitle}
          </p>
        )}
      </header>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-white">
        {children}
      </div>
    </section>
  );
};

const Guide: React.FC = () => {
  return (
    <MarketingPage
      className="text-white"
      background={
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(950px_circle_at_50%_0%,rgba(255,255,255,0.06),transparent_62%),linear-gradient(to_bottom,rgba(2,6,23,0.78),rgba(0,0,0,0.985))]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -inset-40 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(244,179,127,0.28),rgba(244,179,127,0.18),rgba(111,168,255,0.14),rgba(244,179,127,0.28))] opacity-30 blur-xl motion-safe:animate-[spin_160s_linear_infinite]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
            aria-hidden="true"
          >
            <div className="absolute inset-0 opacity-85 mix-blend-screen">
              {PARTICLES.map((particle, index) => {
                const style: CSSProperties = {
                  top: particle.top,
                  left: particle.left,
                  width: particle.size,
                  height: particle.size,
                  opacity: particle.opacity,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                };

                return (
                  <span
                    key={index}
                    className="absolute rounded-full bg-(--pagehint) shadow-[0_0_24px_rgba(244,179,127,0.55)] blur-[0.25px] repeat-[infinite] [animation-name:guide-particle-float] [animation-timing-function:ease-in-out]"
                    style={style}
                  />
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-[radial-gradient(600px_circle_at_50%_100%,rgba(244,179,127,0.20),transparent_70%)] blur-xl" />
          </div>
        </>
      }
    >
      <div className="relative mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white! [text-shadow:0_0_28px_rgba(244,179,127,0.22),0_0_3px_rgba(255,255,255,0.35)] sm:text-4xl">
            Vortex Guide
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white! [text-shadow:0_0_18px_rgba(244,179,127,0.14)] sm:text-base">
            A short, human-readable map of what you’re seeing in this demo, why
            Vortex exists, and how each page works.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" className="min-w-[200px]">
              <Link to="/app/feed">Enter the app</Link>
            </Button>
            <Button asChild variant="ghost" className="min-w-[200px]">
              <Link to="/app/vortexopedia">Open Vortexopedia</Link>
            </Button>
            <Button asChild variant="ghost" className="min-w-40">
              <a
                href="https://gitbook.humanode.io/vortex-1.0"
                target="_blank"
                rel="noreferrer"
              >
                Read the Paper
              </a>
            </Button>
            <Button asChild variant="ghost" className="min-w-[140px]">
              <Link to="/">Back</Link>
            </Button>
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <main className="space-y-6">
            <GuideSection
              id="general"
              title="General: Humanode, PoBU, and why Vortex exists"
              subtitle="The mental model for the entire app."
            >
              <p>
                <strong>Humanode</strong> is a network where identity is tied to
                a verified human. The core promise is simple:{" "}
                <em>one human = one node</em>.
              </p>
              <p>
                <strong>PoBU</strong> (Proof of Biometric Uniqueness) is the
                mechanism that makes that promise meaningful: it aims to ensure
                that one human cannot spawn many “governance identities” the way
                wallets can.
              </p>
              <p>
                <strong>Vortex</strong> is a governance system built on top of
                that uniqueness. When the base unit is a human (not a wallet),
                governance can be designed around participation, competence, and
                accountability rather than wealth-weighted voting. In that sense
                Vortex is an evolution of governance: it tries to behave more
                like a <em>planetary system</em> with multiple balancing forces
                (legislative chambers, execution through Formation, courts for
                disputes, and feedback via Invision) instead of a single
                simplistic voting surface.
              </p>
              <p className="text-white">
                This repo is a <strong>demo mockup</strong> of that experience.
                Numbers, identities, and statuses are illustrative.
              </p>
            </GuideSection>

            <GuideSection
              id="how-to-read"
              title="How to read the UI"
              subtitle="The two UX primitives: hints and stages."
            >
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Hints</strong>: Hover underlined terms to open
                  Vortexopedia tooltips. Most pages assume you’ll learn terms
                  contextually.
                </li>
                <li>
                  <strong>Stages</strong>: Most work moves through a pipeline
                  (Draft → Proposal pool → Chamber vote → Formation). Different
                  pages emphasize different signals depending on stage.
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="feed"
              title="Feed"
              subtitle="A single stream of what’s happening across governance."
            >
              <p>
                The Feed is the fastest way to understand the current “shape” of
                governance: active proposals, court cases, and threads.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Open an item to see the important stats for its type (pool /
                  vote / formation / court / thread).
                </li>
                <li>
                  Use it as your “home radar”: what needs attention, what’s
                  live, what’s ending soon.
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="proposals"
              title="Proposals"
              subtitle="Browse, inspect, and track proposals across all stages."
            >
              <p>
                The Proposals page is a searchable index. Cards change their
                expanded view depending on stage:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Proposal pool</strong>: attention quorum + upvote
                  floor signals and what it needs to advance.
                </li>
                <li>
                  <strong>Chamber vote</strong>: quorum + vote split + passing
                  rule at a glance.
                </li>
                <li>
                  <strong>Formation</strong>: execution metrics (milestones,
                  budget unlocks, team slots, time left).
                </li>
              </ul>
              <p>
                Create flow:{" "}
                <Link
                  className="underline underline-offset-4"
                  to="/app/proposals/new"
                >
                  Proposal Creation
                </Link>{" "}
                is a multi-step wizard in this demo. Steps are navigable so you
                can explore the structure even if you don’t fill everything in.
              </p>
              <p>
                Drafts:{" "}
                <Link
                  className="underline underline-offset-4"
                  to="/app/proposals/drafts"
                >
                  Proposal Drafts
                </Link>{" "}
                shows saved work-in-progress items.
              </p>
            </GuideSection>

            <GuideSection
              id="proposal-stages"
              title="Proposal pages (stage views)"
              subtitle="The same proposal, presented differently depending on stage."
            >
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Pool</strong>: focuses on attention and momentum. In a
                  real Vortex, this stage prevents proposal flooding by forcing
                  early signal.
                </li>
                <li>
                  <strong>Chamber vote</strong>: focuses on decision mechanics
                  (quorum, passing rule, vote split).
                </li>
                <li>
                  <strong>Formation</strong>: focuses on execution (team,
                  milestones, budget, delivery).
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="chambers"
              title="Chambers"
              subtitle="The legislative map: specialization-based decision-making."
            >
              <p>
                Chambers represent specialization areas (design, engineering,
                economics, marketing, general, product). The chamber list shows
                a compact “health snapshot” and lets you jump into a chamber to
                see what’s active.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Use chambers to understand <em>where</em> proposals live and
                  who is expected to review them.
                </li>
                <li>
                  Chamber detail pages act like a “workspace”: active proposals,
                  pipeline tabs, and discussion.
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="my-governance"
              title="My Governance"
              subtitle="Your tier, eligibility, and what you need to do next."
            >
              <p>
                This page is your personal governance dashboard: your current
                status, progress, and what actions unlock proposition rights.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  The status label is explained via hints so you understand what
                  “At risk” means and how to move to “Stable” or “Ahead”.
                </li>
                <li>
                  “My chambers” shows the chambers you belong to (mirrors the
                  chamber cards style).
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="human-nodes"
              title="Human Nodes"
              subtitle="Directory and profiles of verified humans (governors and beyond)."
            >
              <p>
                Human Nodes is the “people layer”: search and inspect profiles,
                activity, proof focus, and history.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Directory view: discover governors, filter, and compare.
                </li>
                <li>
                  Profile view: see proofs and participation signals (a real
                  system would link to on-chain data and attestations).
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="factions"
              title="Factions"
              subtitle="Affinity groups that coordinate priorities and effort."
            >
              <p>
                Factions are groups with goals, initiatives, and membership.
                They’re a coordination layer: not a chamber, not execution, but
                a place where aligned humans organize.
              </p>
            </GuideSection>

            <GuideSection
              id="invision"
              title="Invision"
              subtitle="Signals, risks, and a ‘lens’ on governance performance."
            >
              <p>
                Invision is where governance becomes measurable: it summarizes
                behavior and delivery patterns into scannable insights (still a
                mock in this repo).
              </p>
              <p>
                In the app you’ll see “Invision insight” snippets attached to
                proposals. Conceptually, this is where a voter sees “track
                record” at a glance.
              </p>
            </GuideSection>

            <GuideSection
              id="courts"
              title="Courts"
              subtitle="Disputes, evidence, and verdicts (mock UI)."
            >
              <p>
                Courts is the judicial layer. Cases are structured around a
                claim, evidence, and planned actions. The courtroom page is
                designed for reading, not scrolling through noise.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Statuses (jury / live / ended) reflect the state of the case.
                </li>
                <li>
                  Verdict buttons are present as a UI mock to show how an action
                  might look.
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              id="cm-panel"
              title="CM Panel"
              subtitle="A control surface for chamber multipliers (mock UI)."
            >
              <p>
                The CM Panel is a specialized admin-style surface. In a real
                system it would be gated by rights and on-chain rules.
              </p>
            </GuideSection>

            <GuideSection
              id="profile-settings"
              title="Profile & Settings"
              subtitle="Personal details and global preferences (demo)."
            >
              <p>
                Profile is your personal view. Settings is where future
                preferences (themes, accessibility, integrations) would live.
              </p>
            </GuideSection>

            <GuideSection
              id="vortexopedia"
              title="Vortexopedia"
              subtitle="The dictionary that powers hints across the app."
            >
              <p>
                Vortexopedia is the glossary. Terms used across the UI should be
                discoverable without leaving the page via hover hints, and
                explorable in full here.
              </p>
              <p>
                If something reads like “governance jargon”, it’s likely defined
                here.
              </p>
            </GuideSection>
          </main>

          <aside className="sticky top-6 hidden space-y-4 lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-(--shadow-card) backdrop-blur-sm">
              <p className="text-sm font-semibold text-white! [text-shadow:0_0_18px_rgba(244,179,127,0.16)]">
                On this page
              </p>
              <nav className="mt-3 space-y-2 text-sm text-white">
                {[
                  ["General", "general"],
                  ["How to read the UI", "how-to-read"],
                  ["Feed", "feed"],
                  ["Proposals", "proposals"],
                  ["Proposal pages", "proposal-stages"],
                  ["Chambers", "chambers"],
                  ["My Governance", "my-governance"],
                  ["Human Nodes", "human-nodes"],
                  ["Factions", "factions"],
                  ["Invision", "invision"],
                  ["Courts", "courts"],
                  ["CM Panel", "cm-panel"],
                  ["Profile & Settings", "profile-settings"],
                  ["Vortexopedia", "vortexopedia"],
                ].map(([label, id]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-2 py-1 hover:bg-white/10"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>

        <MarketingFooter className="mt-12 text-white">
          This guide describes the demo mockups shipped in this repo and will
          evolve as the community tests and gives feedback.
        </MarketingFooter>
      </div>
    </MarketingPage>
  );
};

export default Guide;
