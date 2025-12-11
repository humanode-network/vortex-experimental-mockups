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
      "Unified stream of governance activity that needs your attention right now.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Proposals across pool, chamber vote, and formation stages with stage data.",
          "Threads, faction updates, and courts/appeals relevant to your roles.",
          "Time-stamped entries sorted newest-first; urgent items float to the top.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Expand an item to read stage stats and context.",
          "Open the underlying proposal, thread, faction, or court case in one click.",
          "Skim quorum/votes/milestones without leaving the feed.",
        ],
      },
    ],
  },
  "human-nodes": {
    id: "human-nodes",
    title: "Human nodes directory",
    intro:
      "Browse all human nodes/governors. Filter, sort, and open profiles for proofs, activity, and formation context.",
    sections: [
      {
        heading: "Filters & sort",
        items: [
          "Filter by tier, chamber, tags, ACM/MM minimums, and formation membership.",
          "Sort by ACM, tier, or name; toggle cards vs list view.",
          "Results are scrollable (cards: 4 visible; list: 16 visible) to keep layout tidy.",
        ],
      },
      {
        heading: "Cards & list",
        items: [
          "Cards show headline stats (ACM/MM, tier, formation, status); list view compresses the same.",
          "Open a profile for proof toggles, activity, formation projects, and governance stats.",
          "Hints on ACM/LCM/MM/tier/era explain terms in place.",
        ],
      },
    ],
  },
  "human-node": {
    id: "human-node",
    title: "Human node profile",
    intro:
      "Detailed profile of a governor/human node: proofs, activity, formation projects, and governance history.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Header with avatar, name, status pills, ACM/MM, member-since.",
          "Proof-of-Time/Devotion/Governance tiles with toggles for detailed proof data.",
          "Governance activity grid, formation projects list, and details tiles (tier, delegation share, proposals created).",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Toggle PoT/PoD/PoG views to see duration, acceptance, and activity signals.",
          "Scroll activity/formation sections and open related items if needed.",
          "Use hints on ACM/LCM/MM/tier/era to learn terminology in-place.",
        ],
      },
    ],
  },
  proposals: {
    id: "proposals",
    title: "Proposals",
    intro:
      "Browse proposals across pool, chamber vote, and formation. Filter, sort, expand, and open full pages.",
    sections: [
      {
        heading: "Filters",
        items: [
          "Keyword search plus filters for status, chamber, tier requirement, proof emphasis, and sort by recency/activity/votes.",
          "Chips for rapid filtering by topic/quorum; reset/apply to refresh the stack.",
        ],
      },
      {
        heading: "Cards",
        items: [
          "Expand cards to see stage data, budgets, votes, passing rules, and stats.",
          "Open full proposal pages (PP/Chamber/Formation) from CTAs; watch/add to agenda where available.",
        ],
      },
    ],
  },
  chambers: {
    id: "chambers",
    title: "Chambers",
    intro:
      "Overview of specialization chambers: multipliers (M), governors, ACM/LCM, and pipelines.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Top metrics for chambers, governors, ACM, and live proposals.",
          "Per-chamber cards with multipliers, governors, LCM/ACM, and pipeline counts (pool/vote/build).",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Open a chamber detail for proposals, roster, and threads/chat.",
          "Compare multipliers and pipelines to spot busy or under-engaged chambers.",
        ],
      },
    ],
  },
  formation: {
    id: "formation",
    title: "Formation",
    intro:
      "Formation programs and projects: browse by stage and category, search, and inspect milestones/slots.",
    sections: [
      {
        heading: "Filters",
        items: [
          "Toggle stage (live/gathering/completed) and category (All/Research/Development/Social).",
          "Search by title, proposer, focus, or stage; legend shows stage colors.",
        ],
      },
      {
        heading: "Cards",
        items: [
          "Cards show budget, milestones, team slots, and progress; stage badges reflect status.",
          "Open a project to view milestones and team details; scroll when many items exist.",
        ],
      },
    ],
  },
  factions: {
    id: "factions",
    title: "Factions",
    intro:
      "Browse factions, membership, votes, ACM, and goals. Open faction pages for initiatives and resources.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Cards with members, votes, ACM, focus blurbs, and tags.",
          "Totals across factions (members, votes, ACM) plus search-as-you-type to filter cards.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Open a faction to see initiatives, roster, resources, and stance.",
          "Use consistent blue buttons and hints to learn ACM/MM terms.",
        ],
      },
    ],
  },
  "cm-panel": {
    id: "cm-panel",
    title: "CM Panel",
    intro:
      "Set chamber multipliers (M) where you are not a member; member chambers are locked/blurred.",
    sections: [
      {
        heading: "What you can do",
        items: [
          "Review current multipliers per chamber and adjust suggestions for non-member chambers.",
          "Locked rows indicate chambers you belong to; they cannot be edited here.",
          "Submit or copy your suggested values for later submission (UI is draft-style).",
        ],
      },
    ],
  },
  "my-governance": {
    id: "my-governance",
    title: "My governance",
    intro:
      "Track governing era status, required actions, progression to next tier, and proposal rights.",
    sections: [
      {
        heading: "Governing threshold",
        items: [
          "Era, time left, and required vs completed actions (pool votes, chamber votes, court actions, proposals).",
          "Stay above threshold to remain active in quorum for the next era.",
        ],
      },
      {
        heading: "Progression",
        items: [
          "Current tier, progress bar toward next tier, and prerequisites (uptime, activity).",
          "Proposal rights available per tier; ACM/MM/tier hints explain terms in context.",
        ],
      },
    ],
  },
  profile: {
    id: "profile",
    title: "My profile",
    intro:
      "Your governor profile: tier, proofs, activity, formation involvement, and governance stats.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Header with avatar, tier, ACM/MM, faction, and delegation share.",
          "Proof toggles (PoT/PoD/PoG), governance activity tiles, and project involvement.",
          "Scrollable activity and formation lists; hints on ACM/LCM/MM/tier/era clarify terminology.",
        ],
      },
    ],
  },
  faction: {
    id: "faction",
    title: "Faction detail",
    intro:
      "Detailed faction view: stance, members, votes/ACM, initiatives, roster, and resources.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Hero header with faction name; stats tiles (members, votes, ACM, creator).",
          "Active initiatives with location/stage labels; resources/links for the faction.",
          "Roster with roles and ACM/MM tags; open slots/threads vary by design.",
        ],
      },
    ],
  },
  chamber: {
    id: "chamber",
    title: "Chamber detail",
    intro:
      "Proposals, governors, and forum/chat for a single chamber, organized by stage.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Proposal list grouped by stage (upcoming/live/ended) with expand/collapse.",
          "Governor roster with tiers and search/filter.",
          "Forum threads and chat activity for chamber discussions.",
        ],
      },
      {
        heading: "What you can do",
        items: [
          "Filter proposals by stage and open them.",
          "Search governors; inspect tiers and roles.",
          "Read or start chamber threads and follow chat updates.",
        ],
      },
    ],
  },
  courts: {
    id: "courts",
    title: "Courts",
    intro:
      "Overview of active and recent court cases: status, jury info, and quick navigation.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Cards for court cases with status (jury/deliberating/closed), reports count, and opened date.",
          "Links to open specific courtrooms for details and participation.",
        ],
      },
    ],
  },
  courtroom: {
    id: "courtroom",
    title: "Courtroom",
    intro:
      "Case detail: filings/context, jury composition, and action timeline for the current courtroom.",
    sections: [
      {
        heading: "What you can do",
        items: [
          "Review case context and filings.",
          "See jury composition and timeline; track status badges.",
          "Submit statements or view decisions (UI placeholder actions).",
        ],
      },
    ],
  },
  invision: {
    id: "invision",
    title: "Invision",
    intro:
      "Network state dashboard: governance model, legitimacy/stability/centralization, factions snapshot, and council signals.",
    sections: [
      {
        heading: "What you see",
        items: [
          "Current governance model with key metrics (legitimacy, stability, centralization).",
          "Largest factions overview and economic indicators.",
          "Council/chamber proposals and risk highlights (depending on data shown).",
        ],
      },
    ],
  },
};
