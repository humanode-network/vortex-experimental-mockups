(() => {
  if (document.body.dataset.page !== "human-nodes") return;

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
  const resultsContainer = document.querySelector("[data-results]");
  const resultsCount = document.querySelector("[data-results-count]");
  const resultsToggle = document.querySelector("[data-results-toggle]");

  const renderResults = () => {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = searchResults
      .map((entry) => {
        const data = profileData[entry.id];
        const name = data?.name || entry.id;
        const chamber = entry.chamber || data?.chambers || "Chamber";
        return `
          <button class="search-result" data-profile-target="${entry.id}">
            <div class="search-result__head">
              <div>
                <strong>${name}</strong>
                <span>${entry.tier} · ${chamber}</span>
              </div>
              <span class="metric-badge">ACM ${data?.cscore || "—"}</span>
            </div>
            <div class="search-result__meta">
              <span>Focus: ${entry.focus}</span>
              <span>Delegations: ${entry.delegations}</span>
            </div>
            <ul class="search-result__stats">
              <li>C-score: ${data?.cscore || "—"}</li>
              <li>M-score: ${data?.mscore || "—"}</li>
              <li>Uptime: ${data?.nodeUptime || "—"}</li>
              <li>Chambers: ${data?.chambers || chamber}</li>
            </ul>
          </button>`;
      })
      .join("");
    if (resultsCount)
      resultsCount.textContent = `${searchResults.length} Cognitocrats`;
  };

  const goToProfile = (id = "self") => {
    window.location.href = `human-node.html?id=${encodeURIComponent(id)}`;
  };

  let resultButtons = [];
  const syncResultButtons = () => {
    resultButtons = document.querySelectorAll("[data-profile-target]");
    resultButtons.forEach((button) => {
      button.addEventListener("click", () =>
        goToProfile(button.dataset.profileTarget),
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

  renderResults();
  syncResultButtons();

  resultsToggle?.addEventListener("click", () => {
    const listView = resultsContainer?.classList.toggle(
      "search-results--listview",
    );
    resultsToggle.textContent = listView
      ? "Toggle card view"
      : "Toggle list view";
  });
})();
