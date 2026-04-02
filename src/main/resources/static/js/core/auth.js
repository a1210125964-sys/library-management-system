window.AuthCore = {
  isAdmin(user) {
    return !!(user && user.role === "ADMIN");
  }
};
