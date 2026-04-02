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
  const legacyUrl = buildAppUrl("/index.html?legacy=1");
  const statsApiUrl = buildAppUrl("/api/admin/stats");
  const noticesApiUrl = buildAppUrl("/api/admin/notices?page=0&size=5");

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const token = localStorage.getItem("token") || "";
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_error) {
    clearSession();
    window.location.href = loginUrl;
    return;
  }

  if (!token || !user) {
    window.location.href = loginUrl;
    return;
  }

  if (user.role !== "ADMIN") {
    window.location.href = legacyUrl;
    return;
  }

  const req = window.HttpClient.create({
    getToken: () => localStorage.getItem("token") || "",
    onUnauthorized: () => {
      clearSession();
      window.location.href = loginUrl;
    }
  });

  const show = (msg) => window.Toast.show(msg);
  const asNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
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
      clearSession();
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
      latestNoticeTable.innerHTML = '<tr class="status-row status-empty"><td colspan="4">暂无公告数据</td></tr>';
      return;
    }

    latestNoticeTable.innerHTML = rows.map((notice) => `
      <tr>
        <td>${notice.id || "-"}</td>
        <td>${notice.title || "-"}</td>
        <td>${notice.published ? "已发布" : "草稿"}</td>
        <td>${notice.updatedAt || "-"}</td>
      </tr>
    `).join("");
  }

  async function loadStats() {
    try {
      const res = await req(statsApiUrl);
      renderStats(res.data || {});
    } catch (error) {
      show(error.message || "统计数据加载失败");
    }
  }

  async function loadLatestNotices() {
    if (!latestNoticeTable) {
      return;
    }
    latestNoticeTable.innerHTML = '<tr class="status-row status-loading"><td colspan="4">正在加载公告...</td></tr>';
    try {
      const res = await req(noticesApiUrl);
      renderNotices(res.data || []);
    } catch (error) {
      latestNoticeTable.innerHTML = '<tr class="status-row status-error"><td colspan="4">公告加载失败</td></tr>';
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
