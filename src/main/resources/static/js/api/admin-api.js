(function initAdminApi(global) {
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
      throw new Error("AdminApi 需要有效的请求函数");
    }
    if (typeof buildAppUrl !== "function") {
      throw new Error("AdminApi 需要 buildAppUrl 函数");
    }

    const get = (path, params) => {
      const query = toQuery(params);
      const url = query ? `${path}?${query}` : path;
      return req(buildAppUrl(url));
    };

    return {
      getStats() {
        return get("/api/admin/stats");
      },

      listNotices({ page = 0, size = 10 } = {}) {
        return get("/api/admin/notices", { page, size });
      },

      createNotice(payload) {
        return req(buildAppUrl("/api/admin/notices"), "POST", payload);
      },

      updateNotice(id, payload) {
        return req(buildAppUrl(`/api/admin/notices/${id}`), "PUT", payload);
      },

      deleteNotice(id) {
        return req(buildAppUrl(`/api/admin/notices/${id}`), "DELETE");
      },

      listBooks({ page = 0, size = 10, keyword = "" } = {}) {
        return get("/api/books", { page, size, keyword });
      },

      listUsers({ page = 0, size = 10, role = "" } = {}) {
        return get("/api/admin/users", { page, size, role });
      },

      listLogs({ page = 0, size = 10, operation = "", startTime = "", endTime = "" } = {}) {
        return get("/api/admin/logs", { page, size, operation, startTime, endTime });
      },

      listRecords({ page = 0, size = 10, status = "", keyword = "" } = {}) {
        return get("/api/admin/records", { page, size, status, keyword });
      }
    };
  };

  global.AdminApi = {
    create
  };
})(window);
