export type CourtCase = {
  id: string;
  title: string;
  subject: string;
  triggeredBy: string;
  status: "jury" | "live" | "ended";
  reports: number;
  juryIds: string[];
  opened: string; // dd/mm/yyyy
  parties: { role: string; humanId: string; note?: string }[];
  proceedings: {
    claim: string;
    evidence: string[];
    nextSteps: string[];
  };
};

const DEFAULT_JURY_IDS = [
  "dato",
  "victor",
  "temo",
  "dima",
  "tony",
  "sesh",
  "petr",
  "shannon",
  "shahmeer",
  "fiona",
  "silis",
  "ekko",
];

export const courtCases: CourtCase[] = [
  {
    id: "delegation-reroute-keeper-nyx",
    title: "Delegation dispute",
    subject: "Delegation dispute: unexpected reroute away from Dato",
    triggeredBy: "14 reports · Delegation shift",
    status: "live",
    reports: 14,
    juryIds: DEFAULT_JURY_IDS,
    opened: "12/12/2025",
    parties: [
      { role: "Previous delegatee", humanId: "dato" },
      { role: "Recipient delegatee", humanId: "shahmeer" },
      {
        role: "Requester",
        humanId: "fiona",
        note: "Filed on behalf of affected delegators",
      },
    ],
    proceedings: {
      claim:
        "Multiple governors report that their delegations were switched from delegatee Dato to delegatee Shahmeer without their clear consent. The requester asks the court to (1) determine whether the shift was authorized, (2) require a public explanation from the involved parties, and (3) recommend remediation steps (re-delegation guidance, UI fixes, or sanctions if abuse is proven).",
      evidence: [
        "On-chain delegation events: epochs 318–320 showing repeated changes to the same delegatee in a short time window",
        "Signed statements from 6 delegators claiming they did not intentionally reassign delegation",
        "Screenshot exports from the delegation UI showing an ambiguous confirmation step (no explicit “You are delegating to X” final screen)",
        "Device/IP session logs (where available) showing multiple delegation actions executed within minutes",
        "Comparison table: “expected delegatee per user statement” vs “actual delegatee after shift”",
      ],
      nextSteps: [
        "Collect jury statements (24h window) focusing on consent clarity, UI ambiguity, and plausibility of mistaken delegation",
        "Request response statements from the recipient delegatee and previous delegatee",
        "Ask Vortex engineering for a technical note: whether delegation can be triggered by any mechanism other than the delegator’s signed action",
        "Determine likely cause category: user error / confusing UX, compromised wallet/session, coordinated manipulation campaign, or false reporting",
        "Publish a short ruling with recommended actions (UI patch proposal, warnings, or sanctions if applicable)",
      ],
    },
  },
  {
    id: "delegation-farming-forum-whale",
    title: "Delegation dispute",
    subject: "Delegation dispute: alleged “delegation farming” by Fares",
    triggeredBy: "9 reports · Delegation shift",
    status: "jury",
    reports: 9,
    juryIds: [
      "dato",
      "victor",
      "temo",
      "dima",
      "tony",
      "sesh",
      "petr",
      "shannon",
      "shahmeer",
      "fiona",
      "andrei",
      "fares",
    ],
    opened: "12/12/2025",
    parties: [
      { role: "Accused delegatee", humanId: "fares" },
      {
        role: "Requester",
        humanId: "petr",
        note: "Filed after delegator reports",
      },
    ],
    proceedings: {
      claim:
        "Multiple governors allege that Fares obtained delegations through misleading communication: promising “vote your way” representation, then voting contrary to delegators’ stated intent. The requester asks the court to determine whether this constitutes delegation abuse / misrepresentation and to recommend remedies (public disclosure requirements, formal warning, or temporary delegation visibility restrictions).",
      evidence: [
        "Delegation events: epochs 321–324 showing a rapid increase in delegations following a public thread",
        "Screenshots of DMs and forum posts where the delegatee allegedly stated they would “mirror delegators’ votes”",
        "Voting record comparison: proposals where delegators expected “mirror votes” vs the delegatee’s actual votes",
        "Statements from 5 delegators requesting reversal and claiming “I would not have delegated under full information”",
        "Timeline: communication posts → delegation inflow → voting divergence",
      ],
      nextSteps: [
        "Collect jury statements (48h) on whether “vote mirroring” claims are enforceable or merely political speech",
        "Request a response statement from the delegatee (promises made, how voting decisions were determined, whether terms were documented)",
        "Ask Vortex engineering if the UI should support optional delegation terms metadata (“advisory”, “mirror”, “topic-based”)",
        "Determine remedy category: no fault, warning for misleading representation, or sanction for systematic misrepresentation (if proven)",
        "Schedule deliberation and publish verdict summary in the Vortex feed",
      ],
    },
  },
  {
    id: "milestone-dispute-dev-starter-kit",
    title: "Milestone dispute",
    subject: "Milestone dispute: “Dev Starter Kit” delivered but not usable",
    triggeredBy: "11 reports · Milestone completion contested",
    status: "live",
    reports: 11,
    juryIds: [
      "dato",
      "victor",
      "temo",
      "dima",
      "sesh",
      "petr",
      "shannon",
      "shahmeer",
      "fiona",
      "silis",
      "ekko",
      "andrei",
    ],
    opened: "12/12/2025",
    parties: [
      {
        role: "Proposer",
        humanId: "andrei",
        note: "Marked Milestone 2 as done",
      },
      {
        role: "Requester",
        humanId: "shannon",
        note: "Filed after reproducible setup failures",
      },
    ],
    proceedings: {
      claim:
        "Multiple governors contest Milestone 2 completion for the “Humanode EVM Dev Starter Kit & Testing Sandbox” proposal. The proposer marked the milestone as “done” and requested the unlock, but reporters claim the deliverable is not usable for a new developer (broken install path, missing docs, unstable sandbox RPC). The requester asks the court to determine whether the milestone meets the acceptance criteria and whether payment should be released, partially released, or withheld pending fixes.",
      evidence: [
        "Milestone definition and acceptance criteria (Milestone 2: “Sandbox Online” including faucet + one-command setup + docs page)",
        "Public repo links showing release tag vs current branch differences",
        "Issue tracker: 18 opened issues in 48 hours tagged “blocking” (install failures, RPC timeouts, faucet errors)",
        "Reproduction logs from 6 independent testers (OS, Node version, steps, error outputs)",
        "Sandbox uptime snapshots showing intermittent endpoint failures over 24h",
        "Screenshots of docs page missing key steps (faucet link, RPC URL, chain ID)",
      ],
      nextSteps: [
        "Collect jury statements (72h) focused on one question: does this meet the milestone definition as written?",
        "Request a response from the proposer (exact setup steps, known issues list, proposed fix timeline)",
        "Ask Vortex engineering or independent testers to run a standardized “new dev” checklist: clone → install → run local → deploy sample → use faucet → verify on explorer",
        "Decide remedy: release (met), conditional release (partial), or withhold until acceptance criteria are satisfied",
        "Publish a short verdict with explicit pass/fail criteria and deadlines",
      ],
    },
  },
  {
    id: "identity-integrity-multi-human",
    title: "Identity integrity dispute",
    subject:
      "Identity integrity dispute: suspected “multi-human” enrolment attempt",
    triggeredBy: "8 reports · Verification anomaly",
    status: "ended",
    reports: 8,
    juryIds: [
      "dato",
      "victor",
      "temo",
      "dima",
      "tony",
      "sesh",
      "petr",
      "shannon",
      "shahmeer",
      "fiona",
      "silis",
      "fares",
    ],
    opened: "12/12/2025",
    parties: [
      {
        role: "Requester",
        humanId: "victor",
        note: "Filed for integrity review",
      },
      {
        role: "Investigated",
        humanId: "tony",
        note: "Flagged by anomaly pattern",
      },
    ],
    proceedings: {
      claim:
        "A cluster of verification attempts appears to indicate that one operator may be trying to enroll multiple identities using coordinated tactics (similar device fingerprints, repeated timing patterns, and shared network characteristics). Reporters request a court ruling on whether this meets the threshold for a PoBU integrity violation and whether temporary restrictions should be applied while the Legal team investigates.",
      evidence: [
        "Verification metadata summary (no raw biometrics): repeated session timing patterns within short windows, high similarity of device fingerprints (model/OS/browser), repeated IP / ASN overlaps across attempts",
        "Biomapper anomaly flags showing elevated risk score for the cluster",
        "Node-side logs (validator / verification relayers) indicating repeated retries with similar parameters",
        "Statements from 3 human nodes reporting unusually high failure-retry loops tied to the same region/time window",
        "Prior incident notes (if any) describing similar patterns and how they were handled",
      ],
      nextSteps: [
        "Collect jury statements (48h) focusing on proportionality: what can be done now without exposing sensitive data?",
        "Request a technical note from Legal on whether the observed metadata is sufficient to suspect coordinated abuse and what additional non-sensitive signals can be reviewed",
        "Ask Vortex engineering to confirm existing controls: rate limits, cooldown windows, session caps, temporary blocks",
        "Determine interim remedy: no action, soft mitigation (rate limits/cooldowns), or temporary restriction pending deeper review",
        "Publish verdict summary: what was decided, why, and what follow-up investigation will occur (without leaking sensitive details)",
      ],
    },
  },
];

export default courtCases;
