(() => {
  const widget = document.querySelector(".whatsapp-float");
  const footer = document.querySelector(".site-footer");
  const body = document.body;
  const footerGap = 16;
  const anchoredClass = "whatsapp-float--anchored";

  if (!widget || !footer || !body) {
    return;
  }

  let ticking = false;
  let resizeObserver = null;

  body.classList.add("has-whatsapp-float");

  const getFixedBottom = () => {
    const wasAnchored = widget.classList.contains(anchoredClass);
    widget.classList.remove(anchoredClass);
    const value = Number.parseFloat(getComputedStyle(widget).bottom);

    if (wasAnchored) {
      widget.classList.add(anchoredClass);
    }

    return Number.isFinite(value) ? value : 16;
  };

  const getViewport = () => {
    const viewport = window.visualViewport;

    return {
      height: viewport?.height ?? window.innerHeight,
      top:
        window.scrollY +
        (Number.isFinite(viewport?.offsetTop) ? viewport.offsetTop : 0),
    };
  };

  const updatePosition = () => {
    const viewport = getViewport();
    const fixedBottom = getFixedBottom();
    const widgetHeight = widget.getBoundingClientRect().height;
    const footerTop = window.scrollY + footer.getBoundingClientRect().top;
    const fixedTop =
      viewport.top + viewport.height - fixedBottom - widgetHeight;
    const anchoredTop = footerTop - footerGap - widgetHeight;
    const shouldAnchor = fixedTop >= anchoredTop;
    const currentTop = shouldAnchor ? anchoredTop : fixedTop;
    const menuGap = 12;
    const viewportGap = 16;
    const menuMaxHeight = Math.max(
      0,
      Math.floor(currentTop - viewport.top - menuGap - viewportGap),
    );

    widget.style.setProperty(
      "--whatsapp-float-menu-max-height",
      `${menuMaxHeight}px`,
    );

    if (shouldAnchor) {
      widget.classList.add(anchoredClass);
      widget.style.setProperty(
        "--whatsapp-float-top",
        `${Math.round(anchoredTop)}px`,
      );
    } else {
      widget.classList.remove(anchoredClass);
      widget.style.removeProperty("--whatsapp-float-top");
    }

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
  window.addEventListener("privacyconsentchange", requestUpdate);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", requestUpdate);
    window.visualViewport.addEventListener("scroll", requestUpdate, {
      passive: true,
    });
  }

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(body);
    resizeObserver.observe(footer);
    resizeObserver.observe(widget);
  }

  requestUpdate();
})();
