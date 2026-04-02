(function initAdminNoticePage() {
  const path = window.location.pathname || "";
  if (!path.endsWith("/admin/notices.html")) {
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
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const userInfoEl = document.getElementById("adminUserInfo");
  const logoutBtn = document.getElementById("logoutBtn");
  const titleEl = document.getElementById("noticeTitle");
  const summaryEl = document.getElementById("noticeSummary");
  const contentEl = document.getElementById("noticeContent");
  const publishedEl = document.getElementById("noticePublished");
  const submitBtn = document.getElementById("noticeSubmitBtn");
  const cancelBtn = document.getElementById("noticeCancelEditBtn");
  const reloadBtn = document.getElementById("reloadNoticesBtn");
  const tableEl = document.getElementById("noticeTable");
  const pageInfoEl = document.getElementById("noticePageInfo");
  const prevBtn = document.getElementById("noticePrevPage");
  const nextBtn = document.getElementById("noticeNextPage");
  const formTitleEl = document.getElementById("noticeFormTitle");

  if (userInfoEl) {
    userInfoEl.textContent = `${user.realName || user.username || "管理员"} (ADMIN)`;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = loginUrl;
    });
  }

  const state = {
    page: 0,
    size: 10,
    totalPages: 1,
    editId: null,
    rows: []
  };

  function normalizePayload() {
    const title = (titleEl?.value || "").trim();
    const summary = (summaryEl?.value || "").trim();
    const content = (contentEl?.value || "").trim();
    const published = !!publishedEl?.checked;

    if (!title) {
      throw new Error("请输入公告标题");
    }
    if (!content) {
      throw new Error("请输入公告正文");
    }

    return { title, summary, content, published };
  }

  function resetForm() {
    state.editId = null;
    if (formTitleEl) {
      formTitleEl.textContent = "新建公告";
    }
    if (submitBtn) {
      submitBtn.textContent = "保存公告";
    }
    if (cancelBtn) {
      cancelBtn.classList.add("hidden");
    }
    if (titleEl) titleEl.value = "";
    if (summaryEl) summaryEl.value = "";
    if (contentEl) contentEl.value = "";
    if (publishedEl) publishedEl.checked = false;
  }

  function startEdit(noticeId) {
    const target = state.rows.find((row) => row.id === noticeId);
    if (!target) {
      show("未找到公告数据");
      return;
    }

    state.editId = target.id;
    if (formTitleEl) {
      formTitleEl.textContent = `编辑公告 #${target.id}`;
    }
    if (submitBtn) {
      submitBtn.textContent = "更新公告";
    }
    if (cancelBtn) {
      cancelBtn.classList.remove("hidden");
    }

    if (titleEl) titleEl.value = target.title || "";
    if (summaryEl) summaryEl.value = target.summary || "";
    if (contentEl) contentEl.value = target.content || "";
    if (publishedEl) publishedEl.checked = !!target.published;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeNotice(noticeId) {
    const accepted = window.confirm(`确认删除公告 #${noticeId} 吗？`);
    if (!accepted) {
      return;
    }

    try {
      await req(buildAppUrl(`/api/admin/notices/${noticeId}`), "DELETE");
      show("公告已删除");
      if (state.editId === noticeId) {
        resetForm();
      }
      await loadList();
    } catch (error) {
      show(error.message || "删除失败");
    }
  }

  function renderTable(rows) {
    if (!tableEl) {
      return;
    }

    if (!rows.length) {
      tableEl.innerHTML = '<tr class="status-row status-empty"><td colspan="6">暂无公告</td></tr>';
      return;
    }

    tableEl.innerHTML = rows.map((notice) => `
      <tr>
        <td>${escapeHtml(notice.id || "-")}</td>
        <td>${escapeHtml(notice.title || "-")}</td>
        <td>${notice.published ? "已发布" : "草稿"}</td>
        <td>${escapeHtml(notice.publishedAt || "-")}</td>
        <td>${escapeHtml(notice.updatedAt || "-")}</td>
        <td>
          <button type="button" data-action="edit" data-id="${escapeHtml(notice.id)}">编辑</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(notice.id)}">删除</button>
        </td>
      </tr>
    `).join("");
  }

  function renderPagination() {
    const displayPage = state.page + 1;
    if (pageInfoEl) {
      pageInfoEl.textContent = `第 ${displayPage} / ${state.totalPages} 页`;
    }
    if (prevBtn) {
      prevBtn.disabled = state.page <= 0;
    }
    if (nextBtn) {
      nextBtn.disabled = state.page >= state.totalPages - 1;
    }
  }

  async function loadList() {
    if (!tableEl) {
      return;
    }

    tableEl.innerHTML = '<tr class="status-row status-loading"><td colspan="6">正在加载公告...</td></tr>';
    try {
      const url = buildAppUrl(`/api/admin/notices?page=${state.page}&size=${state.size}`);
      const res = await req(url);
      state.rows = Array.isArray(res.data) ? res.data : [];

      const totalPages = Number(res.pagination?.totalPages || 1);
      state.totalPages = Math.max(1, totalPages);
      if (state.page > state.totalPages - 1) {
        state.page = Math.max(0, state.totalPages - 1);
        return loadList();
      }

      renderTable(state.rows);
      renderPagination();
    } catch (error) {
      tableEl.innerHTML = '<tr class="status-row status-error"><td colspan="6">公告加载失败</td></tr>';
      show(error.message || "公告加载失败");
    }
  }

  async function submitForm() {
    try {
      const payload = normalizePayload();
      if (state.editId) {
        await req(buildAppUrl(`/api/admin/notices/${state.editId}`), "PUT", payload);
        show("公告更新成功");
      } else {
        await req(buildAppUrl("/api/admin/notices"), "POST", payload);
        show("公告创建成功");
      }

      resetForm();
      await loadList();
    } catch (error) {
      show(error.message || "保存公告失败");
    }
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", submitForm);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      loadList();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.page <= 0) {
        return;
      }
      state.page -= 1;
      loadList();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (state.page >= state.totalPages - 1) {
        return;
      }
      state.page += 1;
      loadList();
    });
  }

  if (tableEl) {
    tableEl.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) {
        return;
      }

      const noticeId = Number(btn.dataset.id || 0);
      if (!Number.isFinite(noticeId) || noticeId <= 0) {
        return;
      }

      const action = btn.dataset.action;
      if (action === "edit") {
        startEdit(noticeId);
      } else if (action === "delete") {
        removeNotice(noticeId);
      }
    });
  }

  resetForm();
  loadList();
})();
