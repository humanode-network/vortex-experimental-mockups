(() => {
  if (document.body.dataset.page !== "formation") return;

  const projects = [
    {
      id: "orbital-mesh",
      name: "Orbital Mesh Sequencer Upgrade",
      stage: "live",
      stageLabel: "Live · Build milestone 2 / 4",
      category: "development",
      chamber: "Protocol Engineering",
      focus: "Sequencer redundancy",
      summary:
        "Redundant biometric sequencers that drop latency across the verification pathway and harden failover coverage.",
      hmndAllocated: 210000,
      team: { filled: 4, total: 6 },
      milestones: { delivered: 2, total: 4, next: "Era 413.18" },
      extra: { label: "Next checkpoint", value: "Failover tests · Era 413.18" },
      proposer: { name: "Mozgiii", id: "mozgiii" },
      link: "proposals.html#orbital-mesh",
    },
    {
      id: "sybilguard-l2",
      name: "SybilGuard L2 Mirror",
      stage: "live",
      stageLabel: "Live · Milestone 2 / 4",
      category: "development",
      chamber: "Security & Infra",
      focus: "Sybil defense rollup",
      summary:
        "Auxiliary rollup that publishes Humanode anti-Sybil heuristics for partner DAOs to subscribe to.",
      hmndAllocated: 420000,
      team: { filled: 5, total: 7 },
      milestones: { delivered: 2, total: 4, next: "Era 413.24" },
      extra: { label: "Next checkpoint", value: "Bridge audit · Era 413.24" },
      proposer: { name: "Dima", id: "dima" },
      link: "proposals.html#sybilguard",
    },
    {
      id: "treasury-simulator",
      name: "Treasury Stress Simulator",
      stage: "upcoming",
      stageLabel: "Upcoming · Kickoff scheduled",
      category: "research",
      chamber: "Economics",
      focus: "Dynamic treasury modeling",
      summary:
        "Agent-based simulator that maps fee splits, validator incentives, and GC fee modulation.",
      hmndAllocated: 160000,
      team: { filled: 3, total: 5 },
      milestones: { delivered: 0, total: 3, next: "Era 414.03" },
      extra: { label: "Kickoff window", value: "Era 414.03" },
      proposer: { name: "Victor", id: "victor" },
      link: "proposals.html#treasury-simulator",
    },
    {
      id: "multimodal-lab",
      name: "Multimodal Biometrics Lab",
      stage: "live",
      stageLabel: "Live · Experiment set 3 / 5",
      category: "research",
      chamber: "Research Loop",
      focus: "Proof-of-Genuine primitives",
      summary:
        "Open lab validating heartbeat + EMG fusion for stronger Proof-of-Time attestations.",
      hmndAllocated: 180000,
      team: { filled: 5, total: 6 },
      milestones: { delivered: 3, total: 5, next: "Era 413.14" },
      extra: { label: "Current study", value: "Noise tolerance v3" },
      proposer: { name: "Sesh", id: "sesh" },
      link: "proposals.html#multimodal-lab",
    },
    {
      id: "liveness-outreach",
      name: "Liveness Outreach Collective",
      stage: "live",
      stageLabel: "Live · Community delivery",
      category: "social",
      chamber: "Social Impact",
      focus: "Human-node onboarding",
      summary:
        "Regional workshops and biometric tune-ups to keep the human-node set quorum-ready.",
      hmndAllocated: 60000,
      team: { filled: 6, total: 8 },
      milestones: { delivered: 1, total: 3, next: "Era 413.10" },
      extra: { label: "Attention target", value: "40 hubs engaged" },
      proposer: { name: "Tony", id: "tony" },
      link: "proposals.html#liveness-outreach",
    },
    {
      id: "compliance-charter",
      name: "Compliance Charter Automation",
      stage: "completed",
      stageLabel: "Completed · Audited",
      category: "social",
      chamber: "Compliance",
      focus: "On-chain charter enforcement",
      summary:
        "Automated quorum findings that trigger GC playbooks with verifiable attestations.",
      hmndAllocated: 90000,
      team: { filled: 4, total: 4 },
      milestones: { delivered: 3, total: 3, next: "Era 412.09" },
      extra: { label: "Completion", value: "Era 412.09" },
      proposer: { name: "Shannon", id: "shannon" },
      link: "proposals.html#compliance-charter",
    },
    {
      id: "validator-hardening",
      name: "Validator Hardening Kit",
      stage: "upcoming",
      stageLabel: "Upcoming · Assembly",
      category: "development",
      chamber: "Security & Infra",
      focus: "Validator defense",
      summary:
        "Ready-to-run configs and fault drills to keep deterministic validator fleets online.",
      hmndAllocated: 130000,
      team: { filled: 2, total: 6 },
      milestones: { delivered: 0, total: 4, next: "Era 413.30" },
      extra: { label: "Team slots", value: "4 contributors open" },
      proposer: { name: "Sasha", id: "sasha" },
      link: "proposals.html#validator-hardening",
    },
  ];

  projects.forEach((project) => {
    project.searchIndex = [
      project.name,
      project.stageLabel,
      project.summary,
      project.focus,
      project.chamber,
      project.category,
      project.proposer.name,
    ]
      .join(" ")
      .toLowerCase();
  });

  const list = document.querySelector("[data-formation-list]");
  const filterButtons = document.querySelectorAll("[data-formation-filter]");
  const searchInput = document.querySelector("[data-formation-search]");
  const clearButton = document.querySelector("[data-formation-search-clear]");
  const metricHmnd = document.querySelector("[data-metric-hmnd]");
  const metricActive = document.querySelector("[data-metric-active]");
  const metricSlots = document.querySelector("[data-metric-slots]");
  const metricMilestones = document.querySelector("[data-metric-milestones]");

  let activeFilter = "all";
  let searchTerm = "";

  const formatHmnd = (value) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M HMND`;
    }
    if (value >= 1_000) {
      return `${Math.round(value / 1_000)}k HMND`;
    }
    return `${value.toLocaleString()} HMND`;
  };

  const updateMetrics = () => {
    const totals = projects.reduce(
      (acc, project) => {
        acc.hmnd += project.hmndAllocated;
        if (project.stage !== "completed") acc.active += 1;
        acc.slots += Math.max(project.team.total - project.team.filled, 0);
        acc.milestones += project.milestones.delivered;
        return acc;
      },
      { hmnd: 0, active: 0, slots: 0, milestones: 0 },
    );

    if (metricHmnd) metricHmnd.textContent = formatHmnd(totals.hmnd);
    if (metricActive) metricActive.textContent = totals.active;
    if (metricSlots) metricSlots.textContent = totals.slots;
    if (metricMilestones) metricMilestones.textContent = totals.milestones;
  };

  const getFilteredProjects = () =>
    projects.filter((project) => {
      const matchesCategory =
        activeFilter === "all" || project.category === activeFilter;
      const matchesSearch =
        !searchTerm || project.searchIndex.includes(searchTerm);
      return matchesCategory && matchesSearch;
    });

  const renderProjects = () => {
    if (!list) return;
    list.innerHTML = "";

    const filtered = getFilteredProjects();
    filtered.forEach((project) => {
      const openSlots = Math.max(project.team.total - project.team.filled, 0);
      const stats = [
        {
          label: "HMND allocation",
          value: formatHmnd(project.hmndAllocated),
          sub: "Budget secured",
        },
        {
          label: "Team slots",
          value: `${project.team.filled} / ${project.team.total}`,
          sub: openSlots > 0 ? `${openSlots} open` : "Fully staffed",
        },
        {
          label: "Milestones",
          value: `${project.milestones.delivered} / ${project.milestones.total}`,
          sub: project.milestones.next
            ? `Next: ${project.milestones.next}`
            : "No pending milestone",
        },
        {
          label: project.extra.label,
          value: project.extra.value,
          sub: project.stage === "completed" ? "Logged" : "Watchpoint",
        },
      ];

      const statsMarkup = stats
        .map(
          (stat) => `
          <li>
            <span>${stat.label}</span>
            <strong>${stat.value}</strong>
            ${stat.sub ? `<small>${stat.sub}</small>` : ""}
          </li>
        `,
        )
        .join("");

      const card = document.createElement("article");
      card.className = "formation-card";
      card.dataset.stage = project.stage;
      card.dataset.category = project.category;
      card.innerHTML = `
        <div class="formation-card__head">
          <span class="formation-card__stage">${project.stageLabel}</span>
          <h3 class="formation-card__title">${project.name}</h3>
          <p class="formation-card__meta">${project.chamber} · ${project.focus}</p>
          <p class="formation-card__summary">${project.summary}</p>
        </div>
        <ul class="formation-card__stats">
          ${statsMarkup}
        </ul>
        <div class="formation-card__footer">
          <p class="formation-card__proposer">
            Proposer
            <a href="human-nodes.html#${project.proposer.id}">${project.proposer.name}</a>
          </p>
          <a class="formation-card__link" href="${project.link}">
            Open project →
          </a>
        </div>
      `;
      list.appendChild(card);
    });
  };

  const setActiveFilter = (value) => {
    activeFilter = value;
    filterButtons.forEach((button) =>
      button.classList.toggle(
        "chip--active",
        button.dataset.formationFilter === value,
      ),
    );
    renderProjects();
  };

  const toggleClearButton = () => {
    if (!clearButton) return;
    clearButton.hidden = !searchTerm.length;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveFilter(button.dataset.formationFilter || "all");
    });
  });

  searchInput?.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    toggleClearButton();
    renderProjects();
  });

  clearButton?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    searchTerm = "";
    toggleClearButton();
    renderProjects();
    searchInput.focus();
  });

  updateMetrics();
  renderProjects();
  toggleClearButton();
})();
