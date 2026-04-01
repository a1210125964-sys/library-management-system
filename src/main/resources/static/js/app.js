const state = {
  token: localStorage.getItem("token") || "",
  user: JSON.parse(localStorage.getItem("user") || "null")
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "请求失败");
  return data;
}

function refreshUI() {
  const isLogin = !!state.user;
  document.getElementById("bookCard").classList.toggle("hidden", !isLogin);
  document.getElementById("borrowCard").classList.toggle("hidden", !isLogin);
  document.getElementById("logoutBtn").classList.toggle("hidden", !isLogin);
  const isAdmin = state.user && state.user.role === "ADMIN";
  document.getElementById("adminCard").classList.toggle("hidden", !isAdmin);
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
    const res = await req(`/api/books${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`);
    const tbody = document.getElementById("bookTable");
    tbody.innerHTML = res.data.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.isbn}</td>
        <td>${b.stock}</td>
        <td>${b.availableStock}</td>
        <td><button onclick="borrow(${b.id})">借阅</button></td>
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
  } catch (e) { show(e.message); }
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
  loadBooks();
  loadMyRecords();
})();
