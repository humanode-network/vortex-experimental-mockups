(() => {
  if (document.body.dataset.page !== "human-nodes") return;

  const searchPanel = document.querySelector("[data-search-panel]");
  const searchToggle = document.querySelector("[data-search-toggle]");
  const searchBody =
    searchPanel?.querySelector("[data-search-body]") ||
    searchPanel?.querySelector(".search-panel__body");
  const searchLabel = searchPanel?.querySelector("[data-search-label]");
  const searchHint =
    searchPanel?.querySelector("[data-search-hint]") ||
    searchPanel?.querySelector(".search-panel__hint");

  const applySearchState = (open) => {
    if (!searchPanel || !searchToggle || !searchBody) return;
    searchPanel.classList.toggle("search-panel--open", open);
    searchBody.hidden = !open;
    searchToggle.setAttribute("aria-expanded", String(open));
    if (searchLabel)
      searchLabel.textContent = open ? "Hide search" : "Open search";
    if (searchHint) searchHint.textContent = open ? "Expanded" : "Collapsed";
  };

  searchToggle?.addEventListener("click", () => {
    const next = !searchPanel.classList.contains("search-panel--open");
    applySearchState(next);
  });
  applySearchState(false);

  const profileData = {
    self: {
      name: "My Human node",
      tier: "Legate",
      status: "Active human node",
      address: "0x91a4…de01",
      faction: "Protocol Engineering",
      cscore: "86 / 100",
      mscore: "74 / 100",
      nodeUptime: "3y 5m",
      govTenure: "2y 7m",
      activeNode: "Yes",
      acceptedProposals: "11",
      chambers: "Protocol Engineering, Security",
      formationProjects: "3",
      currentProjects: "Orbital Mesh, SybilGuard",
      activeStreak: "21 eras",
      activeNow: "Yes",
      quorum: "97%",
    },
    mozgiii: {
      name: "Mozgiii",
      tier: "Citizen",
      status: "Active human node",
      address: "0xmoz…77a",
      faction: "Protocol Keepers · Research Loop",
      cscore: "92 / 100",
      mscore: "88 / 100",
      nodeUptime: "4y 1m",
      govTenure: "3y 8m",
      activeNode: "Yes",
      acceptedProposals: "11",
      chambers: "Protocol Engineering, Research",
      formationProjects: "4",
      currentProjects: "Multimodal Biometrics, Treasury Simulator",
      activeStreak: "34 eras",
      activeNow: "Yes",
      quorum: "99%",
    },
    victor: {
      name: "Victor",
      tier: "Consul",
      status: "Active human node",
      address: "0xvic…a3c",
      faction: "Treasury Circle",
      cscore: "88 / 100",
      mscore: "91 / 100",
      nodeUptime: "3y 9m",
      govTenure: "3y 0m",
      activeNode: "Yes",
      acceptedProposals: "7",
      chambers: "Economics, Treasury",
      formationProjects: "2",
      currentProjects: "Adaptive Fees, Vault Ops",
      activeStreak: "29 eras",
      activeNow: "Yes",
      quorum: "96%",
    },
    dima: {
      name: "Dima",
      tier: "Legate",
      status: "Active human node",
      address: "0xdim…42e",
      faction: "Nodewrights",
      cscore: "74 / 100",
      mscore: "88 / 100",
      nodeUptime: "3y 2m",
      govTenure: "2y 4m",
      activeNode: "Yes",
      acceptedProposals: "5",
      chambers: "Protocol Engineering",
      formationProjects: "2",
      currentProjects: "Monitoring Kit",
      activeStreak: "23 eras",
      activeNow: "Yes",
      quorum: "93%",
    },
    tony: {
      name: "Tony",
      tier: "Tribune",
      status: "Active human node",
      address: "0xton…5a2",
      faction: "Outreach Guild",
      cscore: "68 / 100",
      mscore: "80 / 100",
      nodeUptime: "2y 7m",
      govTenure: "1y 6m",
      activeNode: "Yes",
      acceptedProposals: "3",
      chambers: "Social, Education",
      formationProjects: "2",
      currentProjects: "Mentorship Collective",
      activeStreak: "14 eras",
      activeNow: "Yes",
      quorum: "88%",
    },
    sesh: {
      name: "Sesh",
      tier: "Citizen",
      status: "Active human node",
      address: "0xses…901",
      faction: "Research Loop",
      cscore: "95 / 100",
      mscore: "94 / 100",
      nodeUptime: "4y 3m",
      govTenure: "3y 10m",
      activeNode: "Yes",
      acceptedProposals: "14",
      chambers: "Research, General",
      formationProjects: "5",
      currentProjects: "Liveness Audits",
      activeStreak: "37 eras",
      activeNow: "Yes",
      quorum: "99%",
    },
    peter: {
      name: "Peter",
      tier: "Consul",
      status: "Active human node",
      address: "0xpet…c1a",
      faction: "Logistics Core",
      cscore: "82 / 100",
      mscore: "86 / 100",
      nodeUptime: "3y 7m",
      govTenure: "2y 9m",
      activeNode: "Yes",
      acceptedProposals: "9",
      chambers: "Formation Logistics",
      formationProjects: "4",
      currentProjects: "Treasury Simulator, Monitoring Kit",
      activeStreak: "25 eras",
      activeNow: "Yes",
      quorum: "95%",
    },
    shannon: {
      name: "Shannon",
      tier: "Legate",
      status: "Active human node",
      address: "0xsha…bb4",
      faction: "Guardian Forum",
      cscore: "76 / 100",
      mscore: "90 / 100",
      nodeUptime: "3y 1m",
      govTenure: "2y 2m",
      activeNode: "Yes",
      acceptedProposals: "6",
      chambers: "Compliance",
      formationProjects: "2",
      currentProjects: "Compliance Charter, Treasury Audit",
      activeStreak: "21 eras",
      activeNow: "Yes",
      quorum: "94%",
    },
    sasha: {
      name: "Sasha",
      tier: "Tribune",
      status: "Active human node",
      address: "0xsa…21f",
      faction: "Deterrence Watch",
      cscore: "70 / 100",
      mscore: "82 / 100",
      nodeUptime: "2y 6m",
      govTenure: "1y 5m",
      activeNode: "Yes",
      acceptedProposals: "4",
      chambers: "Security",
      formationProjects: "1",
      currentProjects: "Validator Hardening",
      activeStreak: "15 eras",
      activeNow: "Yes",
      quorum: "89%",
    },
  };

  const searchResults = [
    {
      id: "mozgiii",
      tier: "Citizen",
      chamber: "Protocol Engineering",
      focus: "PoT heavy",
      delegations: "41",
    },
    {
      id: "victor",
      tier: "Consul",
      chamber: "Economics",
      focus: "PoD heavy",
      delegations: "53",
    },
    {
      id: "dima",
      tier: "Legate",
      chamber: "Protocol Engineering",
      focus: "Node ops",
      delegations: "25",
    },
    {
      id: "tony",
      tier: "Tribune",
      chamber: "Social",
      focus: "Community",
      delegations: "12",
    },
    {
      id: "sesh",
      tier: "Citizen",
      chamber: "Research",
      focus: "PoG analytics",
      delegations: "47",
    },
    {
      id: "peter",
      tier: "Consul",
      chamber: "Formation Logistics",
      focus: "Formation ops",
      delegations: "32",
    },
    {
      id: "shannon",
      tier: "Legate",
      chamber: "Compliance",
      focus: "Governance",
      delegations: "22",
    },
    {
      id: "sasha",
      tier: "Tribune",
      chamber: "Security",
      focus: "Sybil defense",
      delegations: "18",
    },
  ];

  const $ = (selector) => document.querySelector(selector);
  const fields = {
    name: $("[data-profile-name]"),
    tier: $("[data-profile-tier]"),
    status: $("[data-profile-status]"),
    address: $("[data-profile-address]"),
    faction: $("[data-profile-faction]"),
    cscore: $("[data-profile-cscore]"),
    mscore: $("[data-profile-mscore]"),
    nodeUptime: $("[data-profile-node-uptime]"),
    govTenure: $("[data-profile-gov-tenure]"),
    activeNode: $("[data-profile-node-status]"),
    acceptedProposals: $("[data-profile-proposals]"),
    chambers: $("[data-profile-chambers]"),
    formationProjects: $("[data-profile-formation]"),
    currentProjects: $("[data-profile-current]"),
    activeStreak: $("[data-profile-active-streak]"),
    activeNow: $("[data-profile-active-now]"),
    quorum: $("[data-profile-quorum]"),
  };

  const resultsContainer = document.querySelector("[data-results]");
  const resultsCount = document.querySelector("[data-results-count]");
  const resetButton = document.querySelector("[data-clear-search]");

  const renderResults = () => {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = searchResults
      .map(
        (entry) => `
          <button class="search-result" data-profile-target="${entry.id}">
            <strong>${entry.id.charAt(0).toUpperCase() + entry.id.slice(1)}</strong>
            <span>${entry.tier} · ${entry.chamber}</span>
            <ul>
              <li>${entry.focus}</li>
              <li>Delegations: ${entry.delegations}</li>
            </ul>
          </button>`,
      )
      .join("");
    if (resultsCount)
      resultsCount.textContent = `${searchResults.length} Cognitocrats`;
  };

  const setField = (node, value) => {
    if (node) node.textContent = value;
  };

  let resultButtons = [];
  const syncResultButtons = () => {
    resultButtons = document.querySelectorAll("[data-profile-target]");
    resultButtons.forEach((button) => {
      button.addEventListener("click", () =>
        renderProfile(button.dataset.profileTarget),
      );
    });
  };

  const setActiveResult = (id) => {
    resultButtons.forEach((btn) => {
      btn.classList.toggle(
        "search-result--active",
        btn.dataset.profileTarget === id,
      );
    });
  };

  const renderProfile = (id = "self") => {
    const data = profileData[id] || profileData.self;
    setField(fields.name, data.name);
    setField(fields.tier, data.tier);
    setField(fields.status, data.status);
    setField(fields.address, data.address);
    setField(fields.faction, data.faction);
    setField(fields.cscore, data.cscore);
    setField(fields.mscore, data.mscore);
    setField(fields.nodeUptime, data.nodeUptime);
    setField(fields.govTenure, data.govTenure);
    setField(fields.activeNode, data.activeNode);
    setField(fields.acceptedProposals, data.acceptedProposals);
    setField(fields.chambers, data.chambers);
    setField(fields.formationProjects, data.formationProjects);
    setField(fields.currentProjects, data.currentProjects);
    setField(fields.activeStreak, data.activeStreak);
    setField(fields.activeNow, data.activeNow);
    setField(fields.quorum, data.quorum);

    if (resetButton) resetButton.hidden = id === "self";
    setActiveResult(id);
  };

  renderResults();
  syncResultButtons();
  renderProfile("self");

  resetButton?.addEventListener("click", () => renderProfile("self"));

  const tabButtons = document.querySelectorAll(".profile-tab");
  const tabPanels = document.querySelectorAll("[data-tabpanel]");

  const activateTab = (target) => {
    tabButtons.forEach((btn) => {
      const isTarget = btn.dataset.tab === target;
      btn.classList.toggle("profile-tab--active", isTarget);
    });
    tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.tabpanel !== target;
    });
  };

  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  activateTab("pot");
})();
