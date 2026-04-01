const state = {
  token: localStorage.getItem("token") || "",
  user: JSON.parse(localStorage.getItem("user") || "null"),
  categories: [],
  users: [],
  editingBookId: null,
  editingCategoryId: null,
  activePage: "dashboard",
  theme: localStorage.getItem("theme") || "system"
};

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
  if (isAdmin()) {
    loadStats();
    renderUserChart();
  }
}

function initThemeToggle() {
  applyTheme(state.theme);
  const btn = document.getElementById("themeToggle");
  if (!btn) {
    return;
  }
  btn.addEventListener("click", cycleTheme);
}

function renderTableState(tbodyId, colspan, message, type = "empty") {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) {
    return;
  }
  tbody.innerHTML = `<tr class="status-row status-${type}"><td colspan="${colspan}">${message}</td></tr>`;
}

function clearSession() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function logout() {
  clearSession();
  window.location.href = "/login.html";
}

function show(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 1800);
}

async function req(url, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) {
    headers["X-Token"] = state.token;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({ message: "请求失败" }));
  if (!res.ok) {
    throw new Error(data.message || "请求失败");
  }
  return data;
}

function isAdmin() {
  return state.user && state.user.role === "ADMIN";
}

function switchPage(page) {
  state.activePage = page;
  const titles = {
    dashboard: "管理员仪表盘",
    books: "图书管理列表",
    users: "用户管理页",
    borrows: "借阅记录页"
  };
  document.getElementById("pageTitle").textContent = titles[page] || "管理后台";

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
    if (page === "users" && !isAdmin()) {
      show("仅管理员可访问用户管理");
      return;
    }
    if (page === "dashboard" && !isAdmin()) {
      switchPage("borrows");
      return;
    }
    switchPage(page);
  });
}

function refreshUI() {
  const login = !!state.user;
  const admin = isAdmin();
  document.getElementById("logoutBtn").classList.toggle("hidden", !login);
  document.getElementById("userInfo").textContent = login
    ? `${state.user.realName || state.user.username} (${state.user.role})`
    : "未登录";
  document.getElementById("roleTag").textContent = admin ? "管理员模式" : "读者模式";

  document.getElementById("adminPanel").classList.toggle("hidden", !admin);
  document.getElementById("chartArea").classList.toggle("hidden", !admin);
  document.getElementById("adminBookPanel").classList.toggle("hidden", !admin);
  document.getElementById("adminUserPanel").classList.toggle("hidden", !admin);
  document.getElementById("scanBtn").classList.toggle("hidden", !admin);

  const usersNav = document.querySelector('.nav-item[data-page="users"]');
  usersNav.classList.toggle("hidden", !admin);

  if (!admin && state.activePage === "dashboard") {
    switchPage("borrows");
  }
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
  const bookCategory = document.getElementById("bookCategory");
  filter.innerHTML = `<option value="">全部分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
  bookCategory.innerHTML = `<option value="">请选择分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
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
  renderTableState("bookTable", 8, "正在加载图书数据...", "loading");
  try {
    const keyword = document.getElementById("keyword").value.trim();
    const category = document.getElementById("categoryFilter").value;
    const res = await req(`/api/books${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`);
    const books = (res.data || []).filter(b => !category || b.category === category);
    const tbody = document.getElementById("bookTable");
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

async function loadAdminBooks() {
  if (!isAdmin()) {
    return;
  }
  renderTableState("adminBookTable", 8, "正在加载图书数据...", "loading");
  try {
    const res = await req("/api/books");
    const tbody = document.getElementById("adminBookTable");
    const rows = res.data || [];
    tbody.innerHTML = rows.length ? rows.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.isbn}</td>
        <td>${b.category || "-"}</td>
        <td>${b.stock}</td>
        <td>${b.availableStock}</td>
        <td>
          <button onclick="editBook(${b.id})">编辑</button>
          <button onclick="deleteBook(${b.id})">删除</button>
        </td>
      </tr>
    `).join("") : `<tr class="status-row status-empty"><td colspan="8">暂无馆藏图书，请先新增图书</td></tr>`;
  } catch (e) {
    renderTableState("adminBookTable", 8, "图书管理数据加载失败", "error");
    show(e.message);
  }
}

async function borrow(bookId) {
  try {
    await req(`/api/borrow/${bookId}`, "POST");
    show("借阅成功");
    await loadBooks();
    await loadMyRecords();
    await loadMyOverdues();
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
    await loadMyRecords();
    await loadMyOverdues();
    await loadBooks();
    await updateNotificationBadge();
  } catch (e) {
    show(e.message);
  }
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
    const res = await req("/api/books");
    const book = (res.data || []).find(b => b.id === id);
    if (!book) {
      show("图书不存在");
      return;
    }
    state.editingBookId = id;
    document.getElementById("bookTitle").value = book.title || "";
    document.getElementById("bookAuthor").value = book.author || "";
    document.getElementById("bookPublisher").value = book.publisher || "";
    document.getElementById("bookIsbn").value = book.isbn || "";
    document.getElementById("bookCategory").value = book.category || "";
    document.getElementById("bookStock").value = book.stock ?? "";
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
    await loadAdminBooks();
    await loadBooks();
  } catch (e) {
    show(e.message);
  }
}

async function deleteBook(id) {
  try {
    await req(`/api/books/${id}`, "DELETE");
    show("图书删除成功");
    await loadAdminBooks();
    await loadBooks();
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
    await loadBooks();
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
    await loadUsers();
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
    { name: "借阅总量", value: data.borrowCount || 0, start: "#2563eb", end: "#1d4ed8" },
    { name: "在借数量", value: data.activeBorrowCount || 0, start: "#06b6d4", end: "#0891b2" },
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

  ctx.strokeStyle = "#06b6d4";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + Math.PI * 2 * adminRate);
  ctx.stroke();

  ctx.strokeStyle = "#2563eb";
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
  ctx.fillStyle = "#06b6d4";
  ctx.fillRect(32, height - 46, 12, 12);
  ctx.fillStyle = mutedColor;
  ctx.fillText(`管理员: ${adminCount}`, 50, height - 36);

  ctx.fillStyle = "#2563eb";
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
  const valid = await validateSessionOnStartup();
  if (!valid) {
    window.location.href = "/login.html";
    return;
  }

  initNav();
  refreshUI();
  switchPage(isAdmin() ? "dashboard" : "borrows");

  await loadProfile();
  await loadCategories();
  await loadBooks();
  await loadMyRecords();
  await loadMyOverdues();

  if (isAdmin()) {
    await loadAdminBooks();
    await loadUsers();
    await loadStats();
  } else {
    renderUserChart();
    document.getElementById("adminOutput").classList.add("hidden");
  }

  await updateNotificationBadge();
})();
