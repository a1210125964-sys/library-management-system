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
    <div id="adminRecordMessage" class="muted" style="margin-top: 12px;"></div>
  `);

  const messageEl = document.getElementById("adminRecordMessage");
  if (!messageEl) {
    return;
  }

  messageEl.textContent = "正在加载借阅记录...";
  adminApi.listRecords({ page: 0, size: 10 })
    .then((res) => {
      messageEl.textContent = res?.message || "借阅记录接口暂未开放，将在后续版本接入。";
    })
    .catch(() => {
      messageEl.textContent = "借阅记录接口暂未开放，将在后续版本接入。";
    });
})();
