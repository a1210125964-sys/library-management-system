window.AppState = {
  createInitialState() {
    return {
      token: localStorage.getItem("token") || "",
      refreshToken: localStorage.getItem("refreshToken") || "",
      user: JSON.parse(localStorage.getItem("user") || "null"),
      categories: [],
      users: [],
      editingBookId: null,
      editingCategoryId: null,
      activePage: "borrowQuery",
      theme: localStorage.getItem("theme") || "system",
      borrowInventoryPage: 1,
      borrowInventoryPageSize: 5,
      borrowInventoryTotalPages: 1,
      adminBooks: [],
      adminBookPage: 1,
      adminBookPageSize: 8,
      adminBookSortKey: "id",
      adminBookSortOrder: "asc",
      adminSelectedBookIds: new Set(),
      studentPage: 1,
      studentPageSize: 10,
      studentTotalPages: 1,
      adminLogPage: 1,
      adminLogPageSize: 10,
      adminLogTotalPages: 1,
      adminLogOperation: "",
      adminLogStartTime: "",
      adminLogEndTime: ""
    };
  },
  clearSession(state) {
    state.token = "";
    state.refreshToken = "";
    state.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
};
