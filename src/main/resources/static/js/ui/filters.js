(function initFilterBar(global) {
  const bindEnterToSubmit = (inputEl, handler) => {
    if (!inputEl || typeof handler !== "function") {
      return;
    }
    inputEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      handler();
    });
  };

  const resetInputs = (inputEls) => {
    if (!Array.isArray(inputEls)) {
      return;
    }
    inputEls.forEach((el) => {
      if (!el) {
        return;
      }
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      } else {
        el.value = "";
      }
      el.dispatchEvent(new Event("change"));
    });
  };

  global.FilterBar = {
    bindEnterToSubmit,
    resetInputs
  };
})(window);
