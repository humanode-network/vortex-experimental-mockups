(() => {
  if (document.body.dataset.page !== "chamber-detail") return;

  const proposals = [
    {
      id: "p-103",
      name: "Orbital Mesh Sequencer Upgrade",
      lead: "Mozgiii",
      stage: "upcoming",
      window: "Starts in 2h",
    },
    {
      id: "p-104",
      name: "Adaptive Fee Shaping",
      lead: "Victor",
      stage: "live",
      window: "Ends in 2h 15m",
    },
    {
      id: "p-105",
      name: "VM Verifier Optimization",
      lead: "Sesh",
      stage: "ended",
      window: "Closed 5h ago",
    },
  ];

  const governors = [
    "Mozgiii",
    "Victor",
    "Sesh",
    "Tony",
    "Dima",
    "Shannon",
    "Sasha",
    "Peter",
  ];

  const proposalContainer = document.querySelector("[data-chamber-proposals]");
  const stageButtons = document.querySelectorAll("[data-stage-filter]");

  const renderProposals = (stage) => {
    if (!proposalContainer) return;
    const items = proposals.filter((p) => p.stage === stage);
    proposalContainer.innerHTML =
      items
        .map(
          (item) => `
        <article class="proposal-card">
          <div>
            <strong>${item.name}</strong>
            <p>${item.lead} · ${item.stage.toUpperCase()}</p>
          </div>
          <footer>
            <span>${item.window}</span>
            <a href="#" class="chamber-link">Open</a>
          </footer>
        </article>`,
        )
        .join("") || "<p>No proposals in this stage.</p>";
  };

  stageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      stageButtons.forEach((btn) => btn.classList.remove("chip--active"));
      button.classList.add("chip--active");
      renderProposals(button.dataset.stageFilter);
    });
  });

  renderProposals("upcoming");

  const governorList = document.querySelector("[data-governor-list]");
  const governorSearch = document.querySelector("[data-governor-search]");

  const renderGovernors = (query = "") => {
    if (!governorList) return;
    const filtered = governors.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase()),
    );
    governorList.innerHTML =
      filtered
        .map(
          (name) => `
        <li class="governor-item">
          <span>${name}</span>
          <a href="human-nodes.html#${name}" class="chamber-link">Profile</a>
        </li>`,
        )
        .join("") || '<li class="governor-item">No governors found</li>';
  };

  governorSearch?.addEventListener("input", (event) => {
    renderGovernors(event.target.value);
  });

  renderGovernors();
})();
