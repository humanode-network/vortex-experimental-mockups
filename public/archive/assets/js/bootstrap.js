(() => {
  const body = document.body;
  if (!body) return;

  const modeChips = document.querySelectorAll("[data-mode-chip]");
  const modeLabels = document.querySelectorAll("[data-mode-label]");
  const modePills = document.querySelectorAll("[data-mode-pill]");
  const modeBanners = document.querySelectorAll("[data-mode-banner]");
  const gatedControls = document.querySelectorAll("[data-gated]");
  const modals = document.querySelectorAll(".modal");

  const setActiveMode = () => {
    body.dataset.mode = "active";
    body.classList.remove("mode-observer");
    body.classList.add("mode-active");

    modeChips.forEach((chip) => {
      chip.textContent = "Active Human node";
      chip.classList.add("mode-chip--active");
    });

    modeLabels.forEach((label) => {
      label.textContent = "Active mode";
      label.classList.remove("mode-chip--observer");
      label.classList.add("mode-chip--active");
    });

    modePills.forEach((pill) => {
      pill.textContent = "Active";
      pill.classList.remove("status-chip--observer");
      pill.classList.add("status-chip--active");
    });

    modeBanners.forEach((banner) => {
      banner.hidden = true;
    });

    gatedControls.forEach((control) => {
      control.disabled = false;
      control.classList.remove("btn--disabled");
      control.removeAttribute("aria-disabled");
      control.title = "";
    });
  };

  setActiveMode();

  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const isActive = link.dataset.navLink === (body.dataset.page || "");
    link.classList.toggle("sidebar__link--active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  const closeModal = (modal) => modal?.setAttribute("aria-hidden", "true");

  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = document.querySelector(
        `[data-modal="${button.dataset.openModal}"]`,
      );
      modal?.setAttribute("aria-hidden", "false");
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () =>
      closeModal(button.closest(".modal")),
    );
  });

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") modals.forEach((modal) => closeModal(modal));
  });
})();
