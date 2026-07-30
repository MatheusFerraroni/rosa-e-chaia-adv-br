import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_MEASUREMENT_ID,
  ANALYTICS_STORAGE_KEY,
  analyticsCookieDeletionAssignments,
  buildContactEvent,
  classifyContactHref,
  createAnalyticsController,
  parseStoredConsent,
  persistConsent,
  readStoredConsent,
  sanitizePageLocation,
} from "../../assets/js/analytics-consent.js";

class FakeStorage {
  constructor(initialValue = null, { fail = false } = {}) {
    this.fail = fail;
    this.value = initialValue;
  }

  getItem(key) {
    assert.equal(key, ANALYTICS_STORAGE_KEY);
    if (this.fail) {
      throw new Error("storage indisponível");
    }
    return this.value;
  }

  setItem(key, value) {
    assert.equal(key, ANALYTICS_STORAGE_KEY);
    if (this.fail) {
      throw new Error("storage indisponível");
    }
    this.value = value;
  }
}

class FakeStyle {
  values = new Map();

  setProperty(name, value) {
    this.values.set(name, value);
  }

  removeProperty(name) {
    this.values.delete(name);
  }
}

class FakeClassList {
  values = new Set();

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.hidden = false;
    this.listeners = new Map();
    this.queryResults = new Map();
  }

  append(child) {
    this.children.push(child);
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  set innerHTML(_value) {
    for (const selector of [
      "[data-analytics-deny]",
      "[data-analytics-accept]",
      "#privacy-consent-title",
    ]) {
      this.queryResults.set(selector, new FakeElement("button"));
    }
  }

  querySelector(selector) {
    return this.queryResults.get(selector) ?? null;
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  getBoundingClientRect() {
    return { height: 120 };
  }

  focus() {
    this.focused = true;
  }
}

class FakeDocument {
  constructor() {
    this.title = "Publicações | Rosa & Chaia";
    this.documentElement = { style: new FakeStyle() };
    this.body = new FakeElement("body");
    this.body.classList = new FakeClassList();
    this.head = new FakeElement("head");
    this.listeners = new Map();
    this.cookieHeader = "";
    this.cookieAssignments = [];
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  get cookie() {
    return this.cookieHeader;
  }

  set cookie(value) {
    this.cookieAssignments.push(value);
  }
}

function createFakeWindow(storage, locationHref) {
  const url = new URL(locationHref);
  return {
    localStorage: storage,
    location: {
      href: url.href,
      hostname: url.hostname,
      pathname: url.pathname,
      reloadCount: 0,
      reload() {
        this.reloadCount += 1;
      },
    },
    dataLayer: [],
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
    dispatchEvent() {},
    addEventListener() {},
  };
}

function storedConsent(status) {
  return JSON.stringify({
    status,
    updatedAt: "2026-07-30T12:00:00.000Z",
  });
}

function dataLayerCommands(windowObject) {
  return windowObject.dataLayer.map((entry) => Array.from(entry));
}

test("interpreta e persiste somente estados de consentimento válidos", () => {
  assert.equal(parseStoredConsent(null), null);
  assert.equal(parseStoredConsent("{invalido"), null);
  assert.equal(parseStoredConsent(storedConsent("granted")), "granted");
  assert.equal(parseStoredConsent(storedConsent("denied")), "denied");
  assert.equal(parseStoredConsent(storedConsent("other")), null);

  const storage = new FakeStorage();
  const updatedAt = new Date("2026-07-30T15:30:00.000Z");
  assert.equal(persistConsent(storage, "granted", updatedAt), true);
  assert.deepEqual(JSON.parse(storage.value), {
    status: "granted",
    updatedAt: "2026-07-30T15:30:00.000Z",
  });
  assert.equal(readStoredConsent(storage), "granted");
  assert.equal(persistConsent(storage, "other", updatedAt), false);

  const unavailableStorage = new FakeStorage(null, { fail: true });
  assert.equal(readStoredConsent(unavailableStorage), null);
  assert.equal(
    persistConsent(unavailableStorage, "denied", updatedAt),
    false,
  );
});

test("remove q e fragmento da localização enviada no page_view", () => {
  assert.equal(
    sanitizePageLocation(
      "https://rosaechaia.adv.br/publicacoes/?q=nome%20completo&ano=2026#resultados",
    ),
    "https://rosaechaia.adv.br/publicacoes/?ano=2026",
  );
});

test("classifica contatos sem devolver dados brutos", () => {
  assert.deepEqual(classifyContactHref("https://wa.me/5514981903906"), {
    contact_channel: "whatsapp",
    contact_target: "gabriela",
  });
  assert.deepEqual(
    classifyContactHref("mailto:giane@rosaechaia.adv.br"),
    {
      contact_channel: "email",
      contact_target: "giane",
    },
  );
  assert.deepEqual(
    classifyContactHref("https://maps.app.goo.gl/vkh6oWRe59MXmfMh6"),
    {
      contact_channel: "map",
      contact_target: "escritorio",
    },
  );
  assert.equal(classifyContactHref("https://example.com/"), null);

  const event = buildContactEvent(
    {
      href: "https://www.instagram.com/rosaechaiaadv",
      closest: (selector) => selector === ".site-footer",
    },
    "/",
  );
  assert.deepEqual(event, {
    contact_channel: "instagram",
    contact_target: "escritorio",
    contact_placement: "footer",
  });
  assert.doesNotMatch(JSON.stringify(event), /instagram\.com|rosaechaiaadv/);
});

test("prepara a exclusão de todos os cookies GA acessíveis", () => {
  const assignments = analyticsCookieDeletionAssignments(
    "_ga=abc; session=value; _ga_5LQ01Z477N=def",
    "rosaechaia.adv.br",
  );
  assert.equal(assignments.length, 6);
  assert.ok(assignments.every((value) => value.includes("Max-Age=0")));
  assert.ok(assignments.some((value) => value.startsWith("_ga=")));
  assert.ok(
    assignments.some((value) =>
      value.startsWith("_ga_5LQ01Z477N="),
    ),
  );
  assert.ok(assignments.every((value) => !value.startsWith("session=")));
});

test("não carrega o Google antes da escolha e aceita mesmo sem storage", () => {
  const storage = new FakeStorage(null, { fail: true });
  const documentObject = new FakeDocument();
  const windowObject = createFakeWindow(
    storage,
    "https://rosaechaia.adv.br/publicacoes/?q=segredo&ano=2026",
  );
  const controller = createAnalyticsController({
    windowObject,
    documentObject,
    storage,
    now: () => new Date("2026-07-30T12:00:00.000Z"),
  });

  assert.equal(controller.getConsentStatus(), null);
  assert.equal(documentObject.head.children.length, 0);
  assert.equal(documentObject.body.children.length, 1);
  assert.equal(documentObject.body.children[0].hidden, false);

  controller.setConsent("granted");

  assert.equal(controller.getConsentStatus(), "granted");
  assert.equal(documentObject.head.children.length, 1);
  assert.equal(
    documentObject.head.children[0].src,
    `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_MEASUREMENT_ID}`,
  );
  const commands = dataLayerCommands(windowObject);
  assert.ok(
    commands.some(
      ([command, id, config]) =>
        command === "config" &&
        id === ANALYTICS_MEASUREMENT_ID &&
        config.send_page_view === false,
    ),
  );
  assert.ok(
    commands.some(
      ([command, name, parameters]) =>
        command === "event" &&
        name === "page_view" &&
        parameters.page_location ===
          "https://rosaechaia.adv.br/publicacoes/?ano=2026",
    ),
  );

  controller.setConsent("granted");
  assert.equal(documentObject.head.children.length, 1);
});

test("carrega consentimento persistido e revoga com limpeza e reload", () => {
  const storage = new FakeStorage(storedConsent("granted"));
  const documentObject = new FakeDocument();
  documentObject.cookieHeader =
    "_ga=abc; _ga_5LQ01Z477N=def; unrelated=value";
  const windowObject = createFakeWindow(
    storage,
    "https://rosaechaia.adv.br/contato/",
  );
  const controller = createAnalyticsController({
    windowObject,
    documentObject,
    storage,
    now: () => new Date("2026-07-30T12:00:00.000Z"),
  });

  assert.equal(controller.getConsentStatus(), "granted");
  assert.equal(documentObject.head.children.length, 1);

  controller.setConsent("denied");

  assert.equal(controller.getConsentStatus(), "denied");
  assert.equal(readStoredConsent(storage), "denied");
  assert.equal(windowObject.location.reloadCount, 1);
  assert.equal(documentObject.cookieAssignments.length, 6);
  assert.ok(
    dataLayerCommands(windowObject).some(
      ([command, action, parameters]) =>
        command === "consent" &&
        action === "update" &&
        parameters.analytics_storage === "denied",
    ),
  );
});
