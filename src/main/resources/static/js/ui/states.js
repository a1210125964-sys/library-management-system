(function initStateView(global) {
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const tableMessage = (tbodyEl, colspan, text, type) => {
    if (!tbodyEl) {
      return;
    }
    const safeColspan = Math.max(1, Number(colspan) || 1);
    const stateType = type || "empty";
    const safeText = escapeHtml(text || "暂无数据");
    tbodyEl.innerHTML = `<tr class="status-row status-${stateType}"><td colspan="${safeColspan}">${safeText}</td></tr>`;
  };

  global.StateView = {
    tableMessage
  };
})(window);
