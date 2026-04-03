(function initUserPortalPages() {
  const path = window.location.pathname || "";
  const userPortalPath = "/user/";
  const userPortalIndex = path.indexOf(userPortalPath);
  const onUserPortalPage = userPortalIndex !== -1;
  if (!onUserPortalPage) {
    return;
  }

  const appBasePath = path.slice(0, userPortalIndex);
  const buildAppUrl = (targetPath) => {
    const normalizedPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    return `${appBasePath}${normalizedPath}`;
  };
  const loginUrl = buildAppUrl("/login.html");

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const redirectToLogin = () => {
    window.location.href = loginUrl;
  };

  const token = localStorage.getItem("token") || "";
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_error) {
    clearSession();
    redirectToLogin();
    return;
  }

  if (!token || !user) {
    clearSession();
    redirectToLogin();
    return;
  }

  if (String(user.role || "").toUpperCase() === "ADMIN") {
    window.location.href = buildAppUrl("/admin/index.html");
    return;
  }

  const normalizeText = (value, fallback) => {
    const text = String(value || "").trim();
    return text || fallback;
  };

  const displayName = normalizeText(user.realName, normalizeText(user.username, "读者"));

  document.querySelectorAll("#userDisplayName").forEach((el) => {
    el.textContent = displayName;
  });

  document.querySelectorAll("#userLogoutBtn").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      clearSession();
      redirectToLogin();
    });
  });

  const req = window.HttpClient.create({
    getToken: () => localStorage.getItem("token") || "",
    onUnauthorized: () => {
      clearSession();
      redirectToLogin();
    }
  });
  if (!window.UserApi || typeof window.UserApi.create !== "function") {
    const bootstrapError = document.getElementById("dashboardError")
      || document.getElementById("borrowingsEmpty")
      || document.getElementById("historyEmpty")
      || document.getElementById("finesEmpty")
      || document.getElementById("profileHint");
    if (bootstrapError) {
      bootstrapError.textContent = "页面初始化失败：UserApi 未加载";
      bootstrapError.classList.remove("hidden");
    }
    return;
  }
  if (!window.TableView || typeof window.TableView.renderRows !== "function") {
    const bootstrapError = document.getElementById("dashboardError")
      || document.getElementById("borrowingsEmpty")
      || document.getElementById("historyEmpty")
      || document.getElementById("finesEmpty")
      || document.getElementById("profileHint");
    if (bootstrapError) {
      bootstrapError.textContent = "页面初始化失败：TableView 未加载";
      bootstrapError.classList.remove("hidden");
    }
    return;
  }
  if (!window.FilterBar || typeof window.FilterBar.bindEnterToSubmit !== "function") {
    const bootstrapError = document.getElementById("dashboardError")
      || document.getElementById("borrowingsEmpty")
      || document.getElementById("historyEmpty")
      || document.getElementById("finesEmpty")
      || document.getElementById("profileHint");
    if (bootstrapError) {
      bootstrapError.textContent = "页面初始化失败：FilterBar 未加载";
      bootstrapError.classList.remove("hidden");
    }
    return;
  }
  const userApi = window.UserApi.create(req, buildAppUrl);
  const tableView = window.TableView;
  const filterBar = window.FilterBar;

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const asNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return escapeHtml(value);
    }
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const statusLabel = (status) => {
    const code = String(status || "").toUpperCase();
    if (code === "BORROWED") return "借阅中";
    if (code === "OVERDUE") return "已逾期";
    if (code === "RETURNED") return "已归还";
    return code || "-";
  };

  if (path.endsWith("/borrowings.html")) {
    const tbody = document.getElementById("borrowingsTableBody");
    const empty = document.getElementById("borrowingsEmpty");
    const reloadBtn = document.getElementById("borrowingsReloadBtn");
    const keywordInput = document.getElementById("borrowingsKeyword");
    const inventoryBody = document.getElementById("inventoryTableBody");
    const inventoryEmpty = document.getElementById("inventoryEmpty");
    const inventoryReloadBtn = document.getElementById("inventoryReloadBtn");
    const inventoryKeywordInput = document.getElementById("inventoryKeyword");
    const inventoryPrevBtn = document.getElementById("inventoryPrevBtn");
    const inventoryNextBtn = document.getElementById("inventoryNextBtn");
    const inventoryPageInfo = document.getElementById("inventoryPageInfo");
    const dueTimeModal = document.getElementById("dueTimeModal");
    const dueTimeInput = document.getElementById("dueTimeInput");
    const dueTimeTip = document.getElementById("dueTimeModalTip");
    const dueTimeConfirmBtn = document.getElementById("dueTimeConfirmBtn");
    const dueTimeCancelBtn = document.getElementById("dueTimeCancelBtn");

    const setLoading = (btn, loading) => {
      if (!btn) {
        return;
      }
      if (loading) {
        btn.disabled = true;
        btn.classList.add("btn-loading");
      } else {
        btn.disabled = false;
        btn.classList.remove("btn-loading");
      }
    };

    const toLocalInputValue = (date) => {
      const d = date instanceof Date ? date : new Date(date);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openDueTimeModal = ({ mode, baseTime }) => new Promise((resolve) => {
      if (!dueTimeModal || !dueTimeInput || !dueTimeConfirmBtn || !dueTimeCancelBtn) {
        resolve(null);
        return;
      }

      const startTime = new Date(baseTime);
      const minTime = new Date(startTime.getTime() + 60 * 1000);
      const maxTime = new Date(startTime);
      maxTime.setMonth(maxTime.getMonth() + 1);
      dueTimeInput.min = toLocalInputValue(minTime);
      dueTimeInput.max = toLocalInputValue(maxTime);
      dueTimeInput.value = toLocalInputValue(minTime);
      if (dueTimeTip) {
        dueTimeTip.textContent = mode === "renew"
          ? "续借后的应还时间需晚于当前应还时间，且不能超过 1 个月"
          : "借书应还时间需晚于当前时间，且不能超过 1 个月";
      }

      dueTimeModal.classList.remove("hidden");

      const close = (value) => {
        dueTimeModal.classList.add("hidden");
        dueTimeConfirmBtn.removeEventListener("click", onConfirm);
        dueTimeCancelBtn.removeEventListener("click", onCancel);
        dueTimeModal.removeEventListener("click", onMaskClick);
        resolve(value);
      };

      const onConfirm = () => {
        if (!dueTimeInput.value) {
          close(null);
          return;
        }
        close(dueTimeInput.value);
      };
      const onCancel = () => close(null);
      const onMaskClick = (event) => {
        if (event.target === dueTimeModal) {
          close(null);
        }
      };

      dueTimeConfirmBtn.addEventListener("click", onConfirm);
      dueTimeCancelBtn.addEventListener("click", onCancel);
      dueTimeModal.addEventListener("click", onMaskClick);
    });

    let borrowingsCache = [];

    const render = (rows) => {
      if (!tbody || !empty) {
        return;
      }
      const actionHtml = (row) => {
        const status = String(row.status || "").toUpperCase();
        const renewDisabled = status !== "BORROWED" || Number(row.renewCount || 0) >= 1;
        const returnDisabled = status === "RETURNED";
        return `
          <button class="btn btn-ghost btn-animated" type="button" data-action="renew" data-record-id="${escapeHtml(row.id)}" data-due-time="${escapeHtml(row.dueTime)}" ${renewDisabled ? "disabled" : ""}>续借</button>
          <button class="btn btn-ghost" type="button" data-action="return" data-record-id="${escapeHtml(row.id)}" ${returnDisabled ? "disabled" : ""}>归还</button>
        `;
      };

      const rowHtmlList = rows.map((row) => `
        <tr data-record-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.bookTitle)}</td>
          <td>${formatDateTime(row.borrowTime)}</td>
          <td>${formatDateTime(row.dueTime)}</td>
          <td>${statusLabel(row.status)}</td>
          <td>${escapeHtml(row.overdueFee ?? 0)}</td>
          <td>${actionHtml(row)}</td>
        </tr>
      `);
      tableView.renderRows(tbody, rowHtmlList, "当前无在借图书。", 7);
      empty.classList.add("hidden");
    };

    const applyBorrowingsFilter = () => {
      const keyword = String(keywordInput?.value || "").trim().toLowerCase();
      if (!keyword) {
        render(borrowingsCache);
        return;
      }
      const filteredRows = borrowingsCache.filter((row) => String(row.bookTitle || "").toLowerCase().includes(keyword));
      render(filteredRows);
    };

    const loadBorrowings = async () => {
      try {
        const res = await userApi.listBorrowings();
        borrowingsCache = Array.isArray(res.data) ? res.data : [];
        applyBorrowingsFilter();
      } catch (error) {
        tableView.renderRows(tbody, [], "当前无在借图书。", 7);
        if (empty) {
          empty.textContent = error.message || "借阅数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    const parseRecordId = (actionEl) => {
      const fromAction = actionEl?.dataset?.recordId || actionEl?.getAttribute("data-record-id");
      const fromRow = actionEl?.closest("tr")?.dataset?.recordId || actionEl?.closest("tr")?.getAttribute("data-record-id");
      const raw = fromAction ?? fromRow;
      const id = Number(raw);
      return Number.isInteger(id) && id > 0 ? id : null;
    };

    const runBorrowAction = async (action, recordId, triggerEl) => {
      if (triggerEl) {
        setLoading(triggerEl, true);
      }
      try {
        if (action === "renew") {
          const currentDueTime = triggerEl?.dataset?.dueTime || new Date().toISOString();
          const selectedDueTime = await openDueTimeModal({
            mode: "renew",
            baseTime: currentDueTime
          });
          if (!selectedDueTime) {
            return;
          }
          await userApi.renewBorrow(recordId, selectedDueTime);
        } else if (action === "return") {
          await userApi.returnBorrow(recordId);
        }
        await loadBorrowings();
      } catch (error) {
        if (empty) {
          empty.textContent = error.message || "借阅操作失败";
          empty.classList.remove("hidden");
        }
      } finally {
        if (triggerEl) {
          setLoading(triggerEl, false);
        }
      }
    };

    let inventoryPage = 0;
    let inventorySize = 8;
    let inventoryTotalPages = 1;
    let inventoryKeyword = "";

    const renderInventoryPaging = () => {
      if (inventoryPageInfo) {
        inventoryPageInfo.textContent = `第 ${inventoryPage + 1} / ${inventoryTotalPages} 页`;
      }
      if (inventoryPrevBtn) {
        inventoryPrevBtn.disabled = inventoryPage <= 0;
      }
      if (inventoryNextBtn) {
        inventoryNextBtn.disabled = inventoryPage >= inventoryTotalPages - 1;
      }
    };

    const renderInventory = (rows) => {
      if (!inventoryBody || !inventoryEmpty) {
        return;
      }
      const rowHtmlList = rows.map((book) => {
        const available = asNumber(book.availableStock);
        return `
          <tr data-book-id="${escapeHtml(book.id)}">
            <td>${escapeHtml(book.id)}</td>
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.category || "-")}</td>
            <td>${available}</td>
            <td>
              <button class="btn btn-ghost btn-animated" type="button" data-action="borrow" data-book-id="${escapeHtml(book.id)}" ${available > 0 ? "" : "disabled"}>借书</button>
            </td>
          </tr>
        `;
      });
      tableView.renderRows(inventoryBody, rowHtmlList, "暂无可借图书。", 6);
      inventoryEmpty.classList.add("hidden");
      renderInventoryPaging();
    };

    const loadInventory = async ({ page = inventoryPage, keyword = inventoryKeyword } = {}) => {
      try {
        const res = await userApi.listCatalogBooks({
          page,
          size: inventorySize,
          keyword
        });
        inventoryPage = Math.max(0, Number(res.pagination?.page ?? page));
        inventorySize = Math.max(1, Number(res.pagination?.size ?? inventorySize));
        inventoryTotalPages = Math.max(1, Number(res.pagination?.totalPages ?? 1));
        inventoryKeyword = keyword;
        const rows = Array.isArray(res.data) ? res.data : [];
        renderInventory(rows);
      } catch (error) {
        tableView.renderRows(inventoryBody, [], "暂无可借图书。", 6);
        if (inventoryEmpty) {
          inventoryEmpty.textContent = error.message || "可借图书加载失败";
          inventoryEmpty.classList.remove("hidden");
        }
      }
    };

    const parseBookId = (actionEl) => {
      const fromAction = actionEl?.dataset?.bookId || actionEl?.getAttribute("data-book-id");
      const fromRow = actionEl?.closest("tr")?.dataset?.bookId || actionEl?.closest("tr")?.getAttribute("data-book-id");
      const raw = fromAction ?? fromRow;
      const id = Number(raw);
      return Number.isInteger(id) && id > 0 ? id : null;
    };

    const borrowBook = async (bookId, triggerEl) => {
      if (triggerEl) {
        setLoading(triggerEl, true);
      }
      try {
        const selectedDueTime = await openDueTimeModal({
          mode: "borrow",
          baseTime: new Date()
        });
        if (!selectedDueTime) {
          return;
        }
        await userApi.borrowBook(bookId, selectedDueTime);
        await Promise.all([
          loadBorrowings(),
          loadInventory({ page: inventoryPage, keyword: inventoryKeyword })
        ]);
      } catch (error) {
        if (inventoryEmpty) {
          inventoryEmpty.textContent = error.message || "借书失败";
          inventoryEmpty.classList.remove("hidden");
        }
      } finally {
        if (triggerEl) {
          setLoading(triggerEl, false);
        }
      }
    };

    if (tbody) {
      tbody.addEventListener("click", async (event) => {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl || !tbody.contains(actionEl)) {
          return;
        }
        const action = String(actionEl.dataset.action || "").trim().toLowerCase();
        if (action !== "renew" && action !== "return") {
          return;
        }
        event.preventDefault();
        const recordId = parseRecordId(actionEl);
        if (!recordId) {
          if (empty) {
            empty.textContent = "借阅记录 ID 无效";
            empty.classList.remove("hidden");
          }
          return;
        }
        await runBorrowAction(action, recordId, actionEl);
      });
    }

    if (reloadBtn) {
      reloadBtn.addEventListener("click", async () => {
        setLoading(reloadBtn, true);
        try {
          await loadBorrowings();
        } finally {
          setLoading(reloadBtn, false);
        }
      });
    }
    if (keywordInput) {
      keywordInput.addEventListener("input", applyBorrowingsFilter);
      filterBar.bindEnterToSubmit(keywordInput, applyBorrowingsFilter);
    }

    if (inventoryBody) {
      inventoryBody.addEventListener("click", async (event) => {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl || !inventoryBody.contains(actionEl)) {
          return;
        }
        const action = String(actionEl.dataset.action || "").trim().toLowerCase();
        if (action !== "borrow") {
          return;
        }
        event.preventDefault();
        const bookId = parseBookId(actionEl);
        if (!bookId) {
          if (inventoryEmpty) {
            inventoryEmpty.textContent = "图书 ID 无效";
            inventoryEmpty.classList.remove("hidden");
          }
          return;
        }
        await borrowBook(bookId, actionEl);
      });
    }

    if (inventoryReloadBtn) {
      inventoryReloadBtn.addEventListener("click", async () => {
        const keyword = String(inventoryKeywordInput?.value || "").trim();
        setLoading(inventoryReloadBtn, true);
        try {
          await loadInventory({ page: 0, keyword });
        } finally {
          setLoading(inventoryReloadBtn, false);
        }
      });
    }
    if (inventoryKeywordInput) {
      filterBar.bindEnterToSubmit(inventoryKeywordInput, () => {
        const keyword = String(inventoryKeywordInput.value || "").trim();
        loadInventory({ page: 0, keyword });
      });
    }
    if (inventoryPrevBtn) {
      inventoryPrevBtn.addEventListener("click", () => {
        if (inventoryPage <= 0) {
          return;
        }
        loadInventory({ page: inventoryPage - 1, keyword: inventoryKeyword });
      });
    }
    if (inventoryNextBtn) {
      inventoryNextBtn.addEventListener("click", () => {
        if (inventoryPage >= inventoryTotalPages - 1) {
          return;
        }
        loadInventory({ page: inventoryPage + 1, keyword: inventoryKeyword });
      });
    }

    loadBorrowings();
    loadInventory();
    return;
  }

  if (path.endsWith("/history.html")) {
    const tbody = document.getElementById("historyTableBody");
    const empty = document.getElementById("historyEmpty");
    const reloadBtn = document.getElementById("historyReloadBtn");
    const statusFilter = document.getElementById("historyStatusFilter");
    const prevBtn = document.getElementById("historyPrevBtn");
    const nextBtn = document.getElementById("historyNextBtn");
    const pageInfoEl = document.getElementById("historyPageInfo");

    let historyCache = [];

    const render = (rows) => {
      if (!tbody || !empty) {
        return;
      }
      const rowHtmlList = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.bookTitle)}</td>
          <td>${formatDateTime(row.borrowTime)}</td>
          <td>${formatDateTime(row.returnTime)}</td>
          <td>${statusLabel(row.status)}</td>
          <td>${escapeHtml(row.overdueFee ?? 0)}</td>
        </tr>
      `);
      tableView.renderRows(tbody, rowHtmlList, "暂无历史借阅记录。", 6);
      empty.classList.add("hidden");
    };

    const applyHistoryFilter = () => {
      const status = String(statusFilter?.value || "ALL").toUpperCase();
      if (status === "ALL") {
        render(historyCache);
        return;
      }
      render(historyCache.filter((row) => String(row.status || "").toUpperCase() === status));
    };

    const DEFAULT_PAGE = 0;
    const DEFAULT_SIZE = 10;
    let currentPage = DEFAULT_PAGE;
    let currentSize = DEFAULT_SIZE;
    let totalPages = 1;

    const renderPaging = () => {
      if (pageInfoEl) {
        pageInfoEl.textContent = `第 ${currentPage + 1} / ${totalPages} 页`;
      }
      if (prevBtn) {
        prevBtn.disabled = currentPage <= 0;
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages - 1;
      }
    };

    const loadHistory = async ({ page = currentPage, size = currentSize } = {}) => {
      try {
        const res = await userApi.listHistory({ page, size });
        currentPage = page;
        currentSize = size;
        totalPages = Math.max(1, Number(res.pagination?.totalPages || 1));
        historyCache = Array.isArray(res.data) ? res.data : [];
        applyHistoryFilter();
        renderPaging();
      } catch (error) {
        tableView.renderRows(tbody, [], "暂无历史借阅记录。", 6);
        if (empty) {
          empty.textContent = error.message || "历史数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPage <= 0) {
          return;
        }
        loadHistory({ page: currentPage - 1, size: currentSize });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentPage >= totalPages - 1) {
          return;
        }
        loadHistory({ page: currentPage + 1, size: currentSize });
      });
    }

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadHistory);
    }
    if (statusFilter) {
      statusFilter.addEventListener("change", applyHistoryFilter);
    }
    loadHistory();
    return;
  }

  if (path.endsWith("/fines.html")) {
    const tbody = document.getElementById("finesTableBody");
    const empty = document.getElementById("finesEmpty");
    const total = document.getElementById("finesTotal");
    const reloadBtn = document.getElementById("finesReloadBtn");
    const finesSort = document.getElementById("finesSort");

    let finesData = { totalFine: 0, records: [] };

    const render = (data) => {
      if (!tbody || !empty || !total) {
        return;
      }
      const sortDirection = String(finesSort?.value || "DESC").toUpperCase();
      const rows = (Array.isArray(data.records) ? data.records.slice() : [])
        .sort((a, b) => {
          const fa = asNumber(a.overdueFee);
          const fb = asNumber(b.overdueFee);
          return sortDirection === "ASC" ? fa - fb : fb - fa;
        });
      total.textContent = String(data.totalFine ?? 0);
      const rowHtmlList = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.bookTitle)}</td>
          <td>${escapeHtml(row.overdueDays)}</td>
          <td>${escapeHtml(row.overdueFee)}</td>
          <td>${formatDateTime(row.createdAt)}</td>
        </tr>
      `);
      tableView.renderRows(tbody, rowHtmlList, "暂无罚金记录。", 5);
      empty.classList.add("hidden");
    };

    const loadFines = async () => {
      try {
        const res = await userApi.getFines();
        finesData = res.data || { totalFine: 0, records: [] };
        render(finesData);
      } catch (error) {
        tableView.renderRows(tbody, [], "暂无罚金记录。", 5);
        if (empty) {
          empty.textContent = error.message || "罚金数据加载失败";
          empty.classList.remove("hidden");
        }
      }
    };

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadFines);
    }
    if (finesSort) {
      finesSort.addEventListener("change", () => render(finesData));
    }
    loadFines();
    return;
  }

  if (path.endsWith("/profile.html")) {
    const usernameEl = document.getElementById("profileUsername");
    const realNameEl = document.getElementById("profileRealName");
    const phoneEl = document.getElementById("profilePhone");
    const idCardEl = document.getElementById("profileIdCard");
    const form = document.getElementById("profileForm");
    const hint = document.getElementById("profileHint");
    const reloadBtn = document.getElementById("profileReloadBtn");
    const resetBtn = document.getElementById("profileResetBtn");

    let lastLoadedProfile = null;

    const fillProfile = (profile) => {
      if (usernameEl) usernameEl.value = profile.username || "";
      if (realNameEl) realNameEl.value = profile.realName || "";
      if (phoneEl) phoneEl.value = profile.phone || "";
      if (idCardEl) idCardEl.value = profile.idCard || "";
      if (hint) {
        hint.classList.add("hidden");
      }
    };

    const loadProfile = async () => {
      try {
        const res = await userApi.getProfile();
        lastLoadedProfile = res.data || {};
        fillProfile(lastLoadedProfile);
      } catch (error) {
        if (hint) {
          hint.textContent = error.message || "资料加载失败";
          hint.classList.remove("hidden");
        }
      }
    };

    if (reloadBtn) {
      reloadBtn.addEventListener("click", loadProfile);
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (lastLoadedProfile) {
          fillProfile(lastLoadedProfile);
          return;
        }
        filterBar.resetInputs([realNameEl, phoneEl, idCardEl]);
        if (hint) {
          hint.classList.add("hidden");
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          const res = await userApi.updateProfile({
            realName: realNameEl?.value?.trim() || "",
            phone: phoneEl?.value?.trim() || "",
            idCard: idCardEl?.value?.trim() || ""
          });
          const updatedUser = res?.data || null;
          if (updatedUser) {
            localStorage.setItem("user", JSON.stringify(updatedUser));
            document.querySelectorAll("#userDisplayName").forEach((el) => {
              el.textContent = updatedUser.realName || updatedUser.username || "读者";
            });
          }
          if (hint) {
            hint.textContent = "资料已更新";
            hint.classList.remove("hidden");
          }
          await loadProfile();
        } catch (error) {
          if (hint) {
            hint.textContent = error.message || "资料更新失败";
            hint.classList.remove("hidden");
          }
        }
      });
    }
    loadProfile();
    return;
  }

  if (!path.endsWith("/dashboard.html")) {
    return;
  }

  const activeBorrowEl = document.getElementById("kpiActiveBorrow");
  const overdueEl = document.getElementById("kpiOverdue");
  const noticesEl = document.getElementById("kpiNotices");
  const subtitleEl = document.getElementById("dashboardSubTitle");
  const errorEl = document.getElementById("dashboardError");

  function renderDashboard(data) {
    if (activeBorrowEl) {
      activeBorrowEl.textContent = String(asNumber(data.activeBorrowCount));
    }
    if (overdueEl) {
      overdueEl.textContent = String(asNumber(data.overdueCount));
    }
    if (noticesEl) {
      noticesEl.textContent = String(asNumber(data.publishedNoticeCount));
    }
    if (subtitleEl) {
      subtitleEl.textContent = "以下数据来自 /api/user/dashboard 实时聚合接口。";
    }
    if (errorEl) {
      errorEl.classList.add("hidden");
    }
  }

  function renderError(message) {
    if (activeBorrowEl) {
      activeBorrowEl.textContent = "--";
    }
    if (overdueEl) {
      overdueEl.textContent = "--";
    }
    if (noticesEl) {
      noticesEl.textContent = "--";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "指标加载失败，请稍后重试。";
    }
    if (errorEl) {
      errorEl.textContent = message || "用户中心数据加载失败";
      errorEl.classList.remove("hidden");
    }
  }

  async function loadDashboard() {
    try {
      const res = await userApi.getDashboard();
      renderDashboard(res.data || {});
    } catch (error) {
      renderError(error.message);
    }
  }

  loadDashboard();
})();
