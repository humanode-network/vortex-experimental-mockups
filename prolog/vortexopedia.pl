% Vortexopedia knowledge base (SWI-Prolog)
% Schema: vortex_term(RefNum, Id, Name, Category, ShortDesc, LongDescList, Tags, RelatedIds, Examples, Stages, Links, Source, Updated).
% Stages is a list of atoms like pool | chamber | formation | courts | feed.
% Links is a list of dicts: link{label:Label, url:Url}.

:- module(vortexopedia, [vortex_term/12, stage_label/2]).

% --- Stage labels (keep in sync with UI) ---
stage_label(pool, "Proposal pool").
stage_label(chamber, "Chamber vote").
stage_label(formation, "Formation").
stage_label(courts, "Courts").
stage_label(feed, "Feed").
stage_label(factions, "Factions").
stage_label(cm, "CM panel").

% --- Terms ---

vortex_term(
  1,
  "vortex",
  "Vortex",
  governance,
  "Main governing body of the Humanode network with cognitocratic egalitarian voting among human validators.",
  [
    "Vortex is the on-chain governing body that gradually absorbs the authority of Humanode Core and disperses it among human nodes.",
    "It is designed so that each governor has equal formal voting power, relying on cryptobiometrics to ensure that every governor is a unique living human.",
    "Vortex is implemented as a stack of proposal pools, voting chambers and the Formation executive layer."
  ],
  [governance, dao, humanode, vortex],
  ["vortex-structure", "cognitocracy", "proposal-pool-system-vortex-formation-stack", "specialization-chamber", "general-chamber", "formation", "governor", "human-node"],
  ["Changing fee distribution on Humanode via a Vortex proposal voted in the relevant chamber."],
  [chamber, pool, formation],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}, link{label:"App", url:"/vortexopedia/vortex"}],
  "gitbook:vortex-1.0:synopsis",
  "2025-12-04"
).

vortex_term(
  2,
  "human_node",
  "Human node",
  governance,
  "A uniquely biometric-verified person who runs a validator node, participates in consensus, and earns fees, but may or may not participate in governance.",
  [
    "Defined as a person who has undergone cryptobiometric processing and runs a node in the Humanode network.",
    "Receives network transaction fees as a validator.",
    "Does not necessarily participate in governance (non-governing by default).",
    "Can become a Governor by meeting governance participation requirements."
  ],
  [role, humanode, validator, sybil_resistance],
  ["governor", "delegator", "proof_of_time_pot", "proof_of_human_existence", "tier1_nominee"],
  ["In the app you can treat “human node” as the base identity type; every governor profile is a specialized human node."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0/basis-of-vortex"}],
  "Basis of Vortex – Vortex Roles",
  "2025-12-04"
).

vortex_term(
  3,
  "cognitocracy",
  "Cognitocracy",
  governance,
  "Legislative model where only those who can bring constructive, deployable innovation get voting rights (cognitocrats/governors).",
  [
    "Grants voting rights only to those who have proven professional, creative merit in a specialization.",
    "Cognitocrat and governor are interchangeable; one cannot be a governor without being a cognitocrat."
  ],
  [principle, governance, voting_rights, specialization],
  ["meritocracy", "governor", "human_node", "vortex"],
  ["Only cognitocrats can vote on matters of their specialization."],
  [global, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  4,
  "meritocracy",
  "Meritocracy",
  governance,
  "Concentrates power in those with proof of proficiency; Vortex evaluates innovation merit separately from functional work.",
  [
    "Aims to concentrate decision-making in hands of those with proven proficiency.",
    "Vortex uses PoT and PoD to emancipate governors from Nominee to Citizen."
  ],
  [principle, governance, merit],
  ["cognitocracy", "proof_of_time_pot", "proof_of_devotion_pod"],
  ["Governors progress tiers via PoT/PoD merit rather than popularity."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  5,
  "local_determinism",
  "Local determinism",
  governance,
  "Rejects ideology; values solutions that work efficiently regardless of political spectrum.",
  [
    "Denies ideology as a means for power; focuses on field-specific, workable solutions.",
    "As long as a solution works efficiently, its ideological alignment is irrelevant."
  ],
  [principle, governance, pragmatism],
  ["cognitocracy", "meritocracy"],
  ["Chambers choose the most efficient fix, not an ideologically pure one."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  6,
  "constant_deterrence",
  "Constant deterrence",
  governance,
  "Active, transparent guarding against centralization; emphasizes direct participation and active quorum.",
  [
    "Governors must actively seek and mitigate centralization threats and avoid excessive delegation.",
    "Requires transparent state visibility and active quorum: only active governors counted."
  ],
  [principle, governance, deterrence, decentralization],
  ["active_quorum", "delegation", "cognitocracy"],
  ["Governors monitor system state and vote directly to deter collusion."],
  [global, chamber, pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  7,
  "power_detachment_resilience",
  "Power detachment resilience",
  governance,
  "Minimizes gap between validation power and governance by ensuring one-human-one-node and maximizing validator participation.",
  [
    "Addresses power concentration common in capital-based protocols.",
    "Ensures each node is an individual with equal validation power; governors are validators; seeks high validator governance participation."
  ],
  [principle, governance, decentralization, equality],
  ["human_node", "governor", "active_quorum"],
  ["Validators are individual humans; governance aims to reflect that base."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  8,
  "vortex_structure",
  "Vortex structure",
  governance,
  "Three-part stack: proposal pools and voting chambers (legislative), Formation (executive).",
  [
    "Vortex consists of proposal pools and voting chambers in the legislative branch, and Formation in the executive branch."
  ],
  [structure, governance, legislative, executive],
  ["proposal_pools", "voting_chambers", "formation"],
  ["Proposal pools filter; chambers vote; Formation executes."],
  [pool, chamber, formation],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Structure",
  "2025-12-04"
).

vortex_term(
  9,
  "governor",
  "Governor (cognitocrat)",
  governance,
  "Human node that meets governing requirements and participates in voting; reverts to non-governing if requirements lapse.",
  [
    "A human node who participates in voting procedures according to governing requirements.",
    "If requirements are not met, protocol converts them back to a non-governing human node automatically."
  ],
  [role, governor, voting],
  ["human_node", "delegator", "cognitocracy"],
  ["Governor status is lost if era action thresholds are not met."],
  [chamber, pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0/basis-of-vortex"}],
  "Basis of Vortex – Roles",
  "2025-12-04"
).

vortex_term(
  10,
  "delegator",
  "Delegator",
  governance,
  "Governor who delegates voting power to another governor.",
  [
    "A governor who decides to delegate their voting power to another governor."
  ],
  [role, delegation, governor],
  ["governor", "delegation"],
  ["Governors may delegate votes in chamber stage but not in proposal pools."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0/basis-of-vortex"}],
  "Basis of Vortex – Roles",
  "2025-12-04"
).

vortex_term(
  11,
  "proposal_pools",
  "Proposal pools",
  governance,
  "Legislative attention filter where proposals gather support before chamber voting.",
  [
    "Part of the legislative branch; proposals enter pools to gather attention before advancing to chambers."
  ],
  [pool, governance, attention],
  ["vortex_structure", "voting_chambers", "formation"],
  ["Proposals must clear attention thresholds in pools to reach chambers."],
  [pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Structure",
  "2025-12-04"
).

vortex_term(
  12,
  "formation",
  "Formation",
  formation,
  "Executive branch for executing approved proposals, managing milestones, budget, and teams.",
  [
    "Formation belongs to the executive branch and handles execution of approved proposals.",
    "Covers milestones, budget usage, and team assembly."
  ],
  [formation, executive, milestones, budget, team],
  ["vortex_structure", "proposal_pools", "voting_chambers"],
  ["An approved chamber proposal becomes a Formation project for delivery."],
  [formation],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Structure",
  "2025-12-04"
).

vortex_term(
  13,
  "technocracy",
  "Technocracy",
  governance,
  "Decision-makers selected by technological knowledge; cognitocracy inherits innovation focus but rejects plutocratic traits.",
  [
    "Centers decision-making on technological expertise and innovation.",
    "Criticized for elitism via capital control; cognitocracy keeps innovation focus but discards plutocratic concentration."
  ],
  [principle, governance, technology, innovation],
  ["cognitocracy", "meritocracy"],
  ["Cognitocracy borrows the innovation drive of technocracy without the plutocratic tilt."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  14,
  "intellectual_barrier",
  "Intellectual barrier for voting rights",
  governance,
  "Voting rights granted through demonstrated expertise and deployable proposals, not formal diplomas.",
  [
    "Introduces on-the-spot proof of expertise via proposals instead of third-party credentials.",
    "Aims to separate power from popularity and formal degrees."
  ],
  [principle, governance, qualification, expertise],
  ["cognitocracy", "meritocracy"],
  ["Governors earn voting rights by proving deployable innovation in their field."],
  [global, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  15,
  "direct_democracy",
  "Direct democracy",
  governance,
  "Cognitocrats vote directly on issues without intermediaries to keep decisions aligned with active participants.",
  [
    "Relies on direct participation of cognitocrats for decisions.",
    "Keeps power with active governors rather than intermediaries."
  ],
  [principle, governance, democracy, delegation],
  ["representative_democracy", "liquid_democracy", "cognitocracy"],
  ["Cognitocrats vote directly in chambers to reflect active will."],
  [global, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  16,
  "representative_democracy",
  "Representative democracy",
  governance,
  "Delegation to representatives for flexibility; in cognitocracy, only cognitocrats may delegate to other cognitocrats.",
  [
    "Allows targeted delegation when direct participation is not feasible.",
    "Seeks reduced polarization via issue-specific representation."
  ],
  [principle, governance, democracy, delegation],
  ["direct_democracy", "liquid_democracy", "cognitocracy", "delegator"],
  ["Cognitocrats may delegate votes per issue to stay responsive."],
  [global, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  17,
  "liquid_democracy",
  "Liquid democracy (cognitocracy)",
  governance,
  "Vote delegation among cognitocrats only, retractable at any time; no elections, voice stays dynamic.",
  [
    "Cognitocrats delegate only to other cognitocrats; delegation is retractable.",
    "Reduces polarization by enabling issue-specific support; adapts to changing preferences."
  ],
  [principle, governance, delegation, liquid_democracy],
  ["direct_democracy", "representative_democracy", "cognitocracy", "delegator"],
  ["Delegated votes can be reclaimed at any moment, keeping representation aligned."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Principles",
  "2025-12-04"
).

vortex_term(
  18,
  "specialization_chamber",
  "Specialization Chamber (SC)",
  governance,
  "Chamber for a specific field; only specialists with accepted proposals in that field vote on related matters.",
  [
    "Admits governors who proved creative merit in the chamber’s field.",
    "Shards legislation to maintain professionalism and efficiency.",
    "Invariant: 1 governor-cognitocrat = 1 vote."
  ],
  [chamber, specialization, governance],
  ["general_chamber", "vortex_structure"],
  ["Programming chamber admits engineers whose proposals were accepted."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Chambers",
  "2025-12-04"
).

vortex_term(
  19,
  "general_chamber",
  "General Chamber (GC)",
  governance,
  "Chamber comprising all cognitocrats; its rulings supersede SCs and can force admittance of proposals.",
  [
    "Includes all cognitocrat-governors regardless of specialization.",
    "Acts on system-wide proposals; can enforce acceptance of proposals declined in SCs.",
    "Harder to reach quorum than SCs."
  ],
  [chamber, general, governance],
  ["specialization_chamber"],
  ["GC can override an SC by accepting a repeatedly declined proposal."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Chambers",
  "2025-12-04"
).

vortex_term(
  20,
  "chamber_inception",
  "Chamber inception",
  governance,
  "Process to create a Specialization Chamber: proposed and voted by existing cognitocrats; initial members nominated; CM approach chosen.",
  [
    "Only an established governor-cognitocrat can propose forming an SC.",
    "Initial cognitocrats are nominated; Cognitocratic Measure approach is chosen at creation."
  ],
  [process, chamber, governance],
  ["specialization_chamber", "cognitocratic_measure"],
  ["Formation of a new SC requires a proposal, vote, nominations, and CM setup."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Chambers",
  "2025-12-04"
).

vortex_term(
  21,
  "chamber_dissolution",
  "Chamber dissolution",
  governance,
  "Ending an SC via SC or GC proposal; GC censure excludes targeted SC members from quorum.",
  [
    "Can be proposed inside the SC or in the GC.",
    "GC vote of censure excludes members of the targeted SC from quorum and voting.",
    "Penalties are contextual to the dissolution cause."
  ],
  [process, chamber, governance],
  ["specialization_chamber", "general_chamber"],
  ["GC censure dissolves a corrupt SC; targeted members don’t count toward quorum."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Basis of Vortex – Chambers",
  "2025-12-04"
).

vortex_term(
  22,
  "quorum_of_attention",
  "Quorum of attention",
  governance,
  "Proposal-pool quorum: 22% of active governors engaged AND at least 10% upvotes to advance to a chamber.",
  [
    "Applied in every proposal pool.",
    "Proposal advances when ≥22% of active governors engage and ≥10% of them upvote.",
    "Delegated votes do NOT count in proposal pools."
  ],
  [quorum, pool, governance, attention],
  ["proposal_pools", "quorum_of_vote", "delegation_policy"],
  ["A pool item with 24% engagement and 14% upvotes moves to chamber voting."],
  [pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  23,
  "quorum_of_vote",
  "Quorum of vote",
  governance,
  "Chamber quorum: 33.3% participation; passing rule 66.6% + 1 yes within the quorum (≈22% of all active governors).",
  [
    "Chamber quorum is reached at 33.3% of active governors voting.",
    "Passing rule: 66.6% + 1 yes within the quorum (≈22% of active governors).",
    "Non-governing human nodes are not counted in quorum.",
    "Pulled-from-pool proposals get one week to be voted in chamber."
  ],
  [quorum, chamber, governance, voting],
  ["quorum_of_attention", "delegation_policy", "veto_rights"],
  ["A chamber vote with 35% turnout passes if 67% yes within that turnout."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  24,
  "delegation_policy",
  "Delegation and quorum policy",
  governance,
  "Counts only active governors for quorum, while allowing non-active cognitocrats to delegate to active ones in the same chamber.",
  [
    "Only active governors count toward quorum.",
    "Non-active cognitocrats may delegate to an active cognitocrat in the same chamber.",
    "Balances elitism of active-only voting with broader delegated input."
  ],
  [delegation, quorum, governance],
  ["quorum_of_vote", "quorum_of_attention", "liquid_democracy"],
  ["Non-active members delegate to active ones; delegated votes count in chamber stage, not in pools."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  25,
  "veto_rights",
  "Veto rights",
  governance,
  "Temporary, breakable veto held by Citizens; 66.6% + 1 veto sends a proposal back for two weeks (max twice).",
  [
    "Veto power is distributed to all Citizens.",
    "If 66.6% + 1 veto, the proposal returns for 2 weeks; can be vetoed twice; third approval cannot be vetoed.",
    "Acts as deterrence against majority mistakes or attacks."
  ],
  [veto, governance, deterrence, lcm],
  ["quorum_of_vote", "constant_deterrence"],
  ["If vetoed twice, a third approval is final with no further veto allowed."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  26,
  "cognitocratic_measure",
  "Cognitocratic Measure (CM)",
  governance,
  "Subjective numeric score received when a proposal is accepted; voters input a score (e.g., 1–10) that averages into CM.",
  [
    "Assigned to a cognitocrat when a chamber accepts their proposal.",
    "Voters supply a numeric score; the average becomes the CM for that proposal.",
    "Intended to signal perceived contribution size; does not directly grant mandate power."
  ],
  [cm, score, contribution, governance],
  ["cognitocratic_measure_multiplier", "lcm", "mcm", "acm"],
  ["A proposal passes with an average score of 8 → proposer receives CM=8."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  27,
  "cognitocratic_measure_multiplier",
  "Cognitocratic Measure multiplier",
  governance,
  "Chamber-specific multiplier to normalize CM across specializations; set collectively by cognitocrats outside that chamber.",
  [
    "Each chamber has a multiplier to weight CM from that specialization.",
    "Average multiplier is set by all cognitocrats who have not received LCM in that chamber.",
    "Prevents direct comparison of raw CM across differing fields."
  ],
  [cm, multiplier, chamber, weighting],
  ["cognitocratic_measure", "lcm", "mcm", "acm"],
  ["Philosophy chamber multiplier 3 vs Finance chamber multiplier 5; same CM scales differently."],
  [cm],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  28,
  "lcm",
  "Local Cognitocratic Measure (LCM)",
  governance,
  "CM accrued within a specific chamber before applying that chamber’s multiplier.",
  [
    "Represents contribution within a single chamber.",
    "Used as input to calculate MCM and ACM."
  ],
  [cm, lcm, chamber],
  ["mcm", "acm", "cognitocratic_measure_multiplier"],
  ["5 LCM in Philosophy and 10 LCM in Finance before weighting."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  29,
  "mcm",
  "Multiplied Cognitocratic Measure (MCM)",
  governance,
  "LCM multiplied by its chamber’s multiplier.",
  [
    "Adjusts LCM by the chamber’s multiplier to reflect specialization value.",
    "Feeds into ACM."
  ],
  [cm, mcm, chamber, multiplier],
  ["lcm", "acm", "cognitocratic_measure_multiplier"],
  ["LCM 5 in Philosophy × multiplier 3 = 15 MCM."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  30,
  "acm",
  "Absolute Cognitocratic Measure (ACM)",
  governance,
  "Sum of all MCMs across chambers: ACM = Σ(LCM_chamber × Multiplier_chamber).",
  [
    "Aggregates contribution across all chambers after applying multipliers.",
    "Used to compare overall perceived contribution of a cognitocrat."
  ],
  [cm, acm, aggregate, governance],
  ["lcm", "mcm", "cognitocratic_measure_multiplier"],
  ["Example: (3 LCM in Philosophy ×3) + (10 LCM in Finance ×5) = 65 ACM."],
  [cm, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  31,
  "multiplier_setting",
  "Multiplier setting process",
  governance,
  "Cognitocrats set a 1–100 multiplier for chambers where they have no LCM; the average becomes the chamber multiplier.",
  [
    "Each cognitocrat can vote a multiplier (1–100) for chambers in which they hold no LCM.",
    "Average of submissions becomes the chamber’s multiplier.",
    "If a cognitocrat holds LCM in multiple chambers, they are locked out from setting multipliers in those chambers."
  ],
  [process, cm, multiplier, chamber],
  ["cognitocratic_measure_multiplier", "lcm", "acm"],
  ["A cognitocrat without LCM in Finance submits 70; combined with others sets Finance’s multiplier."],
  [cm],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  32,
  "meritocratic_measure",
  "Meritocratic Measure (MM)",
  formation,
  "Score awarded for participation and delivery in Formation projects; governors rate milestones and contributors.",
  [
    "Earned through contribution to Formation project milestones.",
    "Rated by governors when milestones are delivered.",
    "Signals execution merit separate from chamber governance CM."
  ],
  [mm, formation, merit, milestones, rating],
  ["formation", "formation_project", "cognitocratic_measure"],
  ["A contributor receives MM based on governor ratings after a milestone delivery."],
  [formation],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Formation – Meritocratic Measure",
  "2025-12-04"
).

vortex_term(
  33,
  "proposition_rights",
  "Proposition rights",
  governance,
  "Tier-based rights to make/promote proposals; tiers derive from PoT, PoD, PoG and do not change voting power.",
  [
    "Tiers are based on Proof-of-Time, Proof-of-Devotion, and Proof-of-Governance.",
    "Higher tiers unlock additional proposal types but do not add voting power."
  ],
  [proposals, tiers, rights, governance],
  ["proof_of_time_pot", "proof_of_devotion_pod", "proof_of_governance_pog", "tier1_nominee", "tier2_ecclesiast", "tier3_legate", "tier4_consul", "tier5_citizen"],
  ["Tier progression unlocks proposal types without changing vote weight."],
  [chamber, pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights",
  "2025-12-04"
).

vortex_term(
  34,
  "governing_era",
  "Governing era",
  governance,
  "168-epoch (~1 month) period; a governor stays active by running a node 164/168 epochs and meeting action thresholds.",
  [
    "Era = 168 epochs; each epoch is ~4 hours.",
    "Active if bioauthenticated and node ran 164/168 epochs and required actions met in previous era.",
    "Required actions include voting/upvoting/downvoting proposals or chamber votes."
  ],
  [era, quorum, activity, governance],
  ["governor", "proof_of_governance_pog"],
  ["Passing era action threshold keeps a governor counted in quorums next era."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights",
  "2025-12-04"
).

vortex_term(
  35,
  "proof_of_time_pot",
  "Proof-of-Time (PoT)",
  governance,
  "Longevity of being a human node and a governor; contributes to tier progression.",
  [
    "Tracks how long a human node and governor have been active.",
    "Used for tier progression and proposal rights."
  ],
  [proof, time, longevity, tier],
  ["proof_of_devotion_pod", "proof_of_governance_pog"],
  ["Longer node/governor uptime supports higher tiers."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Proof types",
  "2025-12-04"
).

vortex_term(
  36,
  "proof_of_devotion_pod",
  "Proof-of-Devotion (PoD)",
  governance,
  "Contribution via proposal approval in Vortex and participation in Formation projects.",
  [
    "Counts accepted proposals in Vortex.",
    "Counts participation in Formation projects."
  ],
  [proof, devotion, proposals, formation, tier],
  ["proof_of_time_pot", "proof_of_governance_pog"],
  ["Accepted proposal + Formation participation advance PoD."],
  [global, formation],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Proof types",
  "2025-12-04"
).

vortex_term(
  37,
  "proof_of_governance_pog",
  "Proof-of-Governance (PoG)",
  governance,
  "Measures active governing streak and era actions to stay counted in quorums.",
  [
    "Longevity of being an active governor.",
    "Maintaining active governing status through required actions."
  ],
  [proof, governance, quorum, tier],
  ["proof_of_time_pot", "proof_of_devotion_pod", "governing_era"],
  ["Complete era action thresholds to retain active governor status."],
  [global, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Proof types",
  "2025-12-04"
).

vortex_term(
  38,
  "tier1_nominee",
  "Tier 1 · Nominee",
  governance,
  "Entry tier: human node seeking voting rights; can join Formation and propose most items except restricted categories.",
  [
    "Requirements: Run a node.",
    "New actions: Make any proposal excluding fee distribution, monetary system, core infrastructure, administrative, DAO core; participate in Formation; start earning longevity as governor."
  ],
  [tier, nominee, governance],
  ["proof_of_time_pot", "proof_of_devotion_pod"],
  ["Nominee can propose general items and join Formation but has no vote yet."],
  [pool, formation],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Tiers",
  "2025-12-04"
).

vortex_term(
  39,
  "tier2_ecclesiast",
  "Tier 2 · Ecclesiast",
  governance,
  "Unlocked when a nominee’s proposal is accepted; enables fee distribution and monetary modification proposals.",
  [
    "Requirements: Run a node; have a proposal accepted in Vortex.",
    "New available proposal types: Fee distribution; Monetary modification."
  ],
  [tier, ecclesiast, governance],
  ["proof_of_time_pot", "proof_of_devotion_pod"],
  ["Ecclesiast can propose fee splits or monetary changes after first accepted proposal."],
  [chamber, pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Tiers",
  "2025-12-04"
).

vortex_term(
  40,
  "tier3_legate",
  "Tier 3 · Legate",
  governance,
  "Requires 1 year node + active governor, accepted proposal, and Formation participation; unlocks core infrastructure changes.",
  [
    "Requirements: Run a node for 1 year; be an active governor for 1 year; have a proposal accepted; participate in Formation.",
    "New available proposal types: Core infrastructure changes (e.g., cryptobiometrics, CVM control, delegation mechanics)."
  ],
  [tier, legate, governance],
  ["proof_of_time_pot", "proof_of_devotion_pod", "proof_of_governance_pog"],
  ["Legate can propose core infrastructure changes after sustained activity and Formation work."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Tiers",
  "2025-12-04"
).

vortex_term(
  41,
  "tier4_consul",
  "Tier 4 · Consul",
  governance,
  "Requires 2 years node + active governor, accepted proposal, Formation participation; unlocks administrative proposals.",
  [
    "Requirements: Run a node for 2 years; be an active governor for 2 years; have a proposal accepted; participate in Formation.",
    "New available proposal types: Administrative (e.g., human node types, governor tiers, Formation procedures)."
  ],
  [tier, consul, governance],
  ["proof_of_time_pot", "proof_of_devotion_pod", "proof_of_governance_pog"],
  ["Consul can propose administrative changes after 2-year tenure and Formation work."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Tiers",
  "2025-12-04"
).

vortex_term(
  42,
  "tier5_citizen",
  "Tier 5 · Citizen",
  governance,
  "Highest tier with unrestricted proposition rights (DAO core); requires long tenure and active governance.",
  [
    "Requirements: Run a node for 4 years; be a governor for 4 years; be an active governor for 3 years; have a proposal accepted; participate in Formation.",
    "New available proposal types: DAO core (e.g., proposal system values, voting protocol, human node/governor types)."
  ],
  [tier, citizen, governance],
  ["proof_of_time_pot", "proof_of_devotion_pod", "proof_of_governance_pog"],
  ["Citizen tier can propose DAO core changes after long-term tenure and activity."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights – Tiers",
  "2025-12-04"
).

vortex_term(
  43,
  "gradual_decentralization",
  "Gradual decentralization",
  governance,
  "Humanode core designs and bootstraps Vortex/Formation, aiming for transparent, decentralized governance driven by active governors.",
  [
    "Core promotes transparency, builds decentralized governing processes, participates in community, and drafts proposals.",
    "Governance stack combines proposal pools, chambers, and Formation with PoT/PoD/PoH safeguards."
  ],
  [decentralization, governance, transparency],
  ["voter_apathy"],
  ["Core designs the stack but expects governors to drive decisions as decentralization grows."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Discussion",
  "2025-12-04"
).

vortex_term(
  44,
  "voter_apathy",
  "Voter apathy",
  governance,
  "Low participation can stall governance; Vortex addresses apathy by requiring activity to stay governor and counting only active governors toward quorum.",
  [
    "Apathy can block quorums and delay decisions.",
    "Governors must meet monthly action thresholds or revert to non-governing.",
    "Quorum (33%) counts only active governors; non-participants are excluded."
  ],
  [apathy, quorum, governance],
  ["gradual_decentralization", "quorum_of_vote"],
  ["Inactivity drops governor status; only active participants count toward quorum."],
  [chamber, pool],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Discussion",
  "2025-12-04"
).

vortex_term(
  45,
  "iron_law_of_oligarchy",
  "Iron law of oligarchy",
  governance,
  "Any organization tends toward elite control; Vortex counters via equal vote power, intellectual barriers, and delegation transparency.",
  [
    "Acknowledges inevitability of leadership classes; seeks balance between efficiency and democratic involvement.",
    "Combines equal voting power, intellectual barriers, and active quorum/delegation to limit oligarchic capture."
  ],
  [oligarchy, governance, deterrence],
  ["plutocracy_risk", "cognitocratic_populism"],
  ["Equal votes plus tiers/intellectual barriers aim to temper oligarchic drift."],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Discussion",
  "2025-12-04"
).

vortex_term(
  46,
  "plutocracy_risk",
  "Plutocracy risk",
  governance,
  "Risk of capital holders influencing decisions; mitigated by no elections, equal vote power, and proposal merit barriers.",
  [
    "No elections or variable vote weights; all governors have equal vote power.",
    "Proposals must be accepted on merit, reducing impact of pure capital/media influence."
  ],
  [plutocracy, governance, risk],
  ["iron_law_of_oligarchy"],
  ["Capital alone cannot buy vote weight; proposals need specialist acceptance."],
  [global, chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Discussion",
  "2025-12-04"
).

vortex_term(
  47,
  "cognitocratic_populism",
  "Cognitocratic populism",
  governance,
  "Populist influence is dampened by specialist voting and proof barriers; liquid delegation still allows crowd support.",
  [
    "Specialist-only voting and proposal acceptance reduce mass populist sway.",
    "Delegation remains liquid, so popular governors can accumulate delegations."
  ],
  [populism, governance, delegation],
  ["proof_of_devotion_pod"],
  ["Populists must appeal to cognitocrats, not the mass public, to gain delegations."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Discussion",
  "2025-12-04"
).

vortex_term(
  48,
  "cognitocratic_drain",
  "Cognitocratic drain",
  governance,
  "State where a chamber’s innovation slows, risking lowered admission barriers, impractical proposals, or cartelization.",
  [
    "Too much implemented innovation can raise barriers to new creative proposals.",
    "Risks: lowered standards, non-practical proposals, or chamber cartelization.",
    "Mitigation: dissolve or merge chambers if innovation throughput drops."
  ],
  [drain, chamber, innovation, governance],
  ["specialization_chamber", "chamber_dissolution"],
  ["Merge or dissolve an SC if it stagnates and lowers its admission quality."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Discussion",
  "2025-12-04"
).

vortex_term(
  49,
  "chamber_vote",
  "Chamber vote",
  governance,
  "Stage where governors cast binding votes on proposals that cleared proposal pools; requires quorum and a passing threshold.",
  [
    "Proposals reaching attention quorum in a proposal pool advance to a chamber vote.",
    "Chamber voting counts delegations and requires a voting quorum (e.g., 33.3% of active governors).",
    "Passing typically needs ≥66.6% + 1 yes vote within quorum."
  ],
  [vote, chamber, quorum, governance],
  ["proposal_pools", "quorum_of_vote", "quorum_of_attention", "delegation_policy"],
  ["A proposal that met pool attention quorum proceeds to chamber vote; if 66.6% + 1 yes within quorum, it passes."],
  [chamber],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Voting, Delegation and Quorum",
  "2025-12-04"
).

vortex_term(
  50,
  "governing_threshold",
  "Governing threshold",
  governance,
  "Action quota a governor must meet each era (e.g., votes/upvotes) plus node uptime to remain active for the next era’s quorums.",
  [
    "A governor is active if bioauthenticated, node ran 164/168 epochs, and required actions were met in the previous era.",
    "Required actions per era include upvoting/downvoting proposals or voting on chamber proposals in Vortex.",
    "Meeting the threshold keeps the governor eligible to be counted in quorums for the upcoming era."
  ],
  [threshold, quorum, activity, governor],
  ["governing_era", "governor", "quorum_of_vote", "quorum_of_attention"],
  [
    "If the action threshold is met and uptime is 164/168 epochs, the governor is counted as active in the next era’s quorum."
  ],
  [global],
  [link{label:"Docs", url:"https://gitbook.humanode.io/vortex-1.0"}],
  "Proposition rights",
  "2025-12-04"
).

% ---
% You can add a search helper later (e.g., search_terms/3) to return dicts/JSON.
