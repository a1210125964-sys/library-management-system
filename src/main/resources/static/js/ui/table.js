(function initTableView(global) {
  const renderRows = (tbody, rowsHtml, emptyText, colspan) => {
    if (!tbody) {
      return;
    }
    const hasRows = Array.isArray(rowsHtml) && rowsHtml.length > 0;
    if (!hasRows) {
      const span = Number.isInteger(colspan) && colspan > 0 ? colspan : 1;
      tbody.innerHTML = `<tr><td colspan="${span}" class="empty-state">${String(emptyText || "暂无数据")}</td></tr>`;
      return;
    }
    tbody.innerHTML = rowsHtml.join("");
  };

  global.TableView = {
    renderRows
  };
})(window);
