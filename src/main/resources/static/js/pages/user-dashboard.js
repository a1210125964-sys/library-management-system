(function initUserPortalPages() {
  const path = window.location.pathname || "";
  const userPortalPath = "/user/";
  const userPortalIndex = path.indexOf(userPortalPath);
  const onUserPortalPage = userPortalIndex !== -1;
  if (!onUserPortalPage) {
    return;
  }

  const appBasePath = path.slice(0, userPortalIndex);
  const buildAppUrl = (targetPath) => {
    const normalizedPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    return `${appBasePath}${normalizedPath}`;
  };
  const loginUrl = buildAppUrl("/login.html");
  const dashboardApiUrl = buildAppUrl("/api/user/dashboard");

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const redirectToLogin = () => {
    window.location.href = loginUrl;
  };

  const token = localStorage.getItem("token") || "";
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_error) {
    clearSession();
    redirectToLogin();
    return;
  }

  if (!token || !user) {
    redirectToLogin();
    return;
  }

  const normalizeText = (value, fallback) => {
    const text = String(value || "").trim();
    return text || fallback;
  };

  const displayName = normalizeText(user.realName, normalizeText(user.username, "读者"));

  document.querySelectorAll("#userDisplayName").forEach((el) => {
    el.textContent = displayName;
  });

  document.querySelectorAll("#userLogoutBtn").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      clearSession();
      redirectToLogin();
    });
  });

  if (!path.endsWith("/dashboard.html")) {
    return;
  }

  const req = window.HttpClient.create({
    getToken: () => localStorage.getItem("token") || "",
    onUnauthorized: () => {
      clearSession();
      redirectToLogin();
    }
  });

  const activeBorrowEl = document.getElementById("kpiActiveBorrow");
  const overdueEl = document.getElementById("kpiOverdue");
  const noticesEl = document.getElementById("kpiNotices");
  const subtitleEl = document.getElementById("dashboardSubTitle");
  const errorEl = document.getElementById("dashboardError");

  const asNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  function renderDashboard(data) {
    if (activeBorrowEl) {
      activeBorrowEl.textContent = String(asNumber(data.activeBorrowCount));
    }
    if (overdueEl) {
      overdueEl.textContent = String(asNumber(data.overdueCount));
    }
    if (noticesEl) {
      noticesEl.textContent = String(asNumber(data.publishedNoticeCount));
    }
    if (subtitleEl) {
      subtitleEl.textContent = "以下数据来自 /api/user/dashboard 实时聚合接口。";
    }
    if (errorEl) {
      errorEl.classList.add("hidden");
    }
  }

  function renderError(message) {
    if (activeBorrowEl) {
      activeBorrowEl.textContent = "--";
    }
    if (overdueEl) {
      overdueEl.textContent = "--";
    }
    if (noticesEl) {
      noticesEl.textContent = "--";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "指标加载失败，请稍后重试。";
    }
    if (errorEl) {
      errorEl.textContent = message || "用户中心数据加载失败";
      errorEl.classList.remove("hidden");
    }
  }

  async function loadDashboard() {
    try {
      const res = await req(dashboardApiUrl);
      renderDashboard(res.data || {});
    } catch (error) {
      renderError(error.message);
    }
  }

  loadDashboard();
})();
