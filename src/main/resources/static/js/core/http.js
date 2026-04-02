window.HttpClient = {
  create(options = {}) {
    const getToken = options.getToken || (() => "");
    const onUnauthorized = options.onUnauthorized || (() => {});
    const defaultAttachToken = options.attachToken !== false;

    return async function req(url, method = "GET", body = null, requestOptions = {}) {
      const attachToken = requestOptions.attachToken !== undefined
        ? requestOptions.attachToken
        : defaultAttachToken;
      const token = attachToken ? getToken() : "";

      const headers = { ...(requestOptions.headers || {}) };
      if (body !== null && body !== undefined && !(body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      if (token) {
        headers["X-Token"] = token;
      }

      const payload = body instanceof FormData
        ? body
        : (body !== null && body !== undefined ? JSON.stringify(body) : null);

      const res = await fetch(url, {
        method,
        headers,
        body: payload
      });

      const isJson = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJson
        ? await res.json().catch(() => ({ message: "请求失败" }))
        : { message: await res.text().catch(() => "请求失败") };

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
