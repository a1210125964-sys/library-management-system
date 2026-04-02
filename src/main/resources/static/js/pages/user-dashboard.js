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
  const userApi = window.UserApi.create(req, buildAppUrl);

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
        <tr data-record-id="${escapeHtml(row.id)}">
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
        const res = await userApi.listBorrowings();
        render(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (empty) {
          empty.textContent = error.message || "借阅数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    const parseRecordId = (actionEl) => {
      const fromAction = actionEl?.dataset?.recordId || actionEl?.getAttribute("data-record-id");
      const fromRow = actionEl?.closest("tr")?.dataset?.recordId || actionEl?.closest("tr")?.getAttribute("data-record-id");
      const raw = fromAction ?? fromRow;
      const id = Number(raw);
      return Number.isInteger(id) && id > 0 ? id : null;
    };

    const runBorrowAction = async (action, recordId, triggerEl) => {
      if (triggerEl) {
        triggerEl.disabled = true;
      }
      try {
        if (action === "renew") {
          await userApi.renewBorrow(recordId);
        } else if (action === "return") {
          await userApi.returnBorrow(recordId);
        }
        await loadBorrowings();
      } catch (error) {
        if (empty) {
          empty.textContent = error.message || "借阅操作失败";
          empty.classList.remove("hidden");
        }
      } finally {
        if (triggerEl) {
          triggerEl.disabled = false;
        }
      }
    };

    if (tbody) {
      tbody.addEventListener("click", async (event) => {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl || !tbody.contains(actionEl)) {
          return;
        }
        const action = String(actionEl.dataset.action || "").trim().toLowerCase();
        if (action !== "renew" && action !== "return") {
          return;
        }
        event.preventDefault();
        const recordId = parseRecordId(actionEl);
        if (!recordId) {
          if (empty) {
            empty.textContent = "借阅记录 ID 无效";
            empty.classList.remove("hidden");
          }
          return;
        }
        await runBorrowAction(action, recordId, actionEl);
      });
    }

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

    const DEFAULT_PAGE = 0;
    const DEFAULT_SIZE = 10;
    let currentPage = DEFAULT_PAGE;
    let currentSize = DEFAULT_SIZE;

    const loadHistory = async ({ page = currentPage, size = currentSize } = {}) => {
      try {
        const res = await userApi.listHistory({ page, size });
        currentPage = page;
        currentSize = size;
        render(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        try {
          const fallbackRes = await userApi.listHistory();
          render(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        } catch (_fallbackError) {
          if (empty) {
            empty.textContent = error.message || "历史数据加载失败";
            empty.classList.remove("hidden");
          }
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
        const res = await userApi.getFines();
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
        const res = await userApi.getProfile();
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
          await userApi.updateProfile({
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
      const res = await userApi.getDashboard();
      renderDashboard(res.data || {});
    } catch (error) {
      renderError(error.message);
    }
  }

  loadDashboard();
})();
