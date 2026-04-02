window.BorrowPage = {
  async load(page, handlers) {
    if (page === "borrowQuery") {
      await handlers.loadBorrowQueryRecords();
      await handlers.loadBorrowInventoryBooks(true);
      return true;
    }
    if (page === "returnBook") {
      await handlers.loadReturnableRecords();
      return true;
    }
    return false;
  }
};
