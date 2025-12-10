export type PageHintEntry = {
  id: string;
  title: string;
  intro: string;
  sections?: { heading: string; items: string[] }[];
  actions?: string[];
};

export const pageHints: Record<string, PageHintEntry> = {
  feed: {
    id: "feed",
    title: "Feed",
    intro:
      "Your personal governance feed. See proposals, threads, factions, and courts that need your attention.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Proposals across pool, chamber vote, and formation stages.",
          "Threads and faction updates relevant to your roles.",
          "Courts or appeals you may need to act on.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Expand an item to read details, stats, and actions.",
          "Open proposals or threads directly from the feed.",
          "Track vote status or milestones without leaving the page.",
        ],
      },
    ],
  },
  "human-nodes": {
    id: "human-nodes",
    title: "Human nodes directory",
    intro:
      "Browse and filter human nodes by tier, chamber, ACM/MM, and formation participation.",
    sections: [
      {
        heading: "Filters & sort",
        items: [
          "Filter by tier, chamber, tags, ACM/MM minimums, and formation membership.",
          "Sort by ACM, tier, or name. Switch between cards and list view.",
        ],
      },
      {
        heading: "Cards & list",
        items: [
          "Open a profile to see proofs, activity, and governance stats.",
          "Formation and governor status are shown per node.",
        ],
      },
    ],
  },
  "human-node": {
    id: "human-node",
    title: "Human node profile",
    intro:
      "Detailed view of a single governor: tier, proofs, activity, formation projects, and governance history.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Header with status pills, ACM/MM, and member-since date.",
          "Proof-of-Time/Devotion/Governance tiles and toggles.",
          "Governance activity, formation projects, and details tiles.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Toggle PoT/PoD/PoG to inspect proof details.",
          "Scroll activity and formation lists; open related items if needed.",
        ],
      },
    ],
  },
  proposals: {
    id: "proposals",
    title: "Proposals",
    intro:
      "Browse proposals across pool, chamber vote, and formation. Filter, sort, and open details.",
    sections: [
      {
        heading: "Filters",
        items: [
          "Search by keyword, status, chamber, tier requirement, and proof emphasis.",
          "Use chips to quickly filter by topic or quorum.",
        ],
      },
      {
        heading: "Cards",
        items: [
          "Expand a proposal to see stage data, proof mix, budgets, and actions.",
          "Open proposal pages for deeper context.",
        ],
      },
    ],
  },
  chambers: {
    id: "chambers",
    title: "Chambers",
    intro:
      "Overview of specialization chambers: multipliers, governors, pipelines, and quick links.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Top metrics for chambers, governors, ACM, and live proposals.",
          "Per-chamber cards with multipliers, governors, LCM/ACM, and pipeline counts.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Open a chamber for proposal status, roster, and forum.",
          "Compare chamber multipliers and pipelines at a glance.",
        ],
      },
    ],
  },
  formation: {
    id: "formation",
    title: "Formation",
    intro:
      "Track formation projects, stages, and metrics. Filter by category and search projects.",
    sections: [
      {
        heading: "Filters",
        items: [
          "Toggle stage (live/gathering/completed) and category (All/Research/Development/Social).",
          "Search projects by title, proposer, focus, or stage.",
        ],
      },
      {
        heading: "Cards",
        items: [
          "See budget, milestones, team slots, and progress per project.",
          "Open a project to view milestones and team details.",
        ],
      },
    ],
  },
  factions: {
    id: "factions",
    title: "Factions",
    intro:
      "Browse factions, membership, votes, and ACM. Open faction pages for initiatives and goals.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Cards with members, votes, ACM, and description tags.",
          "Actions to open faction detail or follow updates.",
        ],
      },
    ],
  },
  feed: {
    id: "feed",
    title: "Feed",
    intro:
      "Your personal governance feed. See proposals, threads, factions, and courts that need your attention.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Proposals across pool, chamber vote, and formation stages.",
          "Threads and faction updates relevant to your roles.",
          "Courts or appeals you may need to act on.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Expand an item to read details, stats, and actions.",
          "Open proposals or threads directly from the feed.",
          "Track vote status or milestones without leaving the page.",
        ],
      },
    ],
  },
  "cm-panel": {
    id: "cm-panel",
    title: "CM Panel",
    intro:
      "Set CM multipliers for chambers where you are not a member. Member chambers are blurred/locked.",
    sections: [
      {
        heading: "What you can do",
        items: [
          "Review current multipliers (M × value) per chamber.",
          "Suggest multipliers for non-member chambers; locked for chambers you belong to.",
          "Submit suggestions once finished.",
        ],
      },
    ],
  },
  "my-governance": {
    id: "my-governance",
    title: "My governance",
    intro:
      "Track your governing era, required actions, progression toward next tier, and proposal rights.",
    sections: [
      {
        heading: "Governing threshold",
        items: [
          "Era status, required actions, and completion counts.",
          "Formation and governing tasks to stay active in quorum.",
        ],
      },
      {
        heading: "Progression",
        items: [
          "Current tier, progress to next tier, and prerequisites (uptime, activity).",
          "Proposal rights available per tier.",
        ],
      },
    ],
  },
  profile: {
    id: "profile",
    title: "My profile",
    intro:
      "Your personal governor profile with tier, proofs, activity, and formation involvement.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Tier, ACM/MM, faction, and delegation share.",
          "Proof toggles (PoT/PoD/PoG), governance activity, and projects.",
        ],
      },
    ],
  },
  faction: {
    id: "faction",
    title: "Faction detail",
    intro:
      "See a faction’s stance, members, initiatives, and resources. Join or follow from here.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Members, votes, ACM, creator.",
          "Active initiatives with locations/stages and resources/links.",
        ],
      },
    ],
  },
};
