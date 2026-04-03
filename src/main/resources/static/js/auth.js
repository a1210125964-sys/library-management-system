const state = window.AppState.createInitialState();
const req = window.HttpClient.create();

function show(msg) {
  window.Toast.show(msg);
}

function parseStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function resolvePostLoginUrl(user) {
  if (user && user.role === "ADMIN") {
    return "/admin/index.html";
  }
  return "/user/dashboard.html";
}

function setPrimaryButtonLoading(loading) {
  const btn = document.querySelector(".auth-card .btn");
  if (!btn) {
    return;
  }
  if (loading) {
    btn.dataset.originText = btn.textContent;
    btn.textContent = "处理中...";
    btn.disabled = true;
    btn.style.opacity = "0.82";
  } else {
    btn.textContent = btn.dataset.originText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}

function validateRegisterForm({ username, realName, phone, idCard, password }) {
  if (!username || !realName || !phone || !idCard || !password) {
    throw new Error("请完整填写注册信息");
  }
  if (username.length < 3 || username.length > 50) {
    throw new Error("用户名长度需在 3~50 位之间");
  }
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error("请输入合法的 11 位手机号");
  }
  if (password.length < 6) {
    throw new Error("密码长度不能少于 6 位");
  }
}

async function login() {
  setPrimaryButtonLoading(true);
  try {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!username || !password) {
      throw new Error("请输入用户名和密码");
    }
    const res = await req("/api/auth/login", "POST", { username, password });
    const accessToken = res.data.accessToken || res.data.token;
    const refreshToken = res.data.refreshToken || "";
    if (!accessToken) {
      throw new Error("登录响应缺少访问令牌");
    }
    localStorage.setItem("token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
    localStorage.setItem("user", JSON.stringify(res.data));
    window.location.href = resolvePostLoginUrl(res.data);
  } catch (e) {
    show(e.message);
  } finally {
    setPrimaryButtonLoading(false);
  }
}

async function register() {
  setPrimaryButtonLoading(true);
  try {
    const username = document.getElementById("username").value.trim();
    const realName = document.getElementById("realName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const idCard = document.getElementById("idCard").value.trim();
    const password = document.getElementById("password").value.trim();
    validateRegisterForm({ username, realName, phone, idCard, password });
    await req("/api/auth/register", "POST", { username, realName, phone, idCard, password });
    show("注册成功，正在跳转登录");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 700);
  } catch (e) {
    show(e.message);
  } finally {
    setPrimaryButtonLoading(false);
  }
}

async function validateSession() {
  if (!state.token || !state.user) return false;
  const headers = { "Content-Type": "application/json", "X-Token": state.token };
  const res = await fetch("/api/users/me", { headers });
  if (!res.ok) {
    return false;
  }
  const payload = await res.json();
  const latestUser = payload && payload.data ? payload.data : parseStoredUser();
  if (latestUser) {
    localStorage.setItem("user", JSON.stringify(latestUser));
  }
  return true;
}

(async function init() {
  const page = window.location.pathname;
  if (page === "/login.html" || page === "/register.html") {
    const valid = await validateSession();
    if (valid) {
      window.location.href = resolvePostLoginUrl(parseStoredUser() || state.user);
      return;
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    if (page === "/login.html") {
      login();
    } else if (page === "/register.html") {
      register();
    }
  });
})();
