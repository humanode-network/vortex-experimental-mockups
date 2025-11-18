(() => {
  if (document.body.dataset.page !== "proposals") return;

  const filterDrawer = document.querySelector("[data-filter-drawer]");
  const filterToggle = document.querySelector("[data-filter-toggle]");
  const filterBody = document.querySelector("[data-filter-body]");
  const filterHint = document.querySelector("[data-filter-hint]");
  const proposals = Array.from(document.querySelectorAll("[data-proposal]"));
  const searchInput = document.querySelector("[data-proposal-search]");
  const emptyState = document.querySelector("[data-proposal-empty]");

  const setFilterState = (open) => {
    if (!filterDrawer || !filterToggle || !filterBody) return;
    filterDrawer.classList.toggle("filter-drawer--open", open);
    filterToggle.setAttribute("aria-expanded", String(open));
    if (filterHint) filterHint.textContent = open ? "Expanded" : "Collapsed";
  };

  filterToggle?.addEventListener("click", () => {
    const next = !filterDrawer.classList.contains("filter-drawer--open");
    setFilterState(next);
  });
  setFilterState(false);

  const collapseCard = (card) => {
    const details = card.querySelector("[data-proposal-details]");
    const toggle = card.querySelector("[data-proposal-toggle]");
    card.classList.remove("proposal-item--open");
    if (details) details.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  };

  proposals.forEach((card) => {
    const toggle = card.querySelector("[data-proposal-toggle]");
    const details = card.querySelector("[data-proposal-details]");
    if (!toggle || !details) return;

    toggle.addEventListener("click", () => {
      const next = !card.classList.contains("proposal-item--open");
      card.classList.toggle("proposal-item--open", next);
      details.hidden = !next;
      toggle.setAttribute("aria-expanded", String(next));
    });
  });

  const applySearchFilter = () => {
    const term = searchInput?.value.trim().toLowerCase() || "";
    let visible = 0;

    proposals.forEach((card) => {
      const keywords = (card.dataset.proposalKeywords || "").toLowerCase();
      const match = !term || keywords.includes(term);
      card.hidden = !match;
      if (!match) collapseCard(card);
      if (match) visible += 1;
    });

    if (emptyState) emptyState.hidden = visible !== 0;
  };

  searchInput?.addEventListener("input", applySearchFilter);
  applySearchFilter();
})();
