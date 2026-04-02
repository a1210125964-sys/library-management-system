const state = {
  token: localStorage.getItem("token") || "",
  refreshToken: localStorage.getItem("refreshToken") || "",
  user: JSON.parse(localStorage.getItem("user") || "null")
};

function show(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 1800);
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

async function req(url, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "请求失败");
  return data;
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
    window.location.href = "/";
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
    if (!username || !realName || !phone || !idCard || !password) {
      throw new Error("请完整填写注册信息");
    }
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
  if (!res.ok) return false;
  return true;
}

(async function init() {
  const page = window.location.pathname;
  if (page === "/login.html" || page === "/register.html") {
    const valid = await validateSession();
    if (valid) window.location.href = "/";
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
