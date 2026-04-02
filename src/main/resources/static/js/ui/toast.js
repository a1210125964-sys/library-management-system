window.Toast = {
  show(msg) {
    const toast = document.getElementById("toast");
    if (!toast) {
      return;
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 1800);
  }
};
