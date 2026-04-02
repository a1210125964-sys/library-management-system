(function initCatalogPage() {
  if (!window.location.pathname.endsWith("/catalog.html")) {
    return;
  }

  const req = window.HttpClient.create();
  const state = {
    page: 0,
    size: 9,
    keyword: "",
    totalPages: 1,
    totalElements: 0
  };

  const listEl = document.getElementById("catalogList");
  const emptyEl = document.getElementById("catalogEmpty");
  const pageInfoEl = document.getElementById("catalogPageInfo");
  const prevBtn = document.getElementById("catalogPrevBtn");
  const nextBtn = document.getElementById("catalogNextBtn");
  const keywordInput = document.getElementById("catalogKeyword");
  const searchForm = document.getElementById("catalogSearchForm");
  const resetBtn = document.getElementById("catalogResetBtn");

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  function renderBooks(books) {
    if (!listEl || !emptyEl) {
      return;
    }

    if (!books.length) {
      listEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    listEl.innerHTML = books.map((book) => `
      <article class="glass-card resource-card">
        <h3>${escapeHtml(book.title)}</h3>
        <p class="meta-text">作者：${escapeHtml(book.author || "未知")}</p>
        <p class="meta-text">分类：${escapeHtml(book.category || "未分类")}</p>
        <p class="meta-text">ISBN：${escapeHtml(book.isbn || "-")}</p>
        <div class="resource-foot">
          <span>库存：${Number(book.stock || 0)}</span>
          <strong>可借：${Number(book.availableStock || 0)}</strong>
        </div>
      </article>
    `).join("");
  }

  function syncPager() {
    const total = Math.max(state.totalPages, 1);
    const current = state.page + 1;

    if (pageInfoEl) {
      pageInfoEl.textContent = `第 ${current} / ${total} 页，共 ${state.totalElements} 条`;
    }

    if (prevBtn) {
      prevBtn.disabled = state.page <= 0;
    }

    if (nextBtn) {
      nextBtn.disabled = state.page >= total - 1;
    }
  }

  async function loadBooks() {
    if (pageInfoEl) {
      pageInfoEl.textContent = "加载中...";
    }

    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("size", String(state.size));
    if (state.keyword) {
      params.set("keyword", state.keyword);
    }

    try {
      const res = await req(`/api/public/books?${params.toString()}`);
      const books = Array.isArray(res.data) ? res.data : [];
      const pagination = res.pagination || {};

      state.totalPages = Number(pagination.totalPages || 1);
      state.totalElements = Number(pagination.totalElements || books.length || 0);

      renderBooks(books);
    } catch (error) {
      state.totalPages = 1;
      state.totalElements = 0;
      if (listEl) {
        listEl.innerHTML = "";
      }
      if (emptyEl) {
        emptyEl.textContent = error.message || "馆藏数据加载失败";
        emptyEl.classList.remove("hidden");
      }
    }

    syncPager();
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.keyword = (keywordInput?.value || "").trim();
      state.page = 0;
      loadBooks();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.keyword = "";
      state.page = 0;
      if (keywordInput) {
        keywordInput.value = "";
      }
      loadBooks();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.page <= 0) {
        return;
      }
      state.page -= 1;
      loadBooks();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (state.page >= Math.max(state.totalPages, 1) - 1) {
        return;
      }
      state.page += 1;
      loadBooks();
    });
  }

  loadBooks();
})();
