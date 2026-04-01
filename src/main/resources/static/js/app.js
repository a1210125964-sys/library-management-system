const state = {
  token: localStorage.getItem("token") || "",
  user: JSON.parse(localStorage.getItem("user") || "null"),
  categories: [],
  editingBookId: null,
  editingCategoryId: null
};

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
  setTimeout(() => toast.style.opacity = "0", 1800);
}

async function req(url, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["X-Token"] = state.token;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({ message: "请求失败" }));
  if (!res.ok) throw new Error(data.message || "请求失败");
  return data;
}

function isAdmin() {
  return state.user && state.user.role === "ADMIN";
}

function refreshUI() {
  const isLogin = !!state.user;
  document.getElementById("bookCard").classList.toggle("hidden", !isLogin);
  document.getElementById("profileCard").classList.toggle("hidden", !isLogin);
  document.getElementById("logoutBtn").classList.toggle("hidden", !isLogin);
  document.getElementById("borrowCard").classList.toggle("hidden", !isLogin || isAdmin());
  document.getElementById("adminCard").classList.toggle("hidden", !isAdmin());
  document.getElementById("adminBookCard").classList.toggle("hidden", !isAdmin());
  document.getElementById("categoryCard").classList.toggle("hidden", !isAdmin());
  document.getElementById("adminUserCard").classList.toggle("hidden", !isAdmin());
  document.getElementById("userInfo").textContent = isLogin
      ? `${state.user.realName} (${state.user.role})`
      : "未登录";
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

async function loadBooks() {
  try {
    const keyword = document.getElementById("keyword").value.trim();
    const category = document.getElementById("categoryFilter").value;
    const res = await req(`/api/books${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`);
    const books = (res.data || []).filter(b => !category || b.category === category);
    const tbody = document.getElementById("bookTable");
    tbody.innerHTML = books.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.isbn}</td>
        <td>${b.category || ""}</td>
        <td>${b.stock}</td>
        <td>${b.availableStock}</td>
        <td>${isAdmin() ? "-" : `<button onclick="borrow(${b.id})">借阅</button>`}</td>
      </tr>
    `).join("");
  } catch (e) { show(e.message); }
}

async function borrow(bookId) {
  try {
    await req(`/api/borrow/${bookId}`, "POST");
    show("借阅成功");
    loadBooks();
    loadMyRecords();
  } catch (e) { show(e.message); }
}

async function loadMyRecords() {
  try {
    if (isAdmin()) {
      return;
    }
    const res = await req("/api/borrow/my");
    const tbody = document.getElementById("borrowTable");
    tbody.innerHTML = res.data.map(r => `
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
    `).join("");
  } catch (e) { show(e.message); }
}

async function renew(recordId) {
  try {
    await req(`/api/borrow/renew/${recordId}`, "POST");
    show("续借成功");
    loadMyRecords();
  } catch (e) { show(e.message); }
}

async function returnBook(recordId) {
  try {
    await req(`/api/borrow/return/${recordId}`, "POST");
    show("归还成功");
    loadMyRecords();
    loadBooks();
  } catch (e) { show(e.message); }
}

async function loadStats() {
  try {
    const res = await req("/api/admin/stats");
    document.getElementById("adminOutput").textContent = JSON.stringify(res.data, null, 2);
    renderStatSummary(res.data || {});
    renderStatsChart(res.data || {});
  } catch (e) { show(e.message); }
}

function renderStatSummary(data) {
  const summary = document.getElementById("statSummary");
  const items = [
    ["用户总数", data.userCount || 0],
    ["图书总数", data.bookCount || 0],
    ["借阅记录", data.borrowCount || 0],
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

function renderStatsChart(data) {
  const canvas = document.getElementById("statsChart");
  const ctx = canvas.getContext("2d");
  const values = [
    { name: "用户", value: data.userCount || 0, color: "#22d3ee" },
    { name: "图书", value: data.bookCount || 0, color: "#6366f1" },
    { name: "借阅", value: data.borrowCount || 0, color: "#10b981" },
    { name: "逾期", value: data.overdueRecordCount || 0, color: "#f59e0b" },
    { name: "在借", value: data.activeBorrowCount || 0, color: "#f43f5e" }
  ];

  const max = Math.max(...values.map(v => v.value), 1);
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b1226";
  ctx.fillRect(0, 0, width, height);

  const padding = 45;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const barW = Math.floor(chartW / (values.length * 1.8));
  const gap = Math.floor((chartW - barW * values.length) / (values.length - 1));

  ctx.strokeStyle = "rgba(148,163,184,0.45)";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  values.forEach((item, i) => {
    const x = padding + i * (barW + gap);
    const barH = Math.round((item.value / max) * (chartH - 18));
    const y = height - padding - barH;

    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px Segoe UI";
    ctx.fillText(item.name, x + 2, height - padding + 16);
    ctx.fillText(String(item.value), x + 2, y - 8);
  });
}

async function createAdmin() {
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
  if (!isAdmin()) return;
  try {
    const res = await req("/api/admin/users");
    const tbody = document.getElementById("userTable");
    tbody.innerHTML = (res.data || []).map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.realName || ""}</td>
        <td>${u.phone || ""}</td>
        <td>${u.role || ""}</td>
        <td>${u.createdAt || ""}</td>
        <td>
          <button onclick='resetUserPassword(${u.id}, ${JSON.stringify(u.username || "")})'>重置密码</button>
        </td>
      </tr>
    `).join("");
  } catch (e) {
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
    const realName = document.getElementById("profileRealName").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();
    const idCard = document.getElementById("profileIdCard").value.trim();
    const res = await req("/api/users/me", "PUT", { realName, phone, idCard });
    state.user = res.data;
    localStorage.setItem("user", JSON.stringify(state.user));
    refreshUI();
    show("个人信息已更新");
  } catch (e) {
    show(e.message);
  }
}

function fillCategoryOptions(categories) {
  const filter = document.getElementById("categoryFilter");
  const bookCategory = document.getElementById("bookCategory");
  filter.innerHTML = `<option value="">全部分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
  if (bookCategory) {
    bookCategory.innerHTML = `<option value="">请选择分类</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
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
    tbody.innerHTML = state.categories.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.description || ""}</td>
        <td>
          <button onclick="editCategory(${c.id})">编辑</button>
          <button onclick="deleteCategory(${c.id})">删除</button>
        </td>
      </tr>
    `).join("");
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
  if (!category) return;
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
    if (isAdmin()) await loadAdminBooks();
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

function resetBookForm() {
  state.editingBookId = null;
  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookPublisher").value = "";
  document.getElementById("bookIsbn").value = "";
  document.getElementById("bookCategory").value = "";
  document.getElementById("bookStock").value = "";
}

async function loadAdminBooks() {
  if (!isAdmin()) return;
  try {
    const res = await req("/api/books");
    const tbody = document.getElementById("adminBookTable");
    tbody.innerHTML = (res.data || []).map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.isbn}</td>
        <td>${b.category || ""}</td>
        <td>${b.stock}</td>
        <td>${b.availableStock}</td>
        <td>
          <button onclick="editBook(${b.id})">编辑</button>
          <button onclick="deleteBook(${b.id})">删除</button>
        </td>
      </tr>
    `).join("");
  } catch (e) {
    show(e.message);
  }
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

async function scanOverdue() {
  try {
    const res = await req("/api/borrow/scan-overdue", "POST");
    document.getElementById("adminOutput").textContent = JSON.stringify(res.data, null, 2);
    show("逾期扫描完成");
  } catch (e) { show(e.message); }
}

(async function init() {
  const valid = await validateSessionOnStartup();
  if (!valid) {
    window.location.href = "/login.html";
    return;
  }
  refreshUI();
  await loadProfile();
  await loadCategories();
  loadBooks();
  if (!isAdmin()) {
    loadMyRecords();
  } else {
    loadAdminBooks();
    loadUsers();
    loadStats();
  }
})();
