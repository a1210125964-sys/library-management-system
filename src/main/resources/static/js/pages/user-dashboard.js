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
  const borrowingsApiUrl = buildAppUrl("/api/user/borrowings");
  const historyApiUrl = buildAppUrl("/api/user/history");
  const finesApiUrl = buildAppUrl("/api/user/fines");
  const profileApiUrl = buildAppUrl("/api/user/profile");

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

  const req = window.HttpClient.create({
    getToken: () => localStorage.getItem("token") || "",
    onUnauthorized: () => {
      clearSession();
      redirectToLogin();
    }
  });

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const asNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }
    return escapeHtml(value);
  };

  if (path.endsWith("/borrowings.html")) {
    const tbody = document.getElementById("borrowingsTableBody");
    const empty = document.getElementById("borrowingsEmpty");
    const reloadBtn = document.getElementById("borrowingsReloadBtn");

    const render = (rows) => {
      if (!tbody || !empty) {
        return;
      }
      if (!rows.length) {
        tbody.innerHTML = "";
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      tbody.innerHTML = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.bookTitle)}</td>
          <td>${formatDate(row.borrowTime)}</td>
          <td>${formatDate(row.dueTime)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.overdueFee ?? 0)}</td>
        </tr>
      `).join("");
    };

    const loadBorrowings = async () => {
      try {
        const res = await req(borrowingsApiUrl);
        render(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (empty) {
          empty.textContent = error.message || "借阅数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadBorrowings);
    }
    loadBorrowings();
    return;
  }

  if (path.endsWith("/history.html")) {
    const tbody = document.getElementById("historyTableBody");
    const empty = document.getElementById("historyEmpty");
    const reloadBtn = document.getElementById("historyReloadBtn");

    const render = (rows) => {
      if (!tbody || !empty) {
        return;
      }
      if (!rows.length) {
        tbody.innerHTML = "";
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      tbody.innerHTML = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.bookTitle)}</td>
          <td>${formatDate(row.borrowTime)}</td>
          <td>${formatDate(row.returnTime)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.overdueFee ?? 0)}</td>
        </tr>
      `).join("");
    };

    const loadHistory = async () => {
      try {
        const res = await req(historyApiUrl);
        render(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (empty) {
          empty.textContent = error.message || "历史数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadHistory);
    }
    loadHistory();
    return;
  }

  if (path.endsWith("/fines.html")) {
    const tbody = document.getElementById("finesTableBody");
    const empty = document.getElementById("finesEmpty");
    const total = document.getElementById("finesTotal");
    const reloadBtn = document.getElementById("finesReloadBtn");

    const render = (data) => {
      if (!tbody || !empty || !total) {
        return;
      }
      const rows = Array.isArray(data.records) ? data.records : [];
      total.textContent = String(data.totalFine ?? 0);
      if (!rows.length) {
        tbody.innerHTML = "";
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      tbody.innerHTML = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.bookTitle)}</td>
          <td>${escapeHtml(row.overdueDays)}</td>
          <td>${escapeHtml(row.overdueFee)}</td>
          <td>${formatDate(row.createdAt)}</td>
        </tr>
      `).join("");
    };

    const loadFines = async () => {
      try {
        const res = await req(finesApiUrl);
        render(res.data || {});
      } catch (error) {
        if (empty) {
          empty.textContent = error.message || "罚金数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadFines);
    }
    loadFines();
    return;
  }

  if (path.endsWith("/profile.html")) {
    const usernameEl = document.getElementById("profileUsername");
    const realNameEl = document.getElementById("profileRealName");
    const phoneEl = document.getElementById("profilePhone");
    const idCardEl = document.getElementById("profileIdCard");
    const form = document.getElementById("profileForm");
    const hint = document.getElementById("profileHint");
    const reloadBtn = document.getElementById("profileReloadBtn");

    const fillProfile = (profile) => {
      if (usernameEl) usernameEl.value = profile.username || "";
      if (realNameEl) realNameEl.value = profile.realName || "";
      if (phoneEl) phoneEl.value = profile.phone || "";
      if (idCardEl) idCardEl.value = profile.idCard || "";
      if (hint) {
        hint.classList.add("hidden");
      }
    };

    const loadProfile = async () => {
      try {
        const res = await req(profileApiUrl);
        fillProfile(res.data || {});
      } catch (error) {
        if (hint) {
          hint.textContent = error.message || "资料加载失败";
          hint.classList.remove("hidden");
        }
      }
    };

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadProfile);
    }

    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          await req(profileApiUrl, "PUT", {
            realName: realNameEl?.value?.trim() || "",
            phone: phoneEl?.value?.trim() || "",
            idCard: idCardEl?.value?.trim() || ""
          });
          if (hint) {
            hint.textContent = "资料已更新";
            hint.classList.remove("hidden");
          }
          await loadProfile();
        } catch (error) {
          if (hint) {
            hint.textContent = error.message || "资料更新失败";
            hint.classList.remove("hidden");
          }
        }
      });
    }
    loadProfile();
    return;
  }

  if (!path.endsWith("/dashboard.html")) {
    return;
  }

  const activeBorrowEl = document.getElementById("kpiActiveBorrow");
  const overdueEl = document.getElementById("kpiOverdue");
  const noticesEl = document.getElementById("kpiNotices");
  const subtitleEl = document.getElementById("dashboardSubTitle");
  const errorEl = document.getElementById("dashboardError");

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
