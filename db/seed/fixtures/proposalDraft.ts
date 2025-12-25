export const proposalDraftDetails = {
  title: "Vortex Governance Hub UX Refresh & Design System v1",
  proposer: "Temo",
  chamber: "Design chamber",
  focus: "Clarity, hierarchy, and mobile UX",
  tier: "Nominee",
  budget: "20k HMND",
  formationEligible: true,
  teamSlots: "1 / 2",
  milestonesPlanned: "3 milestones · 6 weeks",
  summary:
    "Audit Vortex UX, create a lightweight design system, redesign key flows, and deliver dev-ready Figma + basic design tokens.",
  rationale:
    "Vortex has strong concepts but feels dense and unclear for many users, especially on mobile. A coherent design system + clear hierarchy reduces confusion and makes governance usable for new humans.",
  budgetScope:
    "Covers the UX audit + flow mapping, Design System v1 (tokens + components), redesigned core screens (proposals/chambers/Invision/proposal creation), and a dev-ready handoff bundle. Out of scope: implementing the redesign in the frontend.",
  invisionInsight: {
    role: "Product & Web UX",
    bullets: [
      "Improves scanability of proposals, chambers, and Invision insights across devices.",
      "Reduces onboarding confusion (“where do I vote?” / “where do I start?”) with clearer hierarchy and flows.",
      "Delivers dev-ready Figma + token notes so implementation is predictable and consistent.",
    ],
  },
  checklist: [
    "Map current flows and pain points; produce a short problem map.",
    "Deliver wireframes for proposal list/detail, creation flow, chambers, and Invision.",
    "Build a lightweight design system (tokens + components) and apply to key screens.",
    "Prepare dev handoff bundle with guidelines and token mapping notes.",
  ],
  milestones: [
    "M1 — UX Flows & Wireframes",
    "M2 — Design System & Key Screens",
    "M3 — Handoff Ready",
  ],
  teamLocked: [{ name: "Temo", role: "Lead product & UX designer" }],
  openSlotNeeds: [
    {
      title: "Frontend dev (part-time, optional)",
      desc: "Help translate the design system into tokens, review feasibility, and support the dev handoff.",
    },
  ],
  milestonesDetail: [
    {
      title: "M1 — UX Flows & Wireframes",
      desc: "Desktop + mobile wireframes for main flows with one iteration cycle after review.",
    },
    {
      title: "M2 — Design System & Key Screens",
      desc: "Tokens (colors/type/spacing/shadows) + key components, applied to proposal list/detail, creation flow, chambers, and Invision.",
    },
    {
      title: "M3 — Handoff Ready",
      desc: "Polished Figma bundle + guidelines + token notes, plus optional walkthrough calls with devs.",
    },
  ],
  attachments: [
    { title: "Portfolio: https://pixel-node.design", href: "#" },
    { title: "UX audit + problem map (draft)", href: "#" },
    { title: "Design system tokens (draft)", href: "#" },
  ],
} as const;
