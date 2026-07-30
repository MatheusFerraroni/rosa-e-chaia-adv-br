export const ANALYTICS_MEASUREMENT_ID = "G-5LQ01Z477N";
export const ANALYTICS_STORAGE_KEY =
  "rosa-e-chaia:analytics-consent:v1";

const GOOGLE_TAG_SCRIPT_ID = "rosa-e-chaia-google-tag";
const CONSENT_STATUSES = new Set(["granted", "denied"]);
const ANALYTICS_COOKIE_PATTERN = /^_ga(?:_|$)/;

const AD_CONSENT_DENIED = Object.freeze({
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
});

export function parseStoredConsent(value) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return CONSENT_STATUSES.has(parsed?.status) ? parsed.status : null;
  } catch {
    return null;
  }
}

export function readStoredConsent(storage) {
  try {
    return parseStoredConsent(storage?.getItem(ANALYTICS_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistConsent(storage, status, updatedAt = new Date()) {
  if (!CONSENT_STATUSES.has(status)) {
    return false;
  }

  try {
    storage?.setItem(
      ANALYTICS_STORAGE_KEY,
      JSON.stringify({
        status,
        updatedAt: updatedAt.toISOString(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function sanitizePageLocation(value) {
  const url = new URL(value);
  url.searchParams.delete("q");
  url.hash = "";
  return url.href;
}

export function classifyContactHref(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");

  if (url.protocol === "mailto:") {
    const address = path.toLowerCase();
    if (address === "gabriela@rosaechaia.adv.br") {
      return { contact_channel: "email", contact_target: "gabriela" };
    }
    if (address === "giane@rosaechaia.adv.br") {
      return { contact_channel: "email", contact_target: "giane" };
    }
    return null;
  }

  if (host === "wa.me") {
    const targets = {
      "5514981903906": "gabriela",
      "5514996104356": "giane",
      "5514999091082": "escritorio",
    };
    return targets[path]
      ? {
          contact_channel: "whatsapp",
          contact_target: targets[path],
        }
      : null;
  }

  if (host === "maps.app.goo.gl") {
    return { contact_channel: "map", contact_target: "escritorio" };
  }

  if (host === "instagram.com" || host === "www.instagram.com") {
    return { contact_channel: "instagram", contact_target: "escritorio" };
  }

  if (host === "facebook.com" || host === "www.facebook.com") {
    return { contact_channel: "facebook", contact_target: "escritorio" };
  }

  return null;
}

export function buildContactEvent(anchor, pathname) {
  const contact = classifyContactHref(anchor?.href ?? "");
  if (!contact) {
    return null;
  }

  let contactPlacement = null;
  if (anchor.closest?.(".whatsapp-float")) {
    contactPlacement = "floating_menu";
  } else if (anchor.closest?.(".site-footer")) {
    contactPlacement = "footer";
  } else if (
    pathname === "/contato/" ||
    anchor.closest?.(".contact-panel")
  ) {
    contactPlacement = "contact_page";
  }

  return contactPlacement
    ? { ...contact, contact_placement: contactPlacement }
    : null;
}

export function analyticsCookieDeletionAssignments(cookieHeader, hostname) {
  const names = cookieHeader
    .split(";")
    .map((entry) => entry.split("=", 1)[0].trim())
    .filter((name) => ANALYTICS_COOKIE_PATTERN.test(name));
  const assignments = [];

  for (const name of new Set(names)) {
    const base = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    assignments.push(base);
    if (hostname) {
      assignments.push(`${base}; Domain=${hostname}`);
      assignments.push(`${base}; Domain=.${hostname}`);
    }
  }

  return assignments;
}

export function createAnalyticsController({
  windowObject = window,
  documentObject = document,
  storage = windowObject.localStorage,
  now = () => new Date(),
} = {}) {
  let consentStatus = readStoredConsent(storage);
  let googleTagLoaded = false;
  let banner = null;
  let bannerResizeObserver = null;

  windowObject.dataLayer = windowObject.dataLayer || [];
  windowObject.gtag =
    windowObject.gtag ||
    function gtag() {
      windowObject.dataLayer.push(arguments);
    };

  const updateConsent = (analyticsStorage) => {
    windowObject.gtag("consent", "update", {
      ...AD_CONSENT_DENIED,
      analytics_storage: analyticsStorage,
    });
  };

  windowObject.gtag("consent", "default", {
    ...AD_CONSENT_DENIED,
    analytics_storage: "denied",
  });
  windowObject.gtag("set", "allow_google_signals", false);
  windowObject.gtag("set", "allow_ad_personalization_signals", false);

  const updateBannerOffset = () => {
    if (!banner || banner.hidden) {
      documentObject.documentElement.style.removeProperty(
        "--privacy-consent-offset",
      );
      return;
    }

    const height = Math.ceil(banner.getBoundingClientRect().height);
    documentObject.documentElement.style.setProperty(
      "--privacy-consent-offset",
      `${height + 16}px`,
    );
  };

  const announceLayoutChange = () => {
    const EventConstructor = windowObject.CustomEvent ?? windowObject.Event;
    windowObject.dispatchEvent(new EventConstructor("privacyconsentchange"));
  };

  const hideBanner = () => {
    if (!banner) {
      return;
    }

    banner.hidden = true;
    documentObject.body.classList.remove("has-privacy-consent");
    updateBannerOffset();
    announceLayoutChange();
  };

  const loadGoogleTag = () => {
    if (googleTagLoaded) {
      return;
    }

    googleTagLoaded = true;
    updateConsent("granted");

    const script = documentObject.createElement("script");
    script.id = GOOGLE_TAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      ANALYTICS_MEASUREMENT_ID,
    )}`;
    documentObject.head.append(script);

    windowObject.gtag("js", now());
    windowObject.gtag("config", ANALYTICS_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    windowObject.gtag("event", "page_view", {
      page_title: documentObject.title,
      page_location: sanitizePageLocation(windowObject.location.href),
    });
  };

  const removeAnalyticsCookies = () => {
    for (const assignment of analyticsCookieDeletionAssignments(
      documentObject.cookie,
      windowObject.location.hostname,
    )) {
      documentObject.cookie = assignment;
    }
  };

  const setConsent = (status) => {
    const wasGranted = consentStatus === "granted" || googleTagLoaded;
    consentStatus = status;
    persistConsent(storage, status, now());

    if (status === "granted") {
      hideBanner();
      loadGoogleTag();
      return;
    }

    updateConsent("denied");
    removeAnalyticsCookies();
    hideBanner();

    if (wasGranted) {
      windowObject.location.reload();
    }
  };

  const ensureBanner = () => {
    if (banner) {
      return banner;
    }

    banner = documentObject.createElement("section");
    banner.className = "privacy-consent";
    banner.dataset.privacyConsent = "";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-labelledby", "privacy-consent-title");
    banner.hidden = true;
    banner.innerHTML = `
      <div class="privacy-consent__inner">
        <div class="privacy-consent__copy">
          <h2 class="privacy-consent__title" id="privacy-consent-title" tabindex="-1">Privacidade</h2>
          <p>Precisamos da sua permissão para ativar o Google Analytics. Ele nos ajuda a entender como nosso site é utilizado. <a href="/privacidade/">Leia a política de privacidade.</a></p>
        </div>
        <div class="privacy-consent__actions">
          <button class="privacy-consent__button privacy-consent__button--secondary" type="button" data-analytics-deny>Recusar</button>
          <button class="privacy-consent__button privacy-consent__button--primary" type="button" data-analytics-accept>Aceitar</button>
        </div>
      </div>`;

    banner
      .querySelector("[data-analytics-deny]")
      .addEventListener("click", () => setConsent("denied"));
    banner
      .querySelector("[data-analytics-accept]")
      .addEventListener("click", () => setConsent("granted"));
    documentObject.body.append(banner);

    if (windowObject.ResizeObserver) {
      bannerResizeObserver = new windowObject.ResizeObserver(updateBannerOffset);
      bannerResizeObserver.observe(banner);
    } else {
      windowObject.addEventListener("resize", updateBannerOffset);
    }

    return banner;
  };

  const openPreferences = ({ focus = true } = {}) => {
    const consentBanner = ensureBanner();
    consentBanner.hidden = false;
    documentObject.body.classList.add("has-privacy-consent");
    updateBannerOffset();
    announceLayoutChange();

    if (focus) {
      consentBanner.querySelector("#privacy-consent-title").focus();
    }
  };

  documentObject.addEventListener("click", (event) => {
    const preferencesControl = event.target?.closest?.(
      "[data-privacy-preferences]",
    );
    if (preferencesControl) {
      event.preventDefault();
      openPreferences();
      return;
    }

    if (consentStatus !== "granted" || !googleTagLoaded) {
      return;
    }

    const anchor = event.target?.closest?.("a[href]");
    const contactEvent = buildContactEvent(
      anchor,
      windowObject.location.pathname,
    );
    if (contactEvent) {
      windowObject.gtag("event", "contact_click", contactEvent);
    }
  });

  if (consentStatus === "granted") {
    loadGoogleTag();
  } else if (consentStatus === null) {
    openPreferences({ focus: false });
  }

  return Object.freeze({
    getConsentStatus: () => consentStatus,
    openPreferences,
    setConsent,
    destroy: () => bannerResizeObserver?.disconnect(),
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.RosaChaiaAnalytics = createAnalyticsController();
}
