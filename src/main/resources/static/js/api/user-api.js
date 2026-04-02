(function initUserApi(global) {
  const toQuery = (params) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      qs.set(key, String(value));
    });
    return qs.toString();
  };

  const create = (req, buildAppUrl) => {
    if (typeof req !== "function") {
      throw new Error("UserApi 需要有效的请求函数");
    }
    if (typeof buildAppUrl !== "function") {
      throw new Error("UserApi 需要 buildAppUrl 函数");
    }

    const get = (path, params) => {
      const query = toQuery(params);
      const url = query ? `${path}?${query}` : path;
      return req(buildAppUrl(url));
    };

    const post = (path, payload) => req(buildAppUrl(path), "POST", payload);

    return {
      getDashboard() {
        return get("/api/user/dashboard");
      },

      listBorrowings() {
        return get("/api/user/borrowings");
      },

      listHistory(params) {
        if (!params) {
          return get("/api/user/history");
        }
        return get("/api/user/history", {
          page: params.page,
          size: params.size
        });
      },

      getFines() {
        return get("/api/user/fines");
      },

      getProfile() {
        return get("/api/user/profile");
      },

      updateProfile(payload) {
        return req(buildAppUrl("/api/user/profile"), "PUT", payload);
      },

      renewBorrow(recordId) {
        return post(`/api/borrow/renew/${recordId}`);
      },

      returnBorrow(recordId) {
        return post(`/api/borrow/return/${recordId}`);
      }
    };
  };

  global.UserApi = {
    create
  };
})(window);
