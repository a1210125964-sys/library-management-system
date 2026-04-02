window.HttpClient = {
  create(options = {}) {
    const getToken = options.getToken || (() => "");
    const onUnauthorized = options.onUnauthorized || (() => {});

    return async function req(url, method = "GET", body = null) {
      const headers = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) {
        headers["X-Token"] = token;
      }
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      const data = await res.json().catch(() => ({ message: "请求失败" }));
      if (res.status === 401) {
        onUnauthorized();
      }
      if (!res.ok) {
        throw new Error(data.message || "请求失败");
      }
      return data;
    };
  }
};
