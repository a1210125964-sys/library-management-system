(function initSiteShell() {
  const savedTheme = localStorage.getItem("theme") || "system";

  if (savedTheme === "light" || savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  const normalizePath = (path) => {
    if (!path) {
      return "/";
    }

    const cleaned = path.split("?")[0].split("#")[0] || "/";
    if (cleaned === "/") {
      return "/";
    }

    return cleaned.endsWith("/") ? cleaned.slice(0, -1) : cleaned;
  };

  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const linkPath = normalizePath(new URL(href, window.location.origin).pathname);

    if (linkPath === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    }
  });

  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const parseStoredUser = () => {
    const raw = localStorage.getItem("user") || "";
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  };

  document.querySelectorAll("[data-user-center-link='true']").forEach((link) => {
    const token = localStorage.getItem("token") || "";
    const user = parseStoredUser();
    const target = token && user ? "/user/dashboard.html" : "/login.html";
    link.setAttribute("href", target);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = target;
    });
  });

  // ── 动态更新右上角登录状态 ──
  const siteAuth = document.getElementById("siteAuth");
  if (siteAuth) {
    const token = localStorage.getItem("token") || "";
    const user = parseStoredUser();
    if (token && user) {
      siteAuth.innerHTML = '<span class="greeting">你好，' + (user.realName || user.username) + '</span>';
    } else {
      siteAuth.innerHTML = '<span class="greeting">未登录，<a href="/login.html">请先登录</a></span>';
    }
  }
})();
