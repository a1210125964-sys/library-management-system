(function initPageGuards(global) {
  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const redirectTo = (url) => {
    if (!url) {
      return;
    }
    window.location.href = url;
  };

  const parseUser = () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  };

  const requireRole = (role, loginUrl) => {
    const token = localStorage.getItem("token") || "";
    const user = parseUser();

    if (!token || !user) {
      clearSession();
      redirectTo(loginUrl);
      return null;
    }

    if (role && user.role !== role) {
      clearSession();
      redirectTo(loginUrl);
      return null;
    }

    return user;
  };

  global.PageGuards = {
    clearSession,
    requireRole
  };
})(window);
