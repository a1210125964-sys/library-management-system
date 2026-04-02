window.AdminBookPage = {
  async load(page, handlers) {
    if (page === "bookManage") {
      await handlers.loadCategories();
      await handlers.loadAdminBooks();
      return true;
    }
    if (page === "addBook") {
      await handlers.loadCategories();
      handlers.syncCategoryOptionsToAddBook();
      return true;
    }
    return false;
  }
};

(function initAdminBooksStandalonePage() {
  const path = window.location.pathname || "";
  if (!path.endsWith("/admin/books.html")) {
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
    <div class="table-wrap" id="adminBookTableWrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>书名</th><th>作者</th><th>分类</th><th>库存</th>
          </tr>
        </thead>
        <tbody id="adminBookTable"></tbody>
      </table>
    </div>
  `);

  const tbody = document.getElementById("adminBookTable");
  window.StateView.tableMessage(tbody, 5, "正在加载图书...", "loading");

  adminApi.listBooks({ page: 0, size: 10, keyword: "" })
    .then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        window.StateView.tableMessage(tbody, 5, "暂无图书数据", "empty");
        return;
      }
      tbody.innerHTML = rows.map((book) => `
        <tr>
          <td>${escapeHtml(book.id || "-")}</td>
          <td>${escapeHtml(book.title || "-")}</td>
          <td>${escapeHtml(book.author || "-")}</td>
          <td>${escapeHtml(book.category || "-")}</td>
          <td>${escapeHtml(book.stock ?? "-")}</td>
        </tr>
      `).join("");
    })
    .catch((error) => {
      window.StateView.tableMessage(tbody, 5, "图书加载失败", "error");
      show(error.message || "图书加载失败");
    });
})();
