(function initSiteShell() {
  const savedTheme = localStorage.getItem("theme") || "system";

  if (savedTheme === "light" || savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  const currentPath = window.location.pathname;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("is-active");
    }
  });

  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
