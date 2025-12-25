import { proposals as proposalList } from "./proposals.ts";

export type InvisionInsight = {
  role: string;
  bullets: string[];
};

const proposalSummaryById: Record<string, string> = Object.fromEntries(
  proposalList.map((proposal) => [proposal.id, proposal.summary]),
);

const summaryFor = (id: string) => proposalSummaryById[id] ?? "";

export type PoolProposalPage = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  focus: string;
  tier: string;
  budget: string;
  cooldown: string;
  formationEligible: boolean;
  teamSlots: string;
  milestones: string;
  upvotes: number;
  downvotes: number;
  attentionQuorum: number;
  activeGovernors: number;
  upvoteFloor: number;
  rules: string[];
  attachments: { id: string; title: string }[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  invisionInsight: InvisionInsight;
};

export type ChamberProposalPage = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  budget: string;
  formationEligible: boolean;
  teamSlots: string;
  milestones: string;
  timeLeft: string;
  votes: { yes: number; no: number; abstain: number };
  attentionQuorum: number;
  passingRule: string;
  engagedGovernors: number;
  activeGovernors: number;
  attachments: { id: string; title: string }[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  invisionInsight: InvisionInsight;
};

export type FormationProposalPage = {
  title: string;
  chamber: string;
  proposer: string;
  proposerId: string;
  budget: string;
  timeLeft: string;
  teamSlots: string;
  milestones: string;
  progress: string;
  stageData: { title: string; description: string; value: string }[];
  stats: { label: string; value: string }[];
  lockedTeam: { name: string; role: string }[];
  openSlots: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  attachments: { id: string; title: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  invisionInsight: InvisionInsight;
};

const poolProposals: Record<string, PoolProposalPage> = {
  "humanode-dreamscapes-visual-lore": {
    title: "Humanode Dreamscapes: Visual Lore Series",
    proposer: "Fiona",
    proposerId: "fiona",
    chamber: "Design chamber",
    focus: "Visual lore & culture",
    tier: "Ecclesiast",
    budget: "9k HMND",
    cooldown: "Withdraw cooldown: 12h",
    formationEligible: false,
    teamSlots: "1 / 1",
    milestones: "3",
    upvotes: 18,
    downvotes: 6,
    attentionQuorum: 0.2,
    activeGovernors: 150,
    upvoteFloor: 15,
    rules: [
      "20% attention from active governors required.",
      "At least 10% upvotes to move to chamber vote.",
      "Deliverables must be high-res and usable across formats (print + social crops).",
    ],
    attachments: [
      { id: "portfolio", title: "Portfolio: https://…/void-artist" },
    ],
    teamLocked: [{ name: "Fiona", role: "Visual artist & art director" }],
    openSlotNeeds: [],
    milestonesDetail: [
      {
        title: "M1 — Concepts & Sketches",
        desc: "Concept sheet + roughs for 8–10 pieces, with short titles and one-sentence intent per artwork.",
      },
      {
        title: "M2 — First Batch of Finals",
        desc: "4–6 finished high-res artworks delivered, plus social crops and light feedback iteration.",
      },
      {
        title: "M3 — Full Set & Asset Pack",
        desc: "Complete 8–10 artwork set delivered with an asset pack and simple usage notes.",
      },
    ],
    summary: summaryFor("humanode-dreamscapes-visual-lore"),
    overview:
      "Humanode visuals are often product screenshots or generic graphics. Dreamscapes creates a coherent aesthetic world: symbolic pieces (Vortex engine room, Tier Decay, Proof of Biometric Uniqueness) usable for posters, banners, and community identity.",
    executionPlan: [
      "Week 0: brief alignment + moodboard and 3–4 style probes to lock direction.",
      "Weeks 1–2: concepts and roughs for all pieces; pick the final list and priorities.",
      "Weeks 3–4: finish 4–6 artworks; export social crops; incorporate light feedback.",
      "Week 5: finish the full set and deliver the asset pack + usage notes.",
    ],
    budgetScope:
      "Total ask: 9,000 HMND (2k concept/art direction, 6k creation, 1k exports/docs). Out of scope: motion/video, UI/UX work, and paid campaigns.",
    invisionInsight: {
      role: "Visual Artist / Culture",
      bullets: [
        "Proposals: 1 total · 1 approved (community-funded experiment)",
        "Milestones: 2 / 2 completed · on time",
        "Delegations: 0.3% active voting power from 3 Humanodes",
        "Confidence: Medium delivery risk · 4.4 / 5",
      ],
    },
  },
  "biometric-account-recovery": {
    title: "Biometric Account Recovery & Key Rotation Pallet",
    proposer: "Shahmeer",
    proposerId: "shahmeer",
    chamber: "Engineering chamber",
    focus: "Account safety & identity UX",
    tier: "Citizen",
    budget: "34k HMND",
    cooldown: "Withdraw cooldown: 12h",
    formationEligible: true,
    teamSlots: "1 / 2",
    milestones: "3",
    upvotes: 44,
    downvotes: 7,
    attentionQuorum: 0.2,
    activeGovernors: 150,
    upvoteFloor: 15,
    rules: [
      "20% attention from active governors required.",
      "At least 10% upvotes to move to chamber vote.",
      "Delegated votes are ignored in the pool.",
    ],
    attachments: [
      { id: "github", title: "GitHub: https://github.com/cto-node" },
      { id: "security-notes", title: "Security invariants (draft)" },
      { id: "audit-scope", title: "Audit scope & shortlist (draft)" },
    ],
    teamLocked: [{ name: "Shahmeer", role: "Architect & reviewer" }],
    openSlotNeeds: [
      {
        title: "Rust / Substrate engineer",
        desc: "Implement pallet + tests; integrate with identity registry; respond to audit findings.",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — Pallet implemented & tested",
        desc: "Core extrinsics (link/rotate/retire) + tests + integration hooks with identity registry.",
      },
      {
        title: "M2 — Audit completed",
        desc: "External audit focused on takeover/replay paths; fixes applied; report published.",
      },
      {
        title: "M3 — Mainnet activation & docs",
        desc: "Testnet rollout, staged tests, runtime upgrade scheduled, docs published on docs.humanode.io.",
      },
    ],
    summary: summaryFor("biometric-account-recovery"),
    overview:
      "If a user loses or compromises their key today, their account is effectively dead. Humanode can confirm the same human via biometric uniqueness, so keys should be replaceable without breaking “one human” semantics.",
    executionPlan: [
      "Week 0: confirm engineer and auditor; lock invariants and integration boundaries.",
      "Weeks 1–3: implement pallet + tests; design HumanID ↔ account mapping and cooldowns.",
      "Weeks 4–6: external audit + fixes; publish report and merge final code.",
      "Weeks 7–8: testnet → mainnet runtime upgrade; publish user/dev docs and link from frontends.",
    ],
    budgetScope:
      "Total ask: 34,000 HMND for ~8 weeks (6k architect/review, 18k engineer, 10k external audit). Out of scope: changes to biometric verification flows, advanced social recovery, or broad wallet UI redesign.",
    invisionInsight: {
      role: "CTO / Protocol Architect",
      bullets: [
        "Proposals: 5 total · 5 approved · 0 abandoned",
        "Milestones: 12 / 12 completed · avg delay +2 days",
        "Budget: 210k HMND requested · 15k HMND returned",
        "Governance: active in 100% of protocol-related proposals",
        "Delegations: 4.3% active voting power from 31 Humanodes",
        "Confidence: Very low delivery risk · 4.9 / 5",
      ],
    },
  },
  "humanode-ai-video-shorts": {
    title: "Humanode AI Video Series: 3 Viral-Quality Shorts for Mass Reach",
    proposer: "Tony",
    proposerId: "tony",
    chamber: "Design chamber",
    focus: "High-quality shorts for mass reach",
    tier: "Ecclesiast",
    budget: "15k HMND",
    cooldown: "Withdraw cooldown: 12h",
    formationEligible: false,
    teamSlots: "1 / 1",
    milestones: "3",
    upvotes: 22,
    downvotes: 8,
    attentionQuorum: 0.2,
    activeGovernors: 150,
    upvoteFloor: 15,
    rules: [
      "20% attention from active governors required.",
      "At least 10% upvotes to move to chamber vote.",
      "Deliverables include editable project files and an asset pack for reuse.",
    ],
    attachments: [
      { id: "portfolio", title: "Portfolio: https://…/visual-node" },
      { id: "tools", title: "Tooling list + licensing plan (draft)" },
      { id: "style", title: "Style test snippets (draft)" },
    ],
    teamLocked: [{ name: "Tony", role: "AI motion designer & producer" }],
    openSlotNeeds: [],
    milestonesDetail: [
      {
        title: "M1 — Scripts & Style Tests",
        desc: "Scripts, storyboards, and AI style test snippets for all 3 videos delivered.",
      },
      {
        title: "M2 — Video 1 & 2 Final",
        desc: "Two final videos delivered in vertical + horizontal formats, with source project files.",
      },
      {
        title: "M3 — Video 3 + Asset Pack",
        desc: "Third video delivered plus asset pack and short usage guide for the ecosystem.",
      },
    ],
    summary: summaryFor("humanode-ai-video-shorts"),
    overview:
      "We need visuals one level above typical AI spam. This proposal funds a cohesive 3-video series with strong hooks, consistent style, proper sound design, and reusable assets for official and community channels.",
    executionPlan: [
      "Week 0: lock brief + messaging; purchase/upgrade required AI tooling and SFX/music libraries.",
      "Weeks 1–2: scripts + storyboards + style tests for all 3 videos.",
      "Weeks 3–4: produce Video 1 and Video 2; iterate once on feedback; deliver exports + project files.",
      "Weeks 5–6: produce Video 3; compile asset pack + templates; deliver usage guide + handoff.",
    ],
    budgetScope:
      "Total ask: 15,000 HMND (3k tools/assets, 10k production, 2k VO/freelance contingency). Out of scope: long-term content operations beyond the 3-video series.",
    invisionInsight: {
      role: "Visual & Content Creator",
      bullets: [
        "Track record: Humanode AI Video Contest winner",
        "Focus: high-quality, emotionally engaging visual content",
        "Confidence: Low delivery risk · 4.7 / 5",
      ],
    },
  },
  "ai-video-launch-distribution-sprint": {
    title:
      "AI Video Launch & Distribution Sprint: Turn Visual Assets into Reach",
    proposer: "Petr",
    proposerId: "petr",
    chamber: "Marketing chamber",
    focus: "Distribution execution + playbook",
    tier: "Ecclesiast",
    budget: "18k HMND",
    cooldown: "Withdraw cooldown: 12h",
    formationEligible: true,
    teamSlots: "1 / 3",
    milestones: "3",
    upvotes: 21,
    downvotes: 7,
    attentionQuorum: 0.2,
    activeGovernors: 150,
    upvoteFloor: 15,
    rules: [
      "20% attention from active governors required.",
      "At least 10% upvotes to move to chamber vote.",
      "No paid ads in v1; focus on coordinated organic distribution and experiments.",
    ],
    attachments: [
      { id: "github", title: "GitHub: https://github.com/clip-captain" },
    ],
    teamLocked: [{ name: "Petr", role: "Campaign lead & strategist" }],
    openSlotNeeds: [
      {
        title: "shorts-wizard",
        desc: "Editor / repurposer for vertical clips, subtitles, hooks, and variants.",
      },
      {
        title: "comms-anchor",
        desc: "Community + posting ops (scheduling, replies, coordination with core comms).",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — Content Kits & Calendar",
        desc: "Content kits (clips, thumbnails, captions, CTAs) + 6-week posting calendar delivered for up to 3 core videos.",
      },
      {
        title: "M2 — Campaign Live",
        desc: "Multi-channel distribution executed with experiments and weekly tuning updates.",
      },
      {
        title: "M3 — Report & Playbook",
        desc: "Campaign results summarized and a reusable AI video launch playbook produced.",
      },
    ],
    summary: summaryFor("ai-video-launch-distribution-sprint"),
    overview:
      "The failure mode is “publish once, then forget”. This proposal funds hands-on distribution: content kits, calendars, coordinated posting, community engagement, and measurement so videos turn into followers, community members, and potential Vortex participants.",
    executionPlan: [
      "Week 0: recruit team; sync with core comms on access, timing, and approval process; inventory assets.",
      "Weeks 1–2: produce kits and calendar; align messaging and CTAs per channel.",
      "Weeks 3–5: run the campaign; iterate based on performance; publish weekly mini-updates.",
      "Week 6: wrap-up report + playbook for future launches.",
    ],
    budgetScope:
      "Total ask: 18,000 HMND (7k lead, 6k editor, 5k comms ops). Out of scope: producing new videos, paid ads, and influencer deals.",
    invisionInsight: {
      role: "Content & Growth Operations",
      bullets: [
        "Proposals: 2 total · 2 approved",
        "Milestones: 4 / 4 completed · avg delay +2 days",
        "Budget: 22k HMND requested · 2k HMND returned",
        "Delegations: 1.0% active voting power from 8 Humanodes",
        "Confidence: Low delivery risk · 4.6 / 5",
      ],
    },
  },
  "vortex-field-experiments-s1": {
    title: "Vortex Field Experiments: Season 1 (Find the True Believers)",
    proposer: "Ekko",
    proposerId: "ekko",
    chamber: "Marketing chamber",
    focus: "High-signal onboarding",
    tier: "Ecclesiast",
    budget: "24k HMND",
    cooldown: "Withdraw cooldown: 12h",
    formationEligible: true,
    teamSlots: "1 / 3",
    milestones: "3",
    upvotes: 28,
    downvotes: 9,
    attentionQuorum: 0.2,
    activeGovernors: 150,
    upvoteFloor: 15,
    rules: [
      "20% attention from active governors required.",
      "At least 10% upvotes to move to chamber vote.",
      "No paid ads / airdrop farming incentives in this proposal scope.",
    ],
    attachments: [
      { id: "github", title: "GitHub: https://github.com/signal-hacker" },
      { id: "hub", title: "Season 1 hub page (draft)" },
      { id: "briefs", title: "Experiment briefs & KPI targets (draft)" },
    ],
    teamLocked: [{ name: "Ekko", role: "Campaign architect / growth" }],
    openSlotNeeds: [
      {
        title: "Content & design generalist",
        desc: "Threads, visuals, simple edits, and recaps for each experiment.",
      },
      {
        title: "Community producer / mod",
        desc: "Host clinics, run calls, onboard newcomers, and keep discussions healthy.",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — Governance Puzzle Drop",
        desc: "3–5 puzzles + debrief calls + recap thread + list of high-signal participants.",
      },
      {
        title: "M2 — Vortex Problem Clinics",
        desc: "3 live clinics + recordings/summaries + follow-up write-ups + recurring participant list.",
      },
      {
        title: "M3 — Micro-Bounty Lab & Debrief",
        desc: "10–15 thinking bounties + rewards + Season 1 report + onboarding map into Vortex.",
      },
    ],
    summary: summaryFor("vortex-field-experiments-s1"),
    overview:
      "Instead of ads or low-signal campaigns, Season 1 uses interactive governance experiments that require thinking and creation, filtering out farmers and pulling in true believers.",
    executionPlan: [
      "Week 0: finalize team, channels, and minimal hub page + visual kit.",
      "Weeks 1–2: run Puzzle Drop, debrief calls, and publish recap + high-signal list.",
      "Weeks 3–4: run three Problem Clinics with external guests; publish summaries/clips.",
      "Weeks 5–6: run Micro-Bounty Lab, reward best submissions, publish Season 1 debrief.",
    ],
    budgetScope:
      "Total ask: 24,000 HMND for ~6 weeks (9k architect, 7k content/design, 5k community producer, 3k prizes/ops). Out of scope: paid ad campaigns and KOL packages.",
    invisionInsight: {
      role: "Growth & Community Experiments",
      bullets: [
        "Proposals: 3 total · 3 approved · 0 abandoned",
        "Milestones: 6 / 6 completed · avg delay +2 days",
        "Budget: 60k HMND requested · 4k HMND returned",
        "Governance: voted in 80% last year; comments on distribution & narrative",
        "Delegations: 1.2% active voting power from 9 Humanodes",
        "Confidence: Low delivery risk · 4.5 / 5",
      ],
    },
  },
};

const chamberProposals: Record<string, ChamberProposalPage> = {
  "fixed-governor-stake-spam-slashing": {
    title: "Fixed Governor Stake & Spam Slashing Rule for Vortex",
    proposer: "Fares",
    proposerId: "fares",
    chamber: "Economics chamber",
    budget: "18k HMND",
    formationEligible: true,
    teamSlots: "1 / 2",
    milestones: "3",
    timeLeft: "11h 05m",
    votes: { yes: 36, no: 22, abstain: 4 },
    attentionQuorum: 0.33,
    passingRule: "≥66.6% + 1 yes within quorum",
    engagedGovernors: 62,
    activeGovernors: 150,
    attachments: [
      { id: "policy", title: "Spam definition & governance process (draft)" },
      { id: "params", title: "Parameter sheet: stake, slash curve, cooldowns" },
    ],
    teamLocked: [{ name: "Fares", role: "Economic design lead / proposer" }],
    openSlotNeeds: [
      {
        title: "Rust / Substrate engineer",
        desc: "Implement stake gate + lock/unlock + spam-slash hook; write tests; deploy to testnet/mainnet.",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — Spec & Policy Ready",
        desc: "Stake size, slashing curve, spam definition, and cooldowns documented and approved at policy level.",
      },
      {
        title: "M2 — Implementation & Testnet",
        desc: "Runtime logic implemented + tests + scenario runs (normal, spam incidents, revoke/re-entry) on testnet.",
      },
      {
        title: "M3 — Mainnet Activation",
        desc: "Mainnet activation + minimal monitoring + public post-deploy note.",
      },
    ],
    summary: summaryFor("fixed-governor-stake-spam-slashing"),
    overview:
      "Adds a single gate (fixed governor stake) and a slashing hook for repeated spam proposals. Voting power remains equal; stake only enforces eligibility and discipline.",
    executionPlan: [
      "Week 0–1: confirm Substrate engineer; align spam definition and parameters with General chamber.",
      "Weeks 2–3: publish spec (stake size, slash curve, cooldowns, tagging process).",
      "Weeks 4–6: runtime implementation + tests + testnet scenario runs.",
      "Weeks 7–8: mainnet activation + minimal monitoring + public post-deploy note.",
    ],
    budgetScope:
      "Total ask: 18,000 HMND for ~8 weeks (7k economic/policy, 11k Substrate engineer). Out of scope: L1 tokenomics changes, voting power changes, and extensive UI work.",
    invisionInsight: {
      role: "Governance & Economics",
      bullets: [
        "Proposals: 4 total · 3 approved · 0 abandoned",
        "Milestones: 8 / 9 completed · avg delay +3 days · 0 slashing",
        "Budget: 160k HMND requested · 7k HMND returned",
        "Governance: voted in 95% last year · 24 economic comments",
        "Delegations: 2.4% active voting power from 19 Humanodes",
        "Confidence: Low delivery risk · 4.6 / 5",
      ],
    },
  },
  "tier-decay-v1": {
    title: "Tier Decay v1: Nominee → Ecclesiast → Legate → Consul → Citizen",
    proposer: "Andrei",
    proposerId: "andrei",
    chamber: "General chamber",
    budget: "13k HMND",
    formationEligible: true,
    teamSlots: "2 / 2",
    milestones: "3",
    timeLeft: "2d 18h",
    votes: { yes: 41, no: 13, abstain: 4 },
    attentionQuorum: 0.33,
    passingRule: "≥66.6% + 1 yes within quorum",
    engagedGovernors: 58,
    activeGovernors: 150,
    attachments: [
      { id: "params", title: "Decay thresholds + warnings table (draft)" },
      { id: "shadow", title: "Shadow-mode report template (draft)" },
    ],
    teamLocked: [
      { name: "Andrei", role: "Governance design lead / proposer" },
      { name: "Engineer (TBD)", role: "Backend / data engineer (part-time)" },
    ],
    openSlotNeeds: [],
    milestonesDetail: [
      {
        title: "M1 — Tier Decay Spec v1",
        desc: "Finalize thresholds per tier, warning rules, and re-tiering conditions; publish and incorporate feedback.",
      },
      {
        title: "M2 — Implementation & Shadow Mode",
        desc: "Implement tracking and run shadow mode for a few eras to validate expected decay outcomes.",
      },
      {
        title: "M3 — Activation & UX",
        desc: "Enable decay, show tier + decay status in profiles/Invision, and publish a clear explainer.",
      },
    ],
    summary: summaryFor("tier-decay-v1"),
    overview:
      "Tier Decay steps down proposition rights over consecutive inactive eras (Citizen → Consul → Legate → Ecclesiast → Nominee → Inactive), while preserving 1 human = 1 vote.",
    executionPlan: [
      "Week 0: inspect active-governor data and era history; lock v1 parameters.",
      "Weeks 1–2: publish policy spec and incorporate feedback.",
      "Weeks 3–4: implement tracking and run shadow mode for a few eras.",
      "Weeks 5–6: enable decay and ship basic UX: tier + status + warnings.",
    ],
    budgetScope:
      "Total ask: 13,000 HMND (5k spec/design + 8k part-time backend/data engineer). Out of scope: runtime changes and advanced notification integrations.",
    invisionInsight: {
      role: "Governance systems designer",
      bullets: [
        "Focus: anti-ossification and aligning tiers with real activity",
        "Confidence: Low delivery risk",
      ],
    },
  },
  "voluntary-commitment-staking": {
    title:
      "Voluntary Governor Commitment Staking (No Mandatory Stake, No Plutocracy)",
    proposer: "Victor",
    proposerId: "victor",
    chamber: "General chamber",
    budget: "16k HMND",
    formationEligible: true,
    teamSlots: "1 / 2",
    milestones: "3",
    timeLeft: "3d 12h",
    votes: { yes: 44, no: 6, abstain: 2 },
    attentionQuorum: 0.33,
    passingRule: "≥66.6% + 1 yes within quorum",
    engagedGovernors: 52,
    activeGovernors: 150,
    attachments: [
      { id: "spec-v1", title: "Voluntary Commitment Staking Spec v1" },
    ],
    teamLocked: [{ name: "Victor", role: "Economic design lead / proposer" }],
    openSlotNeeds: [
      {
        title: "Rust / Substrate engineer",
        desc: "Implement optional commitment stake module + tests; add integration hooks for linking stake to pledges.",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — Spec & UX",
        desc: "Commitment stake spec + UX notes published (amount, pledge linking, self-slash conditions).",
      },
      {
        title: "M2 — Code & Testnet",
        desc: "Implementation live on testnet with basic tests and an internal trial.",
      },
      {
        title: "M3 — Mainnet & Guidelines",
        desc: "Mainnet activation + guidelines; insights updated to show stake + self-slash history.",
      },
    ],
    summary: summaryFor("voluntary-commitment-staking"),
    overview:
      "Introduce a voluntary “Commitment Stake” module: humans may stake any amount as a public signal and optionally attach self-slashing conditions tied to milestones or behavior, without gating governance or affecting voting power.",
    executionPlan: [
      "Week 0–1: confirm Substrate engineer, define constraints (optional, no voting-power impact).",
      "Weeks 2–3: publish spec + UX notes (linking stake to proposal/milestone pledges).",
      "Weeks 4–6: implement module + tests, deploy to testnet and run an internal trial.",
      "Weeks 7–8: mainnet activation + guidelines, update insights to show stake + self-slash history.",
    ],
    budgetScope:
      "Total ask: 16,000 HMND for ~8 weeks. Breakdown: 6k economic design/spec + 10k Substrate engineer. Out of scope: any mandatory stake requirements, voting power changes, or complex reputation scoring beyond simple display.",
    invisionInsight: {
      role: "Governance & Public Goods Economics",
      bullets: [
        "Proposals: 3 total · 3 approved · 0 abandoned",
        "Milestones: 7 / 7 completed · avg delay +2 days · 0 slashing",
        "Budget: 95k HMND requested · 5k HMND returned",
        "Governance: voted in 90% last year · 20 comments on inclusivity/incentives",
        "Delegations: 1.6% active voting power from 14 Humanodes",
        "Confidence: Low delivery risk · 4.5 / 5",
      ],
    },
  },
};

const formationProposals: Record<string, FormationProposalPage> = {
  "evm-dev-starter-kit": {
    title: "Humanode EVM Dev Starter Kit & Testing Sandbox",
    chamber: "Engineering chamber",
    proposer: "Sesh",
    proposerId: "sesh",
    budget: "180k HMND",
    timeLeft: "12w",
    teamSlots: "1 / 3",
    milestones: "1 / 3",
    progress: "24%",
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "18k / 180k" },
      { title: "Team slots", description: "Taken / Total", value: "1 / 3" },
      { title: "Milestones", description: "Completed / Total", value: "1 / 3" },
    ],
    stats: [
      { label: "Lead chamber", value: "Engineering chamber" },
      { label: "Duration", value: "12 weeks" },
    ],
    lockedTeam: [{ name: "Sesh", role: "Lead engineer" }],
    openSlots: [
      {
        title: "EVM full-stack developer",
        desc: "Example dApps, sandbox UI, local setup + integration with Humanode EVM endpoints.",
      },
      {
        title: "Technical writer / DevRel",
        desc: "Docs + tutorials, quickstarts, walkthrough videos, and early builder feedback loop.",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — SDK & Template Ready",
        desc: "TypeScript SDK + base dApp template implemented, tested, and released (v0.1.0).",
      },
      {
        title: "M2 — Sandbox Online",
        desc: "Public testnet sandbox + faucet + one-command local dev setup and “Getting started” docs.",
      },
      {
        title: "M3 — Docs & Beta Launch",
        desc: "Full docs + short walkthrough videos; closed beta with 3–5 teams and critical fixes merged.",
      },
    ],
    attachments: [
      { id: "tech-spec", title: "Technical spec (Notion / gist)" },
      {
        id: "repo-draft",
        title: "Draft repo: humanode-network/evm-dev-starter-kit",
      },
      { id: "docs-outline", title: "Rough docs outline" },
    ],
    summary: summaryFor("evm-dev-starter-kit"),
    overview:
      "Deliver a TypeScript SDK, templates, sandbox + faucet, and full docs so developers can deploy dApps on Humanode in under 30 minutes.",
    executionPlan: [
      "Week 0–1: finalize requirements, recruit remaining roles, set up repos and CI skeleton.",
      "Weeks 2–4: ship SDK + base template (v0.1.0) with minimal tests and quickstart.",
      "Weeks 5–8: deploy public sandbox + faucet, ship one-command local dev setup.",
      "Weeks 9–12: publish full docs + videos, run a beta with 3–5 teams, integrate feedback.",
    ],
    budgetScope:
      "Total ask: 180,000 HMND for 12 weeks, unlocked by milestones (plus small upfront Formation tranche).",
    invisionInsight: {
      role: "Core Builder – Engineering",
      bullets: [
        "Proposals: 6 total · 5 approved · 0 abandoned",
        "Milestones: 13 / 14 completed · avg delay +4 days · 0 slashing",
        "Confidence: Low delivery risk · 4.7 / 5",
      ],
    },
  },
  "mev-safe-dex-v1-launch-sprint": {
    title: "Humanode MEV-Safe DEX v1 + Launch Sprint",
    chamber: "Engineering chamber",
    proposer: "Dato",
    proposerId: "dato",
    budget: "245k HMND",
    timeLeft: "16w",
    teamSlots: "3 / 5",
    milestones: "2 / 4",
    progress: "46%",
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "98k / 245k" },
      { title: "Team slots", description: "Filled / Total", value: "3 / 5" },
      { title: "Milestones", description: "Completed / Total", value: "2 / 4" },
    ],
    stats: [
      { label: "Lead chamber", value: "Engineering chamber" },
      { label: "Audit", value: "In progress" },
    ],
    lockedTeam: [
      { name: "Dato", role: "Protocol lead" },
      { name: "mev-ops", role: "MEV / relayer engineer (recruiting)" },
      { name: "frontend-loop", role: "Frontend dApp dev (recruiting)" },
    ],
    openSlots: [
      {
        title: "liq-pilot",
        desc: "Liquidity onboarding, pool setup, and partner coordination (part-time).",
      },
      {
        title: "launch-captain",
        desc: "Marketing lead for distribution + launch execution + reporting.",
      },
    ],
    milestonesDetail: [
      {
        title: "M1 — Contracts MVP",
        desc: "Spec + tested contracts + fee-to-nodes module; Biostaker/getHMND compatibility at contract layer.",
      },
      {
        title: "M2 — Protected swaps + UI",
        desc: "Protected swap path on testnet + frontend alpha + bridge panel.",
      },
      {
        title: "M3 — Audit + Mainnet",
        desc: "External audit, fixes, and mainnet deployment with core pools.",
      },
      {
        title: "M4 — Launch sprint",
        desc: "Liquidity onboarding + coordinated launch sprint + playbook + first-month summary.",
      },
    ],
    attachments: [
      { id: "github", title: "GitHub: https://github.com/defi-synth" },
      { id: "audit", title: "Audit vendor scope (draft)" },
      { id: "launch", title: "Launch kit outline (draft)" },
    ],
    summary: summaryFor("mev-safe-dex-v1-launch-sprint"),
    overview:
      "A DEX launch needs liquidity, trust, and repeated distribution. This project covers contracts + MEV protection + frontend + audit, plus a launch pod to drive adoption.",
    executionPlan: [
      "Weeks 1–4: contracts MVP + tests/fuzzing.",
      "Weeks 5–8: protected swaps on testnet + frontend alpha.",
      "Weeks 9–12: audit + fixes + mainnet deploy.",
      "Weeks 13–16: liquidity onboarding + marketing launch sprint + reporting.",
    ],
    budgetScope:
      "Total ask: 245,000 HMND including audit and launch pod. Out of scope: paid influencer packages and any unparameterized tokenomics changes.",
    invisionInsight: {
      role: "DeFi engineer (shipping + adoption)",
      bullets: [
        "Focus: AMMs/routers/incentives and production launches",
        "Confidence: Low delivery risk (subject to audit)",
      ],
    },
  },
};

export function getPoolProposalPage(id?: string) {
  const first = Object.values(poolProposals)[0];
  return (id ? poolProposals[id] : undefined) ?? first;
}

export function poolProposalPageById(id: string): PoolProposalPage | undefined {
  return poolProposals[id];
}

export function getChamberProposalPage(id?: string) {
  return (
    (id ? chamberProposals[id] : undefined) ??
    chamberProposals["voluntary-commitment-staking"]
  );
}

export function chamberProposalPageById(
  id: string,
): ChamberProposalPage | undefined {
  return chamberProposals[id];
}

export function getFormationProposalPage(id?: string) {
  const first = Object.values(formationProposals)[0];
  return (id ? formationProposals[id] : undefined) ?? first;
}

export function formationProposalPageById(
  id: string,
): FormationProposalPage | undefined {
  return formationProposals[id];
}
