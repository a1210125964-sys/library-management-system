window.AdminBookPage = {
  async load(page, handlers) {
    if (page === "bookManage") {
      await handlers.loadCategories();
      await handlers.loadAdminBooks();
      return true;
    }
    if (page === "addBook") {
      await handlers.loadCategories();
      handlers.syncCategoryOptionsToAddBook();
      return true;
    }
    return false;
  }
};
