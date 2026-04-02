(function initAdminLogsPage() {
  const path = window.location.pathname || "";
  if (!path.endsWith("/admin/logs.html")) {
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
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

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

  const panel = document.querySelector(".panel");
  if (!panel) {
    return;
  }

  panel.insertAdjacentHTML("beforeend", `
    <div class="table-wrap" id="adminLogTableWrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>管理员</th><th>操作</th><th>结果</th><th>耗时(ms)</th><th>时间</th>
          </tr>
        </thead>
        <tbody id="adminLogTable"></tbody>
      </table>
    </div>
  `);

  const tbody = document.getElementById("adminLogTable");
  window.StateView.tableMessage(tbody, 6, "正在加载日志...", "loading");

  adminApi.listLogs({ page: 0, size: 10, operation: "", startTime: "", endTime: "" })
    .then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        window.StateView.tableMessage(tbody, 6, "暂无日志数据", "empty");
        return;
      }
      tbody.innerHTML = rows.map((item) => `
        <tr>
          <td>${escapeHtml(item.id || "-")}</td>
          <td>${escapeHtml(item.adminName || item.adminUsername || "-")}</td>
          <td>${escapeHtml(item.operation || "-")}</td>
          <td>${escapeHtml(item.result || "-")}</td>
          <td>${escapeHtml(item.durationMs ?? "-")}</td>
          <td>${escapeHtml(item.createdAt || "-")}</td>
        </tr>
      `).join("");
    })
    .catch((error) => {
      window.StateView.tableMessage(tbody, 6, "日志加载失败", "error");
      show(error.message || "日志加载失败");
    });
})();
