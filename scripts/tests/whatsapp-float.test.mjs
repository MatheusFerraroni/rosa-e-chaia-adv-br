import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const controllerSource = await fs.readFile(
  new URL("../../assets/js/whatsapp-float.js", import.meta.url),
  "utf8",
);

function createClassList() {
  const values = new Set();

  return {
    add: (...classNames) => classNames.forEach((name) => values.add(name)),
    contains: (className) => values.has(className),
    remove: (...classNames) =>
      classNames.forEach((name) => values.delete(name)),
  };
}

function createStyle() {
  const values = new Map();

  return {
    getPropertyValue: (name) => values.get(name) ?? "",
    removeProperty: (name) => values.delete(name),
    setProperty: (name, value) => values.set(name, value),
  };
}

function createEventTarget(properties = {}) {
  const listeners = new Map();

  return {
    ...properties,
    addEventListener(type, listener) {
      const registered = listeners.get(type) ?? [];
      registered.push(listener);
      listeners.set(type, registered);
    },
    dispatch(type) {
      for (const listener of listeners.get(type) ?? []) {
        listener({ type });
      }
    },
    listenerCount(type) {
      return listeners.get(type)?.length ?? 0;
    },
  };
}

function createHarness({
  includeFooter = true,
  includeVisualViewport = true,
  includeWidget = true,
} = {}) {
  const state = {
    fixedBottom: 16,
    footerTop: 900,
    visualHeight: 800,
    visualOffsetTop: 0,
    widgetHeight: 48,
  };
  const frames = [];
  const resizeObservers = [];
  const body = {
    classList: createClassList(),
  };
  const widget = includeWidget
    ? {
        classList: createClassList(),
        getBoundingClientRect: () => ({ height: state.widgetHeight }),
        style: createStyle(),
      }
    : null;
  const footer = includeFooter
    ? {
        getBoundingClientRect: () => ({ top: state.footerTop }),
      }
    : null;
  const visualViewport = includeVisualViewport ? createEventTarget() : undefined;

  if (visualViewport) {
    Object.defineProperties(visualViewport, {
      height: {
        get: () => state.visualHeight,
      },
      offsetTop: {
        get: () => state.visualOffsetTop,
      },
    });
  }
  const windowObject = createEventTarget({
    innerHeight: 800,
    requestAnimationFrame(callback) {
      frames.push(callback);
      return frames.length;
    },
    scrollY: 100,
    visualViewport,
  });
  const documentObject = {
    body,
    querySelector(selector) {
      if (selector === ".whatsapp-float") {
        return widget;
      }
      if (selector === ".site-footer") {
        return footer;
      }
      return null;
    },
  };

  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      resizeObservers.push(this);
    }

    observe(element) {
      this.observed.push(element);
    }
  }

  vm.runInNewContext(controllerSource, {
    ResizeObserver: FakeResizeObserver,
    document: documentObject,
    getComputedStyle: () => ({
      bottom: `${state.fixedBottom}px`,
    }),
    window: windowObject,
  });

  return {
    body,
    footer,
    flushFrames() {
      while (frames.length > 0) {
        frames.shift()(0);
      }
    },
    frames,
    resizeObservers,
    state,
    visualViewport,
    widget,
    window: windowObject,
  };
}

test("não inicializa o controlador sem widget ou rodapé", () => {
  const withoutWidget = createHarness({ includeWidget: false });
  const withoutFooter = createHarness({ includeFooter: false });

  assert.equal(withoutWidget.frames.length, 0);
  assert.equal(withoutWidget.window.listenerCount("scroll"), 0);
  assert.equal(withoutWidget.body.classList.contains("has-whatsapp-float"), false);
  assert.equal(withoutFooter.frames.length, 0);
  assert.equal(withoutFooter.window.listenerCount("scroll"), 0);
  assert.equal(withoutFooter.body.classList.contains("has-whatsapp-float"), false);
});

test("alterna continuamente entre posição fixa e âncora do rodapé", () => {
  const harness = createHarness();
  harness.flushFrames();

  assert.equal(harness.body.classList.contains("has-whatsapp-float"), true);
  assert.equal(
    harness.widget.classList.contains("whatsapp-float--anchored"),
    false,
  );
  assert.equal(
    harness.widget.style.getPropertyValue("--whatsapp-float-top"),
    "",
  );

  harness.state.footerTop = 800;
  harness.window.dispatch("scroll");
  harness.flushFrames();

  assert.equal(
    harness.widget.classList.contains("whatsapp-float--anchored"),
    true,
  );
  assert.equal(
    harness.widget.style.getPropertyValue("--whatsapp-float-top"),
    "836px",
  );

  harness.state.footerTop = 760;
  harness.window.dispatch("scroll");
  harness.flushFrames();

  assert.equal(
    harness.widget.style.getPropertyValue("--whatsapp-float-top"),
    "796px",
  );

  harness.state.footerTop = 900;
  harness.window.dispatch("scroll");
  harness.flushFrames();

  assert.equal(
    harness.widget.classList.contains("whatsapp-float--anchored"),
    false,
  );
  assert.equal(
    harness.widget.style.getPropertyValue("--whatsapp-float-top"),
    "",
  );
});

test("reage à viewport visual, ao consentimento e a mudanças de tamanho", () => {
  const harness = createHarness();
  harness.state.visualHeight = 600;
  harness.state.visualOffsetTop = 20;
  harness.flushFrames();

  assert.equal(
    harness.widget.style.getPropertyValue(
      "--whatsapp-float-menu-max-height",
    ),
    "508px",
  );

  harness.state.visualHeight = 540;
  harness.visualViewport.dispatch("resize");
  harness.flushFrames();

  assert.equal(
    harness.widget.style.getPropertyValue(
      "--whatsapp-float-menu-max-height",
    ),
    "448px",
  );

  harness.state.visualHeight = 800;
  harness.state.visualOffsetTop = 0;
  harness.state.footerTop = 760;
  harness.resizeObservers[0].callback();
  harness.flushFrames();
  assert.equal(
    harness.widget.classList.contains("whatsapp-float--anchored"),
    true,
  );

  harness.state.fixedBottom = 240;
  harness.window.dispatch("privacyconsentchange");
  harness.flushFrames();
  assert.equal(
    harness.widget.classList.contains("whatsapp-float--anchored"),
    false,
  );
});

test("agrupa eventos repetidos em um único animation frame", () => {
  const harness = createHarness({ includeVisualViewport: false });
  harness.flushFrames();

  harness.window.dispatch("scroll");
  harness.window.dispatch("scroll");
  harness.window.dispatch("resize");

  assert.equal(harness.frames.length, 1);
  harness.flushFrames();
  assert.equal(harness.frames.length, 0);
});
