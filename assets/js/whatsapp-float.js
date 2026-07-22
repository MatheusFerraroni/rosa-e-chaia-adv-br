(() => {
  const widget = document.querySelector(".whatsapp-float");
  const footer = document.querySelector(".site-footer");

  if (!widget || !footer) {
    return;
  }

  let ticking = false;

  const getBaseBottom = () => {
    const value = Number.parseFloat(getComputedStyle(widget).getPropertyValue("--whatsapp-float-base-bottom"));
    return Number.isFinite(value) ? value : 16;
  };

  const updatePosition = () => {
    const baseBottom = getBaseBottom();
    const footerTop = footer.getBoundingClientRect().top;
    const overlap = window.innerHeight - footerTop + baseBottom;
    const nextBottom = Math.max(baseBottom, overlap);

    widget.style.setProperty("--whatsapp-float-bottom", `${Math.round(nextBottom)}px`);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(updatePosition);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);
  requestUpdate();
})();
