window.AdminUserPage = {
  async load(page, handlers) {
    if (page === "studentManage") {
      await handlers.loadStudentUsers();
      return true;
    }
    if (page === "addAdmin") {
      await handlers.loadAdminUsers();
      return true;
    }
    return false;
  }
};
