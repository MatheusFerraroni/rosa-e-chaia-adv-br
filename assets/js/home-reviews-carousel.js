(() => {
  const element = document.querySelector("#avaliacoesGoogleCarousel");
  const Carousel = window.bootstrap?.Carousel;

  if (!element || typeof Carousel !== "function") {
    return;
  }

  const carousel = new Carousel(element, {
    interval: 6500,
    keyboard: true,
    pause: false,
    ride: false,
    touch: true,
    wrap: true,
  });
  let pausedByUser = false;

  const pauseAfterInteraction = () => {
    if (pausedByUser) {
      return;
    }

    pausedByUser = true;
    carousel.pause();
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

  carousel.cycle();
})();
