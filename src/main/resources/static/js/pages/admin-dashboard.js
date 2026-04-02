(function initAdminDashboardPage() {
  const path = window.location.pathname || "";
  if (!path.endsWith("/admin/index.html")) {
    return;
  }

  const adminPath = "/admin/";
  const adminPathIndex = path.indexOf(adminPath);
  const appBasePath = adminPathIndex >= 0 ? path.slice(0, adminPathIndex) : "";
  const buildAppUrl = (targetPath) => {
    const normalizedPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    return `${appBasePath}${normalizedPath}`;
  };

  const loginUrl = buildAppUrl("/login.html");

  const fallbackClearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };
  const fallbackRequireRole = (role, redirectUrl) => {
    const token = localStorage.getItem("token") || "";
    const rawUser = localStorage.getItem("user");
    let parsedUser = null;
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch (_error) {
        parsedUser = null;
      }
    }

    if (!token || !parsedUser || (role && parsedUser.role !== role)) {
      fallbackClearSession();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
      return null;
    }
    return parsedUser;
  };
  const pageGuards = window.PageGuards && typeof window.PageGuards.requireRole === "function"
    && typeof window.PageGuards.clearSession === "function"
    ? window.PageGuards
    : {
      clearSession: fallbackClearSession,
      requireRole: fallbackRequireRole
    };

  const user = pageGuards.requireRole("ADMIN", loginUrl);
  if (!user) {
    return;
  }

  const req = window.HttpClient.create({
    getToken: () => localStorage.getItem("token") || "",
    onUnauthorized: () => {
      pageGuards.clearSession();
      window.location.href = loginUrl;
    }
  });
  const adminApi = window.AdminApi.create(req, buildAppUrl);

  const show = (msg) => window.Toast.show(msg);
  const asNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const stateView = window.StateView && typeof window.StateView.tableMessage === "function"
    ? window.StateView
    : {
      tableMessage: (tbodyEl, colspan, text, type) => {
        if (!tbodyEl) {
          return;
        }
        const safeColspan = Math.max(1, Number(colspan) || 1);
        const stateType = type || "empty";
        const safeText = escapeHtml(text || "暂无数据");
        tbodyEl.innerHTML = `<tr class="status-row status-${stateType}"><td colspan="${safeColspan}">${safeText}</td></tr>`;
      }
    };
  const normalizePager = window.Pager && typeof window.Pager.normalize === "function"
    ? window.Pager.normalize
    : (pagination) => {
      const source = pagination || {};
      return {
        page: Math.max(1, Number(source.page ?? source.number ?? 0) + 1 || 1),
        size: Math.max(1, Number(source.size) || 10),
        totalPages: Math.max(1, Number(source.totalPages) || 1),
        totalElements: Math.max(0, Number(source.totalElements) || 0)
      };
    };

  const userInfoEl = document.getElementById("adminUserInfo");
  const logoutBtn = document.getElementById("logoutBtn");
  const refreshStatsBtn = document.getElementById("refreshStatsBtn");
  const latestNoticeTable = document.getElementById("latestNoticeTable");

  if (userInfoEl) {
    userInfoEl.textContent = `${user.realName || user.username || "管理员"} (ADMIN)`;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      pageGuards.clearSession();
      window.location.href = loginUrl;
    });
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = String(value);
    }
  }

  function renderStats(data) {
    setValue("statUserCount", asNumber(data.userCount));
    setValue("statBookCount", asNumber(data.bookCount));
    setValue("statBorrowCount", asNumber(data.borrowCount));
    setValue("statActiveBorrowCount", asNumber(data.activeBorrowCount));
    setValue("statOverdueRecordCount", asNumber(data.overdueRecordCount));
  }

  function renderNotices(rows) {
    if (!latestNoticeTable) {
      return;
    }
    if (!rows.length) {
      stateView.tableMessage(latestNoticeTable, 4, "暂无公告数据", "empty");
      return;
    }

    latestNoticeTable.innerHTML = rows.map((notice) => `
      <tr>
        <td>${escapeHtml(notice.id || "-")}</td>
        <td>${escapeHtml(notice.title || "-")}</td>
        <td>${notice.published ? "已发布" : "草稿"}</td>
        <td>${escapeHtml(notice.updatedAt || "-")}</td>
      </tr>
    `).join("");
  }

  async function loadStats() {
    try {
      const res = await adminApi.getStats();
      renderStats(res.data || {});
    } catch (error) {
      show(error.message || "统计数据加载失败");
    }
  }

  async function loadLatestNotices() {
    if (!latestNoticeTable) {
      return;
    }
    stateView.tableMessage(latestNoticeTable, 4, "正在加载公告...", "loading");
    try {
      const res = await adminApi.listNotices({ page: 0, size: 5 });
      const rows = Array.isArray(res.data) ? res.data : [];
      const pagination = normalizePager(res.pagination || {
        page: 0,
        size: rows.length || 5,
        totalPages: 1,
        totalElements: rows.length
      });
      renderNotices(rows.slice(0, Math.max(1, pagination.size)));
    } catch (error) {
      stateView.tableMessage(latestNoticeTable, 4, "公告加载失败", "error");
      show(error.message || "公告加载失败");
    }
  }

  if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener("click", async () => {
      await loadStats();
      await loadLatestNotices();
      show("已刷新仪表盘数据");
    });
  }

  loadStats();
  loadLatestNotices();
})();
