(function initNewsPages() {
  const path = window.location.pathname;
  const onNewsList = path.endsWith("/news.html");
  const onNewsDetail = path.endsWith("/news-detail.html");

  if (!onNewsList && !onNewsDetail) {
    return;
  }

  const req = window.HttpClient.create();

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const formatTime = (value) => {
    if (!value) {
      return "发布时间待更新";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString("zh-CN", { hour12: false });
  };

  async function loadListPage() {
    const state = {
      page: 0,
      size: 8,
      totalPages: 1,
      totalElements: 0
    };

    const listEl = document.getElementById("noticeList");
    const emptyEl = document.getElementById("newsEmpty");
    const pageInfoEl = document.getElementById("newsPageInfo");
    const prevBtn = document.getElementById("newsPrevBtn");
    const nextBtn = document.getElementById("newsNextBtn");

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

    function renderNoticeList(notices) {
      if (!listEl || !emptyEl) {
        return;
      }

      if (!notices.length) {
        listEl.innerHTML = "";
        emptyEl.classList.remove("hidden");
        return;
      }

      emptyEl.classList.add("hidden");
      listEl.innerHTML = notices.map((notice) => `
        <article class="glass-card notice-card">
          <h3><a href="/news-detail.html?id=${Number(notice.id)}">${escapeHtml(notice.title)}</a></h3>
          <p class="meta-text">发布时间：${escapeHtml(formatTime(notice.publishedAt))}</p>
          <p>${escapeHtml(notice.summary || "暂无摘要")}</p>
          <a class="notice-link" href="/news-detail.html?id=${Number(notice.id)}">查看详情 →</a>
        </article>
      `).join("");
    }

    async function fetchNotices() {
      if (pageInfoEl) {
        pageInfoEl.textContent = "加载中...";
      }

      const params = new URLSearchParams();
      params.set("page", String(state.page));
      params.set("size", String(state.size));

      try {
        const res = await req(`/api/public/notices?${params.toString()}`);
        const notices = Array.isArray(res.data) ? res.data : [];
        const pagination = res.pagination || {};

        state.totalPages = Number(pagination.totalPages || 1);
        state.totalElements = Number(pagination.totalElements || notices.length || 0);
        renderNoticeList(notices);
      } catch (error) {
        state.totalPages = 1;
        state.totalElements = 0;
        if (listEl) {
          listEl.innerHTML = "";
        }
        if (emptyEl) {
          emptyEl.textContent = error.message || "公告数据加载失败";
          emptyEl.classList.remove("hidden");
        }
      }

      syncPager();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (state.page <= 0) {
          return;
        }
        state.page -= 1;
        fetchNotices();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (state.page >= Math.max(state.totalPages, 1) - 1) {
          return;
        }
        state.page += 1;
        fetchNotices();
      });
    }

    await fetchNotices();
  }

  async function loadDetailPage() {
    const titleEl = document.getElementById("noticeDetailTitle");
    const metaEl = document.getElementById("noticeDetailMeta");
    const summaryEl = document.getElementById("noticeDetailSummary");
    const contentEl = document.getElementById("noticeDetailContent");
    const cardEl = document.getElementById("noticeDetailCard");
    const errorEl = document.getElementById("newsDetailError");

    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!id) {
      if (cardEl) {
        cardEl.classList.add("hidden");
      }
      if (errorEl) {
        errorEl.textContent = "缺少公告编号，请返回公告列表重新选择。";
        errorEl.classList.remove("hidden");
      }
      if (titleEl) {
        titleEl.textContent = "公告不存在";
      }
      if (metaEl) {
        metaEl.textContent = "参数错误";
      }
      return;
    }

    try {
      const res = await req(`/api/public/notices/${id}`);
      const notice = res.data || {};

      if (titleEl) {
        titleEl.textContent = notice.title || "未命名公告";
      }
      if (metaEl) {
        metaEl.textContent = `发布时间：${formatTime(notice.publishedAt)}`;
      }
      if (summaryEl) {
        summaryEl.textContent = notice.summary || "";
      }
      if (contentEl) {
        contentEl.innerHTML = escapeHtml(notice.content || "").replace(/\n/g, "<br />");
      }
      if (cardEl) {
        cardEl.classList.remove("hidden");
      }
      if (errorEl) {
        errorEl.classList.add("hidden");
      }
    } catch (error) {
      if (cardEl) {
        cardEl.classList.add("hidden");
      }
      if (errorEl) {
        errorEl.textContent = error.message || "公告详情加载失败";
        errorEl.classList.remove("hidden");
      }
      if (titleEl) {
        titleEl.textContent = "公告加载失败";
      }
      if (metaEl) {
        metaEl.textContent = "请稍后重试";
      }
    }
  }

  if (onNewsList) {
    loadListPage();
    return;
  }

  loadDetailPage();
})();
