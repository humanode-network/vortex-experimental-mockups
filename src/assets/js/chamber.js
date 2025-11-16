(() => {
  if (document.body.dataset.page !== "chamber") return;

  const chamberProfiles = {
    "protocol-engineering": {
      eyebrow: "Protocol Engineering",
      title: "Protocol Engineering",
      meta: "Multiplier ×1.5 · 64 governors · MCM 5,480 · LCM 6,850",
      proposals: [
        {
          name: "Orbital Mesh Sequencer Upgrade",
          lead: "Mozgiii",
          stage: "upcoming",
          window: "Starts in 2h",
        },
        {
          name: "Runtime Guardrails",
          lead: "Dima",
          stage: "live",
          window: "Ends in 45m",
        },
        {
          name: "Validator Handbook",
          lead: "Tony",
          stage: "ended",
          window: "Closed 8h ago",
        },
      ],
      governors: [
        "Mozgiii",
        "Victor",
        "Sesh",
        "Tony",
        "Dima",
        "Shannon",
        "Sasha",
        "Peter",
      ],
      threads: [
        {
          title: "Sequencer redundancy rollout",
          meta: "Mozgiii · 4 replies · Updated 1h ago",
        },
        {
          title: "VM verifier benchmarks",
          meta: "Victor · 11 replies · Updated 3h ago",
        },
        {
          title: "Formation slot requests",
          meta: "Sesh · 6 replies · Updated 6h ago",
        },
      ],
      chat: [
        {
          author: "Mozgiii",
          text: "Milestone 2 patch deployed, please verify.",
        },
        { author: "Victor", text: "Treasury hook live, watching KPIs." },
        {
          author: "Sesh",
          text: "Need 2 reviewers for the new biometrics spec.",
        },
      ],
    },
    "research-cryptobiometrics": {
      eyebrow: "Research & Cryptobiometrics",
      title: "Research & Cryptobiometrics",
      meta: "Multiplier ×1.8 · 41 governors · MCM 4,120 · LCM 5,560",
      proposals: [
        {
          name: "Liveness Sentinel Retrofit",
          lead: "Sesh",
          stage: "live",
          window: "Ends in 3h",
        },
        {
          name: "ZK Attestation Pilot",
          lead: "Victor",
          stage: "upcoming",
          window: "Starts in 6h",
        },
      ],
      governors: ["Sesh", "Victor", "Mozgiii", "Shannon", "Sasha"],
      threads: [
        {
          title: "Proof-of-human existence updates",
          meta: "Sesh · 9 replies · Updated 2h ago",
        },
        {
          title: "Optic liveness benchmarks",
          meta: "Shannon · 5 replies · Updated 5h ago",
        },
      ],
      chat: [
        { author: "Sesh", text: "Publishing revised liveness proofs tonight." },
        { author: "Shannon", text: "Need eyes on the zk circuit patch." },
      ],
    },
    "treasury-economics": {
      eyebrow: "Treasury & Economics",
      title: "Treasury & Economics",
      meta: "Multiplier ×1.3 · 53 governors · MCM 3,970 · LCM 4,367",
      proposals: [
        {
          name: "Adaptive Fee Shaping",
          lead: "Victor",
          stage: "live",
          window: "Ends in 2h 15m",
        },
        {
          name: "Formation Reserve Refill",
          lead: "Peter",
          stage: "upcoming",
          window: "Starts in 10h",
        },
        {
          name: "Treasury diversification",
          lead: "Tony",
          stage: "ended",
          window: "Closed 1d ago",
        },
      ],
      governors: ["Victor", "Peter", "Tony", "Dima", "Sasha"],
      threads: [
        {
          title: "Adaptive fees testnet feedback",
          meta: "Victor · 7 replies · Updated 30m ago",
        },
        {
          title: "Budget rollovers",
          meta: "Peter · 3 replies · Updated 4h ago",
        },
      ],
      chat: [
        { author: "Victor", text: "Fee vote trending 62% yes." },
        { author: "Peter", text: "Reserve proposal doc uploaded." },
      ],
    },
    "formation-logistics": {
      eyebrow: "Formation Logistics",
      title: "Formation Logistics",
      meta: "Multiplier ×1.2 · 32 governors · MCM 2,210 · LCM 2,320",
      proposals: [
        {
          name: "Mesh Talent Onboarding Fund",
          lead: "Tony",
          stage: "upcoming",
          window: "Starts in 4h",
        },
        {
          name: "Grant Ops Automation",
          lead: "Peter",
          stage: "live",
          window: "Ends in 1d",
        },
      ],
      governors: ["Tony", "Peter", "Sasha", "Shannon"],
      threads: [
        {
          title: "Talent onboarding queue",
          meta: "Tony · 12 replies · Updated 1h ago",
        },
      ],
      chat: [{ author: "Tony", text: "Need mentors for batch #12." }],
    },
    "social-outreach": {
      eyebrow: "Social Outreach",
      title: "Social Outreach",
      meta: "Multiplier ×1.1 · 28 governors · MCM 1,720 · LCM 1,892",
      proposals: [
        {
          name: "Community Grants Wave",
          lead: "Sasha",
          stage: "live",
          window: "Ends in 12h",
        },
      ],
      governors: ["Sasha", "Tony", "Peter"],
      threads: [
        {
          title: "Ambassador rollout",
          meta: "Sasha · 4 replies · Updated 2h ago",
        },
      ],
      chat: [{ author: "Sasha", text: "Need feedback on the AMA deck." }],
    },
    "security-council": {
      eyebrow: "Security",
      title: "Security & Deterrence",
      meta: "Multiplier ×1.7 · 66 governors · MCM 4,930 · LCM 6,409",
      proposals: [
        {
          name: "Liveness Sentinel Retrofit",
          lead: "Shannon",
          stage: "live",
          window: "Ends in 5h",
        },
        {
          name: "Validator Hardening",
          lead: "Sasha",
          stage: "ended",
          window: "Closed 6h ago",
        },
      ],
      governors: ["Shannon", "Sasha", "Mozgiii", "Victor"],
      threads: [
        {
          title: "Deterrence drill recap",
          meta: "Shannon · 8 replies · Updated 3h ago",
        },
      ],
      chat: [
        { author: "Shannon", text: "Drill complete, uploading report." },
        { author: "Sasha", text: "Cross-check validator list." },
      ],
    },
  };

  const params = new URLSearchParams(window.location.search);
  const key = params.get("chamber") || "protocol-engineering";
  const chamber =
    chamberProfiles[key] || chamberProfiles["protocol-engineering"];

  const eyebrowEl = document.querySelector("[data-chamber-eyebrow]");
  const titleEl = document.querySelector("[data-chamber-title]");
  const metaEl = document.querySelector("[data-chamber-meta]");

  if (eyebrowEl) eyebrowEl.textContent = chamber.eyebrow;
  if (titleEl) titleEl.textContent = chamber.title;
  if (metaEl) metaEl.textContent = chamber.meta;

  const proposalContainer = document.querySelector("[data-chamber-proposals]");
  const stageButtons = document.querySelectorAll("[data-stage-filter]");

  const renderProposals = (stage) => {
    if (!proposalContainer) return;
    const items = chamber.proposals.filter((p) => p.stage === stage);
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
  const governorCount = document.querySelector("[data-governor-count]");

  if (governorCount) governorCount.textContent = chamber.governors.length;

  const renderGovernors = (query = "") => {
    if (!governorList) return;
    const filtered = chamber.governors.filter((name) =>
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

  const threadList = document.querySelector("[data-thread-list]");
  if (threadList) {
    threadList.innerHTML = chamber.threads
      .map(
        (thread) => `
        <article class="thread-card">
          <h3>${thread.title}</h3>
          <p>${thread.meta}</p>
        </article>`,
      )
      .join("");
  }

  const chatLog = document.querySelector("[data-chat-log]");
  if (chatLog) {
    chatLog.innerHTML = chamber.chat
      .map((entry) => `<p><strong>${entry.author}:</strong> ${entry.text}</p>`)
      .join("");
  }
})();
