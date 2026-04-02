(function initPager(global) {
  const toInt = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  };

  const normalize = (pagination) => {
    const source = pagination || {};

    const page = Math.max(1, toInt(source.page, toInt(source.number, 0) + 1));
    const size = Math.max(1, toInt(source.size, 10));
    const totalPages = Math.max(1, toInt(source.totalPages, 1));
    const totalElements = Math.max(0, toInt(source.totalElements, 0));

    return {
      page,
      size,
      totalPages,
      totalElements,
      isFirst: page <= 1,
      isLast: page >= totalPages
    };
  };

  global.Pager = {
    normalize
  };
})(window);
