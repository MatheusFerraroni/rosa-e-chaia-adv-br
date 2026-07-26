(() => {
  const element = document.querySelector("#avaliacoesGoogleCarousel");
  const Carousel = window.bootstrap?.Carousel;

  if (!element || typeof Carousel !== "function") {
    return;
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const items = Array.from(element.querySelectorAll(".carousel-item"));
  const counterValue = element.querySelector(".home-reviews-counter-value");
  const counterLabel = element.querySelector(".home-reviews-counter-label");
  const carousel = new Carousel(element, {
    interval: 6500,
    keyboard: true,
    pause: false,
    ride: false,
    touch: true,
    wrap: true,
  });
  let pausedByUser = false;

  const updateCounter = (index) => {
    if (!counterValue || !counterLabel || items.length === 0) {
      return;
    }

    const activeIndex = Number.isInteger(index)
      ? index
      : items.findIndex((item) => item.classList.contains("active"));

    if (activeIndex < 0 || activeIndex >= items.length) {
      return;
    }

    const position = activeIndex + 1;
    counterValue.textContent = `${position} / ${items.length}`;
    counterLabel.textContent = `Avaliação ${position} de ${items.length}`;
  };

  const pauseAfterInteraction = () => {
    if (pausedByUser) {
      return;
    }

    pausedByUser = true;
    carousel.pause();
  };

  const handleMotionPreferenceChange = (event) => {
    if (event.matches) {
      carousel.pause();
      return;
    }

    if (!pausedByUser) {
      carousel.cycle();
    }
  };

  [
    "pointerdown",
    "touchstart",
    "focusin",
    "click",
    "keydown",
  ].forEach((eventName) => {
    element.addEventListener(eventName, pauseAfterInteraction, {
      passive: eventName === "touchstart",
    });
  });

  element.addEventListener("slid.bs.carousel", (event) => {
    updateCounter(event.to);
  });

  if (typeof reducedMotion?.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionPreferenceChange);
  } else if (typeof reducedMotion?.addListener === "function") {
    reducedMotion.addListener(handleMotionPreferenceChange);
  }

  if (!reducedMotion?.matches) {
    carousel.cycle();
  }

  updateCounter();
})();
