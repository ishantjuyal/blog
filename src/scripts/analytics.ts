import { allowedHost, baseProperties, classifyLink, cleanText, compact, linkContext, safePageURL, type Properties, type SiteEvent } from "./analytics-events";
import { loadMixpanelLibrary } from "./mixpanel-loader.js";

type MixpanelClient = {
  init: (token: string, options: Record<string, unknown>) => void;
  register: (properties: Record<string, unknown>) => void;
  track: (event: string, properties: Record<string, unknown>, options?: Record<string, unknown>, callback?: (response: unknown) => void) => void;
};
declare global {
  interface Window {
    siteAnalytics?: { track: (name: SiteEvent, properties?: Properties) => void };
    mixpanel: MixpanelClient;
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const element = document.querySelector("#site-analytics-config");
if (element && !window.siteAnalytics) {
  const config = JSON.parse(element.textContent || "{}");
  const enabled = allowedHost(location.hostname, config.allowedHosts || []);
  const mixpanelEnabled = enabled && Boolean(config.mixpanelToken);
  const gaEnabled = enabled && /^G-[A-Z0-9]+$/.test(config.gaMeasurementId || "");
  const queryDebug = new URL(location.href).searchParams.get("analytics_debug");
  let debug = queryDebug === "1";
  try {
    if (queryDebug === "1") sessionStorage.setItem("site-analytics-debug", "1");
    if (queryDebug === "0") sessionStorage.removeItem("site-analytics-debug");
    debug = sessionStorage.getItem("site-analytics-debug") === "1";
  } catch { /* Diagnostics work without storage too. */ }
  const diagnose = (service: string, event: string, status: string, properties?: Properties) => {
    if (debug) console.info("[site-analytics]", JSON.stringify({ service, event, status, properties }));
  };
  const base = () => compact({ ...baseProperties(location.href, document.title, document.referrer), ...(debug ? { is_debug: true } : {}) });
  const referrerOrigin = () => { try { return new URL(document.referrer).origin; } catch { return ""; } };

  if (mixpanelEnabled) {
    loadMixpanelLibrary();
    window.mixpanel.init(config.mixpanelToken, {
      api_host: config.mixpanelApiHost,
      track_pageview: false,
      autocapture: false,
      record_sessions_percent: 0,
      persistence: "localStorage",
      batch_requests: !debug,
      verbose: debug,
      property_blacklist: ["$initial_referrer"],
    });
    window.mixpanel.register({ platform: "web", site_name: "ishant_juyal_personal_site" });
  }
  if (gaEnabled) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", config.gaMeasurementId, {
      send_page_view: false,
      page_location: safePageURL(location.href).href,
      page_referrer: referrerOrigin(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...(debug ? { debug_mode: true } : {}),
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaMeasurementId}`;
    script.addEventListener("error", () => diagnose("ga4", "sdk", "load_failed"));
    document.head.appendChild(script);
  }

  function track(name: SiteEvent, properties: Properties = {}) {
    const payload = compact({ ...base(), ...properties });
    if (mixpanelEnabled) {
      try {
        window.mixpanel.track(name, compact({ ...payload, $current_url: safePageURL(location.href).href, $referrer: referrerOrigin() || undefined }), {}, debug ? (response: unknown) => {
          const accepted = response === 1 || (typeof response === "object" && response !== null && "status" in response && response.status === 1);
          diagnose("mixpanel", name, accepted ? "accepted" : "not_confirmed", payload);
        } : undefined);
        diagnose("mixpanel", name, "queued", payload);
      } catch { diagnose("mixpanel", name, "client_error", payload); }
    } else diagnose("mixpanel", name, enabled ? "not_configured" : "disabled_on_host", payload);
    const gaName = name === "page_viewed" ? "page_view" : name;
    if (gaEnabled) {
      try {
        window.gtag("event", gaName, {
          ...payload,
          send_to: config.gaMeasurementId,
          ...(name === "page_viewed" ? { page_location: safePageURL(location.href).href, page_referrer: referrerOrigin() } : {}),
          ...(debug ? { debug_mode: true, event_callback: () => diagnose("ga4", gaName, "processed_by_tag", payload) } : {}),
        });
        diagnose("ga4", gaName, "queued", payload);
      } catch { diagnose("ga4", gaName, "client_error", payload); }
    } else diagnose("ga4", gaName, enabled ? "not_configured" : "disabled_on_host", payload);
  }
  window.siteAnalytics = { track };
  track("page_viewed");
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) track("page_viewed");
  });

  function onLinkClick(event: MouseEvent) {
    if (event.type === "auxclick" && event.button !== 1) return;
    const anchor = (event.target instanceof Element ? event.target : null)?.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.dataset.analyticsIgnore === "true" || anchor.dataset.mixpanelIgnore === "true") return;
    const project = anchor.closest<HTMLElement>("[data-project-code]");
    const classified = classifyLink(anchor.getAttribute("href") || "", location.href, anchor.getAttribute("aria-label") || anchor.innerText || anchor.textContent || "", linkContext(anchor), project?.dataset.projectCode);
    if (classified) track(classified.name, classified.properties);
  }
  document.addEventListener("click", onLinkClick, true);
  document.addEventListener("auxclick", onLinkClick, true);
  document.addEventListener("toggle", (event) => {
    const details = event.target;
    if (details instanceof HTMLDetailsElement && details.open && details.dataset.careerCompany) {
      track("career_details_opened", { company: cleanText(details.dataset.careerCompany), link_context: "career_history" });
    }
  }, true);
}
