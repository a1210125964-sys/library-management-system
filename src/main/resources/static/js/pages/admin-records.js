(function initAdminRecordsPage() {
  const path = window.location.pathname || "";
  if (!path.endsWith("/admin/records.html")) {
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
  const pageGuards = window.PageGuards;
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
  const stateView = window.StateView;
  const userInfoEl = document.getElementById("adminUserInfo");
  const logoutBtn = document.getElementById("logoutBtn");
  if (userInfoEl) {
    userInfoEl.textContent = `${user.realName || user.username || "管理员"} (ADMIN)`;
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      pageGuards.clearSession();
      window.location.href = loginUrl;
    });
  }

  const tableBody = document.getElementById("recordTable");
  const statusFilter = document.getElementById("recordsStatusFilter");
  const keywordInput = document.getElementById("recordsKeyword");
  const searchBtn = document.getElementById("recordsSearchBtn");
  const resetBtn = document.getElementById("recordsResetBtn");
  const reloadBtn = document.getElementById("recordsReloadBtn");
  const prevBtn = document.getElementById("recordsPrevPage");
  const nextBtn = document.getElementById("recordsNextPage");
  const pageInfo = document.getElementById("recordsPageInfo");

  if (!tableBody) {
    return;
  }

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const statusLabel = (status) => {
    const code = String(status || "").toUpperCase();
    if (code === "BORROWED") return "借阅中";
    if (code === "OVERDUE") return "已逾期";
    if (code === "RETURNED") return "已归还";
    return code || "-";
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return escapeHtml(value);
    }
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  let currentPage = 0;
  let totalPages = 1;
  const pageSize = 10;

  const renderPaging = () => {
    if (pageInfo) {
      pageInfo.textContent = `第 ${currentPage + 1} / ${totalPages} 页`;
    }
    if (prevBtn) {
      prevBtn.disabled = currentPage <= 0;
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages - 1;
    }
  };

  const renderRows = (rows) => {
    if (!rows.length) {
      stateView.tableMessage(tableBody, 9, "暂无借阅记录", "empty");
      renderPaging();
      return;
    }
    tableBody.innerHTML = rows.map((item) => `
      <tr>
        <td>${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.realName || item.username || "-")}（${escapeHtml(item.username || "-")}）</td>
        <td>${escapeHtml(item.bookTitle || "-")}</td>
        <td>${formatDateTime(item.borrowTime)}</td>
        <td>${formatDateTime(item.dueTime)}</td>
        <td>${formatDateTime(item.returnTime)}</td>
        <td>${statusLabel(item.status)}</td>
        <td>${escapeHtml(item.renewCount ?? 0)}</td>
        <td>${escapeHtml(item.overdueFee ?? 0)}</td>
      </tr>
    `).join("");
    renderPaging();
  };

  const loadRecords = async (page = currentPage) => {
    stateView.tableMessage(tableBody, 9, "正在加载借阅记录...", "loading");
    try {
      const res = await adminApi.listRecords({
        page,
        size: pageSize,
        status: statusFilter?.value || "",
        keyword: (keywordInput?.value || "").trim()
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      currentPage = Number(res.pagination?.page ?? page);
      totalPages = Math.max(1, Number(res.pagination?.totalPages ?? 1));
      renderRows(rows);
    } catch (error) {
      stateView.tableMessage(tableBody, 9, "借阅记录加载失败", "error");
      show(error.message || "借阅记录加载失败");
    }
  };

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      currentPage = 0;
      loadRecords(0);
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (statusFilter) {
        statusFilter.value = "";
      }
      if (keywordInput) {
        keywordInput.value = "";
      }
      currentPage = 0;
      loadRecords(0);
    });
  }
  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => loadRecords(currentPage));
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      currentPage = 0;
      loadRecords(0);
    });
  }
  if (keywordInput) {
    keywordInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      currentPage = 0;
      loadRecords(0);
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage <= 0) {
        return;
      }
      loadRecords(currentPage - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage >= totalPages - 1) {
        return;
      }
      loadRecords(currentPage + 1);
    });
  }

  loadRecords(0);
})();
