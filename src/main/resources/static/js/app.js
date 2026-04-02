const state = window.AppState.createInitialState();
const req = window.HttpClient.create({
  getToken: () => state.token,
  onUnauthorized: () => {
    window.AppState.clearSession(state);
    if (!window.location.pathname.endsWith("/login.html")) {
      window.location.href = "/login.html";
    }
  }
});

function setHidden(id, hidden) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle("hidden", hidden);
  }
}

function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function cycleTheme() {
  const order = ["system", "light", "dark"];
  const idx = order.indexOf(state.theme);
  state.theme = order[(idx + 1) % order.length];
  localStorage.setItem("theme", state.theme);
  applyTheme(state.theme);
  show(state.theme === "system" ? "已切换到系统主题" : `已切换到${state.theme === "light" ? "浅色" : "深色"}模式`);
}

function initThemeToggle() {
  applyTheme(state.theme);
  const btn = document.getElementById("themeToggle");
  if (!btn) {
    return;
  }
  btn.addEventListener("click", cycleTheme);
}

function initSidebarToggle() {
  const btn = document.getElementById("sidebarToggle");
  if (!btn) {
    return;
  }
  btn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
  });
}

function renderTableState(tbodyId, colspan, message, type = "empty") {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) {
    return;
  }
  tbody.innerHTML = `<tr class="status-row status-${type}"><td colspan="${colspan}">${message}</td></tr>`;
}

function clearSession() {
  window.AppState.clearSession(state);
}

function logout() {
  clearSession();
  window.location.href = "/login.html";
}

function show(msg) {
  window.Toast.show(msg);
}

function isAdmin() {
  return window.AuthCore.isAdmin(state.user);
}

function switchPage(page) {
  state.activePage = page;
  const titles = {
    borrowQuery: "借阅图书查询",
    returnBook: "图书归还",
    studentManage: "学生信息管理",
    bookManage: "图书管理",
    addBook: "添加图书",
    changePassword: "修改密码",
    addAdmin: "添加管理员"
  };
  document.getElementById("pageTitle").textContent = titles[page] || "管理后台";
  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) {
    breadcrumb.textContent = `首页 > ${titles[page] || "管理后台"}`;
  }

  document.querySelectorAll(".page-section").forEach(el => el.classList.add("hidden"));
  document.getElementById(`${page}Page`).classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });
}

function initNav() {
  const nav = document.getElementById("navMenu");
  nav.addEventListener("click", (event) => {
    const target = event.target.closest(".nav-item");
    if (!target) {
      return;
    }
    const page = target.dataset.page;
    const adminPages = ["studentManage", "bookManage", "addBook", "changePassword", "addAdmin"];
    const userPages = ["borrowQuery", "returnBook"];
    if (!isAdmin() && adminPages.includes(page)) {
      show("仅管理员可访问该模块");
      return;
    }
    if (isAdmin() && userPages.includes(page)) {
      show("当前为管理员账号，请使用管理模块");
      return;
    }
    switchPage(page);
    loadPageData(page);
  });
}

function refreshUI() {
  const login = !!state.user;
  const admin = isAdmin();
  setHidden("logoutBtn", !login);
  document.getElementById("userInfo").textContent = login
    ? `${state.user.realName || state.user.username} (${state.user.role})`
    : "未登录";
  document.getElementById("roleTag").textContent = admin ? "管理员模式" : "读者模式";

  document.querySelectorAll(".admin-only").forEach(el => el.classList.toggle("hidden", !admin));
  document.querySelectorAll(".user-only").forEach(el => el.classList.toggle("hidden", admin));

  const defaultPage = admin ? "studentManage" : "borrowQuery";
  const visibleCurrent = document.querySelector(`.nav-item[data-page="${state.activePage}"]:not(.hidden)`);
  if (!visibleCurrent) {
    switchPage(defaultPage);
  }
}

async function loadPageData(page) {
  const borrowHandled = await window.BorrowPage.load(page, {
    loadBorrowQueryRecords,
    loadBorrowInventoryBooks,
    loadReturnableRecords
  });
  if (borrowHandled) {
    return;
  }
  if (!isAdmin()) {
    return;
  }
  const adminBookHandled = await window.AdminBookPage.load(page, {
    loadCategories,
    loadAdminBooks,
    syncCategoryOptionsToAddBook
  });
  if (adminBookHandled) {
    return;
  }
  await window.AdminUserPage.load(page, {
    loadStudentUsers,
    loadAdminUsers
  });
}

async function validateSessionOnStartup() {
  if (!state.token || !state.user) {
    clearSession();
    return false;
  }
  try {
    const res = await req("/api/users/me");
    state.user = res.data;
    localStorage.setItem("user", JSON.stringify(state.user));
    return true;
  } catch (e) {
    clearSession();
    return false;
  }
}

function fillCategoryOptions(categories) {
  const filter = document.getElementById("categoryFilter");
  const adminFilter = document.getElementById("adminCategoryFilter");
  const batchCategory = document.getElementById("batchCategory");
  const bookCategory = document.getElementById("bookCategory");
  const addBookCategory = document.getElementById("addBookCategory");
  if (filter) {
    filter.innerHTML = `<option value="">全部分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
  }
  if (adminFilter) {
    const quick = ["编程", "数据库", "算法"];
    const merged = [...quick, ...categories.map(c => c.name).filter(name => !quick.includes(name))];
    adminFilter.innerHTML = `<option value="">全部分类</option>${merged.map(name => `<option value="${name}">${name}</option>`).join("")}`;
  }
  if (batchCategory) {
    batchCategory.innerHTML = `<option value="">批量改为分类...</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
  }
  if (bookCategory) {
    bookCategory.innerHTML = `<option value="">请选择分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
  }
  if (addBookCategory) {
    addBookCategory.innerHTML = `<option value="">请选择分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
  }
  renderAdminCategoryQuickEntries();
}

function renderAdminCategoryQuickEntries() {
  const quickWrap = document.getElementById("adminCategoryQuick");
  if (!quickWrap) {
    return;
  }
  const entries = ["全部", "编程", "数据库", "算法"];
  quickWrap.innerHTML = entries.map(name => `<button class="btn btn-secondary quick-chip" type="button" onclick="applyQuickCategory('${name === "全部" ? "" : name}')">${name}</button>`).join("");
}

function applyQuickCategory(categoryName) {
  const filter = document.getElementById("adminCategoryFilter");
  if (filter) {
    filter.value = categoryName;
  }
  state.adminBookPage = 1;
  renderAdminBookTable();
}

function syncCategoryOptionsToAddBook() {
  const addBookCategory = document.getElementById("addBookCategory");
  if (!addBookCategory) {
    return;
  }
  addBookCategory.innerHTML = `<option value="">请选择分类</option>${state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
}

async function loadBorrowQueryRecords() {
  if (isAdmin()) {
    return;
  }
  renderTableState("borrowQueryTable", 6, "正在加载借阅记录...", "loading");
  try {
    const res = await req("/api/borrow/my");
    const rows = (res.data || []).filter(r => r.status !== "RETURNED");
    const tbody = document.getElementById("borrowQueryTable");
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.bookTitle}</td>
        <td>${r.borrowTime || ""}</td>
        <td>${r.dueTime || ""}</td>
        <td>${r.status}</td>
        <td>${r.overdueFee || 0}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="6">当前无在借图书</td></tr>`;
  } catch (e) {
    renderTableState("borrowQueryTable", 6, "借阅记录加载失败", "error");
    show(e.message);
  }
}

async function loadBorrowInventoryBooks(resetPage = false) {
  if (isAdmin()) {
    return;
  }
  if (resetPage) {
    state.borrowInventoryPage = 1;
  }
  renderTableState("userBookTable", 8, "正在加载库存图书...", "loading");
  try {
    const keyword = (document.getElementById("userBookKeyword")?.value || "").trim();
    const qs = new URLSearchParams();
    if (keyword) {
      qs.set("keyword", keyword);
    }
    qs.set("page", String(Math.max(0, state.borrowInventoryPage - 1)));
    qs.set("size", String(state.borrowInventoryPageSize));

    const res = await req(`/api/books?${qs.toString()}`);

    let pagedBooks = res.data || [];
    let totalPages = Number(res.pagination?.totalPages || 0);

    // 兼容旧版后端：无 pagination 时，前端本地分页兜底
    if (!res.pagination) {
      const books = res.data || [];
      totalPages = Math.max(1, Math.ceil(books.length / state.borrowInventoryPageSize));
      if (state.borrowInventoryPage > totalPages) {
        state.borrowInventoryPage = totalPages;
      }
      const start = (state.borrowInventoryPage - 1) * state.borrowInventoryPageSize;
      pagedBooks = books.slice(start, start + state.borrowInventoryPageSize);
    } else {
      totalPages = Math.max(1, totalPages || 1);
      state.borrowInventoryPage = (Number(res.pagination.page || 0) + 1);
    }
    state.borrowInventoryTotalPages = totalPages;

    const tbody = document.getElementById("userBookTable");
    tbody.innerHTML = pagedBooks.length ? pagedBooks.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.isbn}</td>
        <td>${b.category || "-"}</td>
        <td>${b.stock}</td>
        <td>${b.availableStock}</td>
        <td>${b.availableStock > 0 ? `<button onclick="borrow(${b.id})">借阅</button>` : "-"}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="8">未找到匹配图书</td></tr>`;

    const pageInfo = document.getElementById("userBookPageInfo");
    const prevBtn = document.getElementById("userBookPrevPage");
    const nextBtn = document.getElementById("userBookNextPage");
    if (pageInfo) {
      pageInfo.textContent = `第 ${state.borrowInventoryPage} / ${state.borrowInventoryTotalPages} 页`;
    }
    if (prevBtn) {
      prevBtn.disabled = state.borrowInventoryPage <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = state.borrowInventoryPage >= state.borrowInventoryTotalPages;
    }
  } catch (e) {
    renderTableState("userBookTable", 8, "库存图书加载失败", "error");
    show(e.message);
  }
}

function changeBorrowInventoryPage(step) {
  const nextPage = state.borrowInventoryPage + step;
  if (nextPage < 1 || nextPage > state.borrowInventoryTotalPages) {
    return;
  }
  state.borrowInventoryPage = nextPage;
  loadBorrowInventoryBooks();
}

async function loadReturnableRecords() {
  if (isAdmin()) {
    return;
  }
  renderTableState("returnBookTable", 7, "正在加载待归还记录...", "loading");
  try {
    const res = await req("/api/borrow/my");
    const rows = (res.data || []).filter(r => r.status !== "RETURNED");
    const tbody = document.getElementById("returnBookTable");
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.bookTitle}</td>
        <td>${r.borrowTime || ""}</td>
        <td>${r.dueTime || ""}</td>
        <td>${r.status}</td>
        <td>${r.overdueFee || 0}</td>
        <td><button onclick="returnBook(${r.id})">归还</button></td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="7">暂无待归还图书</td></tr>`;
  } catch (e) {
    renderTableState("returnBookTable", 7, "待归还记录加载失败", "error");
    show(e.message);
  }
}

async function loadCategories() {
  try {
    const res = await req("/api/book-categories");
    state.categories = res.data || [];
    fillCategoryOptions(state.categories);
    if (!isAdmin()) {
      return;
    }
    const tbody = document.getElementById("categoryTable");
    tbody.innerHTML = state.categories.length ? state.categories.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.description || "-"}</td>
        <td>
          <button onclick="editCategory(${c.id})">编辑</button>
          <button onclick="deleteCategory(${c.id})">删除</button>
        </td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="4">暂无分类数据</td></tr>`;
  } catch (e) {
    renderTableState("categoryTable", 4, "分类加载失败，请稍后重试", "error");
    show(e.message);
  }
}

async function loadBooks() {
  const tbody = document.getElementById("bookTable");
  if (!tbody) {
    return;
  }
  renderTableState("bookTable", 8, "正在加载图书数据...", "loading");
  try {
    const keyword = document.getElementById("keyword").value.trim();
    const category = document.getElementById("categoryFilter").value;
    const res = await req(`/api/books${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`);
    const books = (res.data || []).filter(b => !category || b.category === category);
    tbody.innerHTML = books.length ? books.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.isbn}</td>
        <td>${b.category || "-"}</td>
        <td>${b.stock}</td>
        <td>${b.availableStock}</td>
        <td>${isAdmin() ? "-" : `<button onclick="borrow(${b.id})">借阅</button>`}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="8">未找到匹配图书，请调整筛选条件</td></tr>`;
  } catch (e) {
    renderTableState("bookTable", 8, "图书加载失败，请稍后重试", "error");
    show(e.message);
  }
}

function fillAdminBookSuggest(books) {
  const el = document.getElementById("adminBookSuggest");
  if (!el) {
    return;
  }
  const values = new Set();
  books.forEach(b => {
    [b.title, b.author, b.isbn, b.category].forEach(v => {
      if (v) {
        values.add(v);
      }
    });
  });
  el.innerHTML = Array.from(values).slice(0, 30).map(v => `<option value="${v}"></option>`).join("");
}

function getFilteredSortedAdminBooks() {
  const keyword = (document.getElementById("adminBookKeyword")?.value || "").trim().toLowerCase();
  const category = document.getElementById("adminCategoryFilter")?.value || "";
  const publisherKeyword = (document.getElementById("advancedPublisher")?.value || "").trim().toLowerCase();
  const stockMinRaw = document.getElementById("advancedStockMin")?.value;
  const stockMaxRaw = document.getElementById("advancedStockMax")?.value;
  const stockMin = stockMinRaw === "" || stockMinRaw == null ? null : Number(stockMinRaw);
  const stockMax = stockMaxRaw === "" || stockMaxRaw == null ? null : Number(stockMaxRaw);
  const filtered = state.adminBooks.filter(b => {
    const hitCategory = !category || b.category === category;
    if (!hitCategory) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    const hitKeyword = !keyword || [b.title, b.author, b.isbn, b.category].some(v => String(v || "").toLowerCase().includes(keyword));
    if (!hitKeyword) {
      return false;
    }
    const hitPublisher = !publisherKeyword || String(b.publisher || "").toLowerCase().includes(publisherKeyword);
    if (!hitPublisher) {
      return false;
    }
    if (stockMin !== null && Number(b.stock || 0) < stockMin) {
      return false;
    }
    if (stockMax !== null && Number(b.stock || 0) > stockMax) {
      return false;
    }
    return true;
  });
  const { adminBookSortKey: key, adminBookSortOrder: order } = state;
  filtered.sort((a, b) => {
    const av = a[key] ?? "";
    const bv = b[key] ?? "";
    if (typeof av === "number" && typeof bv === "number") {
      return order === "asc" ? av - bv : bv - av;
    }
    return order === "asc"
      ? String(av).localeCompare(String(bv), "zh-CN")
      : String(bv).localeCompare(String(av), "zh-CN");
  });
  return filtered;
}

function renderAdminBookTable() {
  const tbody = document.getElementById("adminBookTable");
  if (!tbody) {
    return;
  }
  const rows = getFilteredSortedAdminBooks();
  const totalPages = Math.max(1, Math.ceil(rows.length / state.adminBookPageSize));
  if (state.adminBookPage > totalPages) {
    state.adminBookPage = totalPages;
  }
  const start = (state.adminBookPage - 1) * state.adminBookPageSize;
  const paged = rows.slice(start, start + state.adminBookPageSize);
  tbody.innerHTML = paged.length ? paged.map(b => {
    const lowStock = b.availableStock <= 2;
    return `
      <tr class="${lowStock ? "stock-warning-row" : ""}">
        <td><input type="checkbox" ${state.adminSelectedBookIds.has(b.id) ? "checked" : ""} onchange="toggleAdminBookSelection(${b.id}, this.checked)" /></td>
        <td title="ID: ${b.id}">${b.title}</td>
        <td>${b.author}</td>
        <td>${b.category || "-"}</td>
        <td>${b.isbn}</td>
        <td>${b.stock}</td>
        <td class="${lowStock ? "stock-warning" : ""}">${b.availableStock}${lowStock ? "（低库存）" : ""}</td>
        <td>
          <button onclick="editBook(${b.id})">✏️ 编辑</button>
          <button onclick="deleteBook(${b.id})">🗑️ 删除</button>
        </td>
      </tr>
    `;
  }).join("") : `<tr class="status-row status-empty"><td colspan="8">暂无图书数据，点击“添加图书”开始录入</td></tr>`;

  const pageInfo = document.getElementById("adminBookPageInfo");
  const prev = document.getElementById("adminBookPrev");
  const next = document.getElementById("adminBookNext");
  const selectAll = document.getElementById("selectAllBooks");
  if (pageInfo) {
    pageInfo.textContent = `第 ${state.adminBookPage} / ${totalPages} 页`;
  }
  if (prev) {
    prev.disabled = state.adminBookPage <= 1;
  }
  if (next) {
    next.disabled = state.adminBookPage >= totalPages;
  }
  if (selectAll) {
    const currentPageIds = new Set(paged.map(b => b.id));
    selectAll.checked = paged.length > 0 && paged.every(b => state.adminSelectedBookIds.has(b.id));
    selectAll.indeterminate = paged.some(b => state.adminSelectedBookIds.has(b.id)) && !selectAll.checked;
    state.adminSelectedBookIds.forEach(id => {
      if (!rows.some(b => b.id === id)) {
        state.adminSelectedBookIds.delete(id);
      }
    });
    if (currentPageIds.size === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    }
  }
}

function sortAdminBooks(key) {
  if (state.adminBookSortKey === key) {
    state.adminBookSortOrder = state.adminBookSortOrder === "asc" ? "desc" : "asc";
  } else {
    state.adminBookSortKey = key;
    state.adminBookSortOrder = "asc";
  }
  renderAdminBookTable();
}

function changeAdminBookPage(step) {
  const next = state.adminBookPage + step;
  if (next < 1) {
    return;
  }
  state.adminBookPage = next;
  renderAdminBookTable();
}

function toggleAdminBookSelection(id, checked) {
  if (checked) {
    state.adminSelectedBookIds.add(id);
  } else {
    state.adminSelectedBookIds.delete(id);
  }
  renderAdminBookTable();
}

function toggleSelectAllAdminBooks(checked) {
  const rows = getFilteredSortedAdminBooks();
  const start = (state.adminBookPage - 1) * state.adminBookPageSize;
  const paged = rows.slice(start, start + state.adminBookPageSize);
  paged.forEach(b => {
    if (checked) {
      state.adminSelectedBookIds.add(b.id);
    } else {
      state.adminSelectedBookIds.delete(b.id);
    }
  });
  renderAdminBookTable();
}

async function loadAdminBooks(resetPage = false) {
  if (!isAdmin()) {
    return;
  }
  if (resetPage) {
    state.adminBookPage = 1;
  }
  renderTableState("adminBookTable", 8, "正在加载图书数据...", "loading");
  try {
    const res = await req("/api/books");
    state.adminBooks = res.data || [];
    fillAdminBookSuggest(state.adminBooks);
    renderAdminBookTable();
  } catch (e) {
    renderTableState("adminBookTable", 8, "图书管理数据加载失败", "error");
    show(e.message);
  }
}

async function borrow(bookId) {
  try {
    await req(`/api/borrow/${bookId}`, "POST");
    show("借阅成功");
    await loadBorrowQueryRecords();
    await loadBorrowInventoryBooks();
    await updateNotificationBadge();
  } catch (e) {
    show(e.message);
  }
}

async function loadMyRecords() {
  if (isAdmin()) {
    renderTableState("borrowTable", 7, "管理员账号不提供个人借阅记录展示", "empty");
    return;
  }
  renderTableState("borrowTable", 7, "正在加载借阅记录...", "loading");
  try {
    const res = await req("/api/borrow/my");
    const tbody = document.getElementById("borrowTable");
    const rows = res.data || [];
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.bookTitle}</td>
        <td>${r.borrowTime || ""}</td>
        <td>${r.dueTime || ""}</td>
        <td>${r.status}</td>
        <td>${r.overdueFee || 0}</td>
        <td>
          <button onclick="renew(${r.id})">续借</button>
          <button onclick="returnBook(${r.id})">归还</button>
        </td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="7">暂无借阅记录</td></tr>`;
  } catch (e) {
    renderTableState("borrowTable", 7, "借阅记录加载失败", "error");
    show(e.message);
  }
}

async function loadMyOverdues() {
  if (isAdmin()) {
    renderTableState("overdueTable", 6, "管理员可通过“逾期扫描”更新系统逾期状态", "empty");
    return;
  }
  renderTableState("overdueTable", 6, "正在加载逾期记录...", "loading");
  try {
    const res = await req("/api/borrow/my-overdue");
    const tbody = document.getElementById("overdueTable");
    const rows = res.data || [];
    tbody.innerHTML = rows.length
      ? rows.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${r.borrowRecordId}</td>
          <td>${r.bookTitle}</td>
          <td>${r.overdueDays}</td>
          <td>${r.overdueFee}</td>
          <td>${r.createdAt || ""}</td>
        </tr>
      `).join("")
      : `<tr class="status-row status-empty"><td colspan="6">暂无逾期记录</td></tr>`;
  } catch (e) {
    renderTableState("overdueTable", 6, "逾期记录加载失败", "error");
    show(e.message);
  }
}

async function renew(recordId) {
  try {
    await req(`/api/borrow/renew/${recordId}`, "POST");
    show("续借成功");
    await loadMyRecords();
    await loadMyOverdues();
  } catch (e) {
    show(e.message);
  }
}

async function returnBook(recordId) {
  try {
    await req(`/api/borrow/return/${recordId}`, "POST");
    show("归还成功");
    await loadBorrowQueryRecords();
    await loadReturnableRecords();
    await loadBorrowInventoryBooks();
    await loadAdminBooks();
    await updateNotificationBadge();
  } catch (e) {
    show(e.message);
  }
}

function resetBookManageFilter() {
  const keyword = document.getElementById("adminBookKeyword");
  const category = document.getElementById("adminCategoryFilter");
  if (keyword) {
    keyword.value = "";
  }
  if (category) {
    category.value = "";
  }
  const publisher = document.getElementById("advancedPublisher");
  const stockMin = document.getElementById("advancedStockMin");
  const stockMax = document.getElementById("advancedStockMax");
  if (publisher) publisher.value = "";
  if (stockMin) stockMin.value = "";
  if (stockMax) stockMax.value = "";
  state.adminBookPage = 1;
  state.adminSelectedBookIds.clear();
  loadAdminBooks(true);
}

function toggleAdvancedFilter() {
  const panel = document.getElementById("advancedFilterPanel");
  if (!panel) {
    return;
  }
  const btn = document.getElementById("advancedFilterBtn");
  const willOpen = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !willOpen);
  if (btn) {
    btn.textContent = willOpen ? "收起高级筛选" : "高级筛选";
  }
}

async function batchDeleteBooks() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  const ids = Array.from(state.adminSelectedBookIds);
  if (!ids.length) {
    show("请先勾选要删除的图书");
    return;
  }
  if (!window.confirm(`确认删除已选 ${ids.length} 本图书吗？`)) {
    return;
  }
  try {
    for (const id of ids) {
      await req(`/api/books/${id}`, "DELETE");
    }
    show("批量删除成功");
    state.adminSelectedBookIds.clear();
    await loadAdminBooks();
    await loadBorrowInventoryBooks();
  } catch (e) {
    show(e.message);
  }
}

async function batchUpdateCategory() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  const ids = Array.from(state.adminSelectedBookIds);
  const category = document.getElementById("batchCategory")?.value || "";
  if (!ids.length) {
    show("请先勾选要修改的图书");
    return;
  }
  if (!category) {
    show("请选择目标分类");
    return;
  }
  try {
    for (const id of ids) {
      const oldBook = state.adminBooks.find(b => b.id === id);
      if (!oldBook) {
        continue;
      }
      await req(`/api/books/${id}`, "PUT", {
        title: oldBook.title,
        author: oldBook.author,
        publisher: oldBook.publisher,
        isbn: oldBook.isbn,
        category,
        stock: oldBook.stock
      });
    }
    show("批量分类修改成功");
    await loadAdminBooks();
    await loadBorrowInventoryBooks();
  } catch (e) {
    show(e.message);
  }
}

function openBookModal() {
  state.editingBookId = null;
  document.getElementById("bookModalTitle").textContent = "添加图书";
  resetBookForm();
  setHidden("bookModal", false);
}

function closeBookModal() {
  setHidden("bookModal", true);
}

function openCategoryModal() {
  document.getElementById("quickCategoryName").value = "";
  document.getElementById("quickCategoryDescription").value = "";
  setHidden("categoryModal", false);
}

function closeCategoryModal() {
  setHidden("categoryModal", true);
}

async function createCategoryFromModal() {
  const name = document.getElementById("quickCategoryName").value.trim();
  const description = document.getElementById("quickCategoryDescription").value.trim();
  if (!name) {
    show("请填写分类名称");
    return;
  }
  try {
    await req("/api/book-categories", "POST", { name, description });
    show("分类创建成功");
    closeCategoryModal();
    await loadCategories();
  } catch (e) {
    show(e.message);
  }
}

function openCategoryDrawer() {
  setHidden("categoryDrawer", false);
}

function closeCategoryDrawer() {
  setHidden("categoryDrawer", true);
}

function toggleLogPanel() {
  const panel = document.getElementById("adminLogPanel");
  if (!panel) {
    return;
  }
  const nextHidden = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !nextHidden);
  if (nextHidden) {
    loadAdminLogs();
  }
}

async function loadAdminLogs() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("adminLogTable", 5, "正在加载操作记录...", "loading");
  try {
    const qs = new URLSearchParams({
      page: String(Math.max(0, state.adminLogPage - 1)),
      size: String(state.adminLogPageSize)
    });
    const res = await req(`/api/admin/logs?${qs.toString()}`);
    const rows = res.data || [];
    const tbody = document.getElementById("adminLogTable");
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.adminName || r.adminUsername || "-"}</td>
        <td>${r.operation || "-"}</td>
        <td>${r.detail || "-"}</td>
        <td>${r.createdAt || ""}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="5">暂无操作日志</td></tr>`;

    state.adminLogTotalPages = Math.max(1, Number(res.pagination?.totalPages || 1));
    state.adminLogPage = Number(res.pagination?.page || (state.adminLogPage - 1)) + 1;

    const pageInfo = document.getElementById("adminLogPageInfo");
    const prev = document.getElementById("adminLogPrev");
    const next = document.getElementById("adminLogNext");
    if (pageInfo) {
      pageInfo.textContent = `第 ${state.adminLogPage} / ${state.adminLogTotalPages} 页`;
    }
    if (prev) {
      prev.disabled = state.adminLogPage <= 1;
    }
    if (next) {
      next.disabled = state.adminLogPage >= state.adminLogTotalPages;
    }
  } catch (e) {
    renderTableState("adminLogTable", 5, "操作记录加载失败", "error");
    show(e.message);
  }
}

function changeAdminLogPage(step) {
  const next = state.adminLogPage + step;
  if (next < 1 || next > state.adminLogTotalPages) {
    return;
  }
  state.adminLogPage = next;
  loadAdminLogs();
}

function jumpAdminBookPage() {
  const input = document.getElementById("adminBookJumpPage");
  if (!input) {
    return;
  }
  const target = Number(input.value);
  if (!Number.isInteger(target) || target < 1) {
    show("请输入有效页码");
    return;
  }
  state.adminBookPage = target;
  renderAdminBookTable();
}

function resetBookForm() {
  state.editingBookId = null;
  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookPublisher").value = "";
  document.getElementById("bookIsbn").value = "";
  document.getElementById("bookCategory").value = "";
  document.getElementById("bookStock").value = "";
}

async function editBook(id) {
  try {
    const book = state.adminBooks.find(b => b.id === id);
    if (!book) {
      show("图书不存在");
      return;
    }
    state.editingBookId = id;
    document.getElementById("bookModalTitle").textContent = "编辑图书";
    document.getElementById("bookTitle").value = book.title || "";
    document.getElementById("bookAuthor").value = book.author || "";
    document.getElementById("bookPublisher").value = book.publisher || "";
    document.getElementById("bookIsbn").value = book.isbn || "";
    document.getElementById("bookCategory").value = book.category || "";
    document.getElementById("bookStock").value = book.stock ?? "";
    setHidden("bookModal", false);
  } catch (e) {
    show(e.message);
  }
}

async function createOrUpdateBook() {
  try {
    const body = {
      title: document.getElementById("bookTitle").value.trim(),
      author: document.getElementById("bookAuthor").value.trim(),
      publisher: document.getElementById("bookPublisher").value.trim(),
      isbn: document.getElementById("bookIsbn").value.trim(),
      category: document.getElementById("bookCategory").value,
      stock: Number(document.getElementById("bookStock").value)
    };
    if (state.editingBookId) {
      await req(`/api/books/${state.editingBookId}`, "PUT", body);
      show("图书更新成功");
    } else {
      await req("/api/books", "POST", body);
      show("图书创建成功");
    }
    resetBookForm();
    closeBookModal();
    await loadAdminBooks();
    await loadBorrowInventoryBooks();
  } catch (e) {
    show(e.message);
  }
}

async function deleteBook(id) {
  if (!window.confirm("确认删除该图书吗？删除后不可恢复。")) {
    return;
  }
  try {
    await req(`/api/books/${id}`, "DELETE");
    show("图书删除成功");
    state.adminSelectedBookIds.delete(id);
    await loadAdminBooks();
    await loadBorrowInventoryBooks();
  } catch (e) {
    show(e.message);
  }
}

function resetCategoryForm() {
  state.editingCategoryId = null;
  document.getElementById("categoryName").value = "";
  document.getElementById("categoryDescription").value = "";
}

function editCategory(id) {
  const category = state.categories.find(c => c.id === id);
  if (!category) {
    return;
  }
  state.editingCategoryId = id;
  document.getElementById("categoryName").value = category.name || "";
  document.getElementById("categoryDescription").value = category.description || "";
}

async function createOrUpdateCategory() {
  try {
    const name = document.getElementById("categoryName").value.trim();
    const description = document.getElementById("categoryDescription").value.trim();
    if (state.editingCategoryId) {
      await req(`/api/book-categories/${state.editingCategoryId}`, "PUT", { name, description });
      show("分类更新成功");
    } else {
      await req("/api/book-categories", "POST", { name, description });
      show("分类创建成功");
    }
    resetCategoryForm();
    await loadCategories();
    await loadAdminBooks();
  } catch (e) {
    show(e.message);
  }
}

async function deleteCategory(id) {
  try {
    await req(`/api/book-categories/${id}`, "DELETE");
    show("分类删除成功");
    await loadCategories();
  } catch (e) {
    show(e.message);
  }
}

async function loadProfile() {
  try {
    const res = await req("/api/users/me");
    state.user = res.data;
    localStorage.setItem("user", JSON.stringify(state.user));
    document.getElementById("profileRealName").value = state.user.realName || "";
    document.getElementById("profilePhone").value = state.user.phone || "";
    document.getElementById("profileIdCard").value = state.user.idCard || "";
    refreshUI();
  } catch (e) {
    show(e.message);
  }
}

async function updateProfile() {
  try {
    const body = {
      realName: document.getElementById("profileRealName").value.trim(),
      phone: document.getElementById("profilePhone").value.trim(),
      idCard: document.getElementById("profileIdCard").value.trim()
    };
    const res = await req("/api/users/me", "PUT", body);
    state.user = res.data;
    localStorage.setItem("user", JSON.stringify(state.user));
    refreshUI();
    show("个人信息已更新");
  } catch (e) {
    show(e.message);
  }
}

async function createAdmin() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  try {
    const body = {
      username: document.getElementById("adminUsername").value.trim(),
      realName: document.getElementById("adminRealName").value.trim(),
      phone: document.getElementById("adminPhone").value.trim(),
      idCard: document.getElementById("adminIdCard").value.trim(),
      password: document.getElementById("adminPassword").value.trim()
    };
    await req("/api/auth/register-admin", "POST", body);
    show("管理员创建成功");
    document.getElementById("adminUsername").value = "";
    document.getElementById("adminRealName").value = "";
    document.getElementById("adminPhone").value = "";
    document.getElementById("adminIdCard").value = "";
    document.getElementById("adminPassword").value = "";
    await loadAdminUsers();
    await loadStudentUsers();
  } catch (e) {
    show(e.message);
  }
}

async function loadStudentUsers() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("studentTable", 7, "正在加载学生列表...", "loading");
  try {
    const qs = new URLSearchParams({
      role: "USER",
      page: String(Math.max(0, state.studentPage - 1)),
      size: String(state.studentPageSize)
    });
    const res = await req(`/api/admin/users?${qs.toString()}`);
    const students = res.data || [];
    const tbody = document.getElementById("studentTable");
    tbody.innerHTML = students.length ? students.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.realName || ""}</td>
        <td>${u.phone || ""}</td>
        <td>${u.role || ""}</td>
        <td>${u.createdAt || ""}</td>
        <td><button onclick='resetUserPassword(${u.id}, ${JSON.stringify(u.username || "")})'>重置密码</button></td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="7">暂无学生数据</td></tr>`;

    state.studentTotalPages = Math.max(1, Number(res.pagination?.totalPages || 1));
    state.studentPage = Number(res.pagination?.page || (state.studentPage - 1)) + 1;

    const pageInfo = document.getElementById("studentPageInfo");
    const prev = document.getElementById("studentPrevPage");
    const next = document.getElementById("studentNextPage");
    if (pageInfo) {
      pageInfo.textContent = `第 ${state.studentPage} / ${state.studentTotalPages} 页`;
    }
    if (prev) {
      prev.disabled = state.studentPage <= 1;
    }
    if (next) {
      next.disabled = state.studentPage >= state.studentTotalPages;
    }
  } catch (e) {
    renderTableState("studentTable", 7, "学生列表加载失败", "error");
    show(e.message);
  }
}

function changeStudentPage(step) {
  const next = state.studentPage + step;
  if (next < 1 || next > state.studentTotalPages) {
    return;
  }
  state.studentPage = next;
  loadStudentUsers();
}

async function loadAdminUsers() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("adminUserTable", 6, "正在加载管理员列表...", "loading");
  try {
    const res = await req("/api/admin/users");
    const admins = (res.data || []).filter(u => u.role === "ADMIN");
    const tbody = document.getElementById("adminUserTable");
    tbody.innerHTML = admins.length ? admins.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.realName || ""}</td>
        <td>${u.phone || ""}</td>
        <td>${u.role || ""}</td>
        <td>${u.createdAt || ""}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="6">暂无管理员数据</td></tr>`;
  } catch (e) {
    renderTableState("adminUserTable", 6, "管理员列表加载失败", "error");
    show(e.message);
  }
}

async function createBookFromAddPage() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  try {
    const body = {
      title: document.getElementById("addBookTitle").value.trim(),
      author: document.getElementById("addBookAuthor").value.trim(),
      publisher: document.getElementById("addBookPublisher").value.trim(),
      isbn: document.getElementById("addBookIsbn").value.trim(),
      category: document.getElementById("addBookCategory").value,
      stock: Number(document.getElementById("addBookStock").value)
    };
    await req("/api/books", "POST", body);
    show("图书添加成功");
    document.getElementById("addBookTitle").value = "";
    document.getElementById("addBookAuthor").value = "";
    document.getElementById("addBookPublisher").value = "";
    document.getElementById("addBookIsbn").value = "";
    document.getElementById("addBookCategory").value = "";
    document.getElementById("addBookStock").value = "";
    await loadAdminBooks();
    await loadBorrowInventoryBooks();
  } catch (e) {
    show(e.message);
  }
}

function initBorrowInventorySearch() {
  const input = document.getElementById("userBookKeyword");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        loadBorrowInventoryBooks(true);
      }
    });
  }
  const adminInput = document.getElementById("adminBookKeyword");
  if (adminInput) {
    adminInput.addEventListener("input", () => {
      state.adminBookPage = 1;
      renderAdminBookTable();
    });
    adminInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        loadAdminBooks(true);
      }
    });
  }
  const adminFilter = document.getElementById("adminCategoryFilter");
  if (adminFilter) {
    adminFilter.addEventListener("change", () => {
      state.adminBookPage = 1;
      renderAdminBookTable();
    });
  }
  ["advancedPublisher", "advancedStockMin", "advancedStockMax"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        state.adminBookPage = 1;
        renderAdminBookTable();
      });
    }
  });
  const jumpPage = document.getElementById("adminBookJumpPage");
  if (jumpPage) {
    jumpPage.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        jumpAdminBookPage();
      }
    });
  }
}

async function changeMyPassword() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  const oldPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    show("请填写完整密码信息");
    return;
  }
  if (newPassword !== confirmNewPassword) {
    show("两次输入的新密码不一致");
    return;
  }
  try {
    await req("/api/users/me/change-password", "POST", { oldPassword, newPassword });
    show("密码修改成功，请重新登录");
    setTimeout(() => logout(), 600);
  } catch (e) {
    show(e.message);
  }
}

async function loadUsers() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("userTable", 7, "正在加载用户列表...", "loading");
  try {
    const res = await req("/api/admin/users");
    state.users = res.data || [];
    const tbody = document.getElementById("userTable");
    tbody.innerHTML = state.users.length ? state.users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.realName || ""}</td>
        <td>${u.phone || ""}</td>
        <td>${u.role || ""}</td>
        <td>${u.createdAt || ""}</td>
        <td><button onclick='resetUserPassword(${u.id}, ${JSON.stringify(u.username || "")})'>重置密码</button></td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="7">暂无用户数据</td></tr>`;
    renderUserChart();
  } catch (e) {
    renderTableState("userTable", 7, "用户列表加载失败", "error");
    show(e.message);
  }
}

async function resetUserPassword(userId, username) {
  const newPassword = window.prompt(`请输入用户 ${username} 的新密码（6-30位）`);
  if (!newPassword) {
    return;
  }
  try {
    await req(`/api/admin/users/${userId}/reset-password`, "POST", { newPassword });
    show("密码重置成功");
  } catch (e) {
    show(e.message);
  }
}

function renderStatSummary(data) {
  const summary = document.getElementById("statSummary");
  const items = [
    ["用户总数", data.userCount || 0],
    ["图书总数", data.bookCount || 0],
    ["借阅总量", data.borrowCount || 0],
    ["逾期记录", data.overdueRecordCount || 0],
    ["在借数量", data.activeBorrowCount || 0]
  ];
  summary.innerHTML = items.map(([name, value]) => `
    <div class="stat-card">
      <div class="name">${name}</div>
      <div class="value">${value}</div>
    </div>
  `).join("");
}

function renderCirculationChart(data) {
  const canvas = document.getElementById("circulationChart");
  const ctx = canvas.getContext("2d");
  const textColor = cssVar("--text", "#0f172a");
  const mutedColor = cssVar("--muted", "#64748b");
  const lineColor = cssVar("--line-strong", "rgba(15, 23, 42, 0.16)");
  const cardBg = cssVar("--surface-strong", "#ffffff");
  const metrics = [
    { name: "借阅总量", value: data.borrowCount || 0, start: "#0ea5e9", end: "#0284c7" },
    { name: "在借数量", value: data.activeBorrowCount || 0, start: "#10b981", end: "#059669" },
    { name: "逾期记录", value: data.overdueRecordCount || 0, start: "#f59e0b", end: "#d97706" }
  ];

  const width = canvas.width;
  const height = canvas.height;
  const left = 58;
  const bottom = 40;
  const chartW = width - left - 24;
  const chartH = height - bottom - 24;
  const max = Math.max(...metrics.map(m => m.value), 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cardBg;
  ctx.fillRect(0, 0, width, height);

  const yTicks = 4;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= yTicks; i++) {
    const y = 24 + (chartH / yTicks) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, 24);
  ctx.lineTo(left, height - bottom);
  ctx.lineTo(width - 20, height - bottom);
  ctx.stroke();

  const barWidth = Math.floor(chartW / (metrics.length * 1.7));
  const gap = Math.floor((chartW - barWidth * metrics.length) / (metrics.length - 1));

  ctx.fillStyle = mutedColor;
  ctx.font = "12px Segoe UI";
  for (let i = 0; i <= yTicks; i++) {
    const tickVal = Math.round(max - (max / yTicks) * i);
    const y = 28 + (chartH / yTicks) * i;
    ctx.fillText(String(tickVal), 18, y);
  }

  metrics.forEach((m, i) => {
    const x = left + i * (barWidth + gap);
    const h = Math.round((m.value / max) * (chartH - 20));
    const y = height - bottom - h;

    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, m.start);
    grad.addColorStop(1, m.end);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barWidth, h);

    ctx.fillStyle = mutedColor;
    ctx.font = "12px Segoe UI";
    ctx.fillText(m.name, x, height - 12);
    ctx.fillStyle = textColor;
    ctx.font = "700 13px Segoe UI";
    ctx.fillText(String(m.value), x + 6, y - 8);
  });
}

function renderUserChart() {
  const canvas = document.getElementById("userChart");
  const ctx = canvas.getContext("2d");
  const textColor = cssVar("--text", "#0f172a");
  const mutedColor = cssVar("--muted", "#64748b");
  const cardBg = cssVar("--surface-strong", "#ffffff");

  const adminCount = state.users.filter(u => u.role === "ADMIN").length;
  const userCount = state.users.filter(u => u.role === "USER").length;
  const total = Math.max(adminCount + userCount, 1);

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 92;
  const ring = 28;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cardBg;
  ctx.fillRect(0, 0, width, height);

  const adminRate = adminCount / total;
  const start = -Math.PI / 2;

  ctx.lineWidth = ring;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + Math.PI * 2 * adminRate);
  ctx.stroke();

  ctx.strokeStyle = "#64748b";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start + Math.PI * 2 * adminRate, start + Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = "700 24px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(String(total), cx, cy + 4);
  ctx.font = "13px Segoe UI";
  ctx.fillStyle = mutedColor;
  ctx.fillText("用户总量", cx, cy + 24);

  ctx.textAlign = "left";
  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(32, height - 46, 12, 12);
  ctx.fillStyle = mutedColor;
  ctx.fillText(`管理员: ${adminCount}`, 50, height - 36);

  ctx.fillStyle = "#64748b";
  ctx.fillRect(180, height - 46, 12, 12);
  ctx.fillStyle = mutedColor;
  ctx.fillText(`普通用户: ${userCount}`, 198, height - 36);
}

async function loadStats() {
  if (!isAdmin()) {
    return;
  }
  try {
    const res = await req("/api/admin/stats");
    renderStatSummary(res.data || {});
    renderCirculationChart(res.data || {});
    const output = document.getElementById("adminOutput");
    output.classList.remove("hidden");
    output.textContent = JSON.stringify(res.data, null, 2);
    await updateNotificationBadge(res.data);
  } catch (e) {
    show(e.message);
  }
}

async function loadBookStats() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("bookStatsTable", 7, "正在加载图书借阅统计...", "loading");
  try {
    const res = await req("/api/admin/stats/books?limit=10");
    const rows = res.data || [];
    const tbody = document.getElementById("bookStatsTable");
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td>${r.bookId}</td>
        <td>${r.title || ""}</td>
        <td>${r.author || ""}</td>
        <td>${r.category || "-"}</td>
        <td>${r.borrowCount || 0}</td>
        <td>${r.activeBorrowCount || 0}</td>
        <td>${r.returnedCount || 0}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="7">暂无图书借阅统计数据</td></tr>`;
  } catch (e) {
    renderTableState("bookStatsTable", 7, "图书借阅统计加载失败", "error");
    show(e.message);
  }
}

async function loadUserStats() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("userStatsTable", 7, "正在加载用户借阅统计...", "loading");
  try {
    const res = await req("/api/admin/stats/users?limit=20");
    const rows = res.data || [];
    const tbody = document.getElementById("userStatsTable");
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td>${r.userId}</td>
        <td>${r.username || ""}</td>
        <td>${r.realName || ""}</td>
        <td>${r.borrowCount || 0}</td>
        <td>${r.activeBorrowCount || 0}</td>
        <td>${r.overdueCount || 0}</td>
        <td>${r.overdueFeeTotal || 0}</td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="7">暂无用户借阅统计数据</td></tr>`;
  } catch (e) {
    renderTableState("userStatsTable", 7, "用户借阅统计加载失败", "error");
    show(e.message);
  }
}

async function loadConfigs() {
  if (!isAdmin()) {
    return;
  }
  try {
    const res = await req("/api/admin/configs");
    const cfg = res.data || {};
    document.getElementById("configBorrowDays").value = cfg.borrow_days || "";
    document.getElementById("configMaxBorrowCount").value = cfg.max_borrow_count || "";
    document.getElementById("configOverdueDailyFee").value = cfg.overdue_daily_fee || "";
  } catch (e) {
    show(e.message);
  }
}

async function updateConfigs() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  try {
    const body = {
      borrowDays: Number(document.getElementById("configBorrowDays").value),
      maxBorrowCount: Number(document.getElementById("configMaxBorrowCount").value),
      overdueDailyFee: Number(document.getElementById("configOverdueDailyFee").value)
    };
    await req("/api/admin/configs", "PUT", body);
    show("系统参数已更新");
    await loadConfigs();
  } catch (e) {
    show(e.message);
  }
}

async function scanOverdue() {
  if (!isAdmin()) {
    show("无权限操作");
    return;
  }
  try {
    const res = await req("/api/borrow/scan-overdue", "POST");
    show("逾期扫描完成");
    const output = document.getElementById("adminOutput");
    output.classList.remove("hidden");
    output.textContent = JSON.stringify(res.data, null, 2);
    await loadStats();
  } catch (e) {
    show(e.message);
  }
}

async function updateNotificationBadge(statsData = null) {
  const badge = document.getElementById("notifyBadge");
  if (isAdmin()) {
    const data = statsData || (await req("/api/admin/stats")).data || {};
    badge.textContent = String(data.overdueRecordCount || 0);
    return;
  }
  const overdue = await req("/api/borrow/my-overdue");
  badge.textContent = String((overdue.data || []).length);
}

(async function init() {
  initThemeToggle();
  initSidebarToggle();
  initBorrowInventorySearch();
  const valid = await validateSessionOnStartup();
  if (!valid) {
    window.location.href = "/login.html";
    return;
  }

  initNav();
  refreshUI();
  const defaultPage = isAdmin() ? "studentManage" : "borrowQuery";
  switchPage(defaultPage);

  await loadCategories();
  await loadPageData(defaultPage);

  await updateNotificationBadge();
})();
