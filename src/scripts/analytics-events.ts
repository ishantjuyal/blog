import { projects } from "../data/projects";

export type Properties = Record<string, string | number | boolean | undefined>;
export type SiteEvent = "page_viewed" | "navigation_clicked" | "note_opened" | "project_opened" | "newsletter_opened" | "contact_link_clicked" | "social_link_clicked" | "outbound_link_clicked" | "mode_changed" | "world_place_discovered" | "world_completed" | "world_restarted" | "career_details_opened";
export type TrackedEvent = { name: SiteEvent; properties: Properties };
export const siteHosts = ["ishantjuyal.com", "www.ishantjuyal.com"];

export function compact(properties: Properties): Properties {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined && value !== ""));
}

export function cleanText(value: string | null | undefined, max = 96): string {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizedPath(path: string) { return path.replace(/\/$/, "") || "/"; }
export function pageSection(path: string) { return normalizedPath(path).split("/").filter(Boolean)[0] || "home"; }
export function domainMatches(host: string, domain: string) { return host === domain || host.endsWith(`.${domain}`); }
export function allowedHost(host: string, hosts: string[]) { return hosts.includes(host.toLowerCase()); }

export function safePageURL(href: string) {
  const url = new URL(href);
  const clean = new URL(url.origin + normalizedPath(url.pathname));
  for (const key of ["source", "medium", "campaign", "term", "content"]) {
    const value = cleanText(url.searchParams.get(`utm_${key}`), 80);
    // Campaign labels are useful; contact details in query parameters are not.
    if (value && !/@|\d{9,}/.test(value)) clean.searchParams.set(`utm_${key}`, value);
  }
  return clean;
}

export function baseProperties(href: string, title: string, referrer: string): Properties {
  const url = safePageURL(href);
  let referrerDomain = "";
  try { referrerDomain = new URL(referrer).hostname; } catch { /* Direct visit. */ }
  const properties: Properties = { page_path: normalizedPath(url.pathname), page_title: title, page_section: pageSection(url.pathname), hostname: url.hostname, referrer_domain: referrerDomain };
  for (const key of ["source", "medium", "campaign", "term", "content"]) properties[`utm_${key}`] = url.searchParams.get(`utm_${key}`) || undefined;
  return compact(properties);
}

export function linkContext(anchor: Element): string {
  if (anchor.closest("#fun-world")) return "fun_mode";
  if (anchor.closest(".site-header, .site-nav, .portfolio-nav, .nav-links")) return "primary_navigation";
  if (anchor.closest("footer")) return "footer";
  if (anchor.closest(".newsletter-panel")) return "newsletter_panel";
  if (anchor.closest(".section-heading, .section-rule")) return "section_header";
  if (anchor.closest(".next-project")) return "next_project";
  if (anchor.closest(".notes-list, .editorial-list, .post-list")) return "notes_list";
  if (anchor.closest(".project-card, .project-grid")) return "project_link";
  return "body";
}

export function classifyLink(href: string, pageHref: string, text: string, context: string, projectCode?: string): TrackedEvent | null {
  if (!href || href.startsWith("#")) return null;
  const event = (name: SiteEvent, properties: Properties): TrackedEvent => ({ name, properties: compact(properties) });
  if (/^mailto:/i.test(href)) return event("contact_link_clicked", { contact_method: "email", link_context: context });
  if (/^tel:/i.test(href)) return event("contact_link_clicked", { contact_method: "phone", link_context: context });
  let url: URL;
  try { url = new URL(href, pageHref); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol)) return null;
  const path = normalizedPath(url.pathname);
  const source = new URL(pageHref);
  const internal = url.origin === source.origin || siteHosts.includes(url.hostname);
  const properties: Properties = { link_text: cleanText(text), link_context: context, destination_path: path };
  const project = projects.find((item) => (internal && path === `/projects/${item.slug}`) || (projectCode && item.code === projectCode));
  if (project) return event("project_opened", { ...properties, project_name: project.name, project_slug: project.slug, project_type: project.type, project_code: project.code, project_action: internal ? "details" : "visit", destination_domain: url.hostname });
  if (internal && path.startsWith("/notes/")) return event("note_opened", { ...properties, post_slug: path.slice("/notes/".length) });
  if (domainMatches(url.hostname, "substack.com")) {
    const profile = ["substack.com", "www.substack.com"].includes(url.hostname);
    const product = url.hostname === "pmquestnewsletter.substack.com";
    return event("newsletter_opened", { ...properties, newsletter_name: profile ? "Substack profile" : product ? "PM Quest Newsletter" : "Ishant's Notes", newsletter_type: profile ? "profile" : product ? "product" : "personal", destination_domain: url.hostname });
  }
  const social = domainMatches(url.hostname, "linkedin.com") ? "linkedin" : domainMatches(url.hostname, "github.com") ? "github" : domainMatches(url.hostname, "x.com") || domainMatches(url.hostname, "twitter.com") ? "x" : "";
  if (social) return event("social_link_clicked", { ...properties, social_platform: social, destination_domain: url.hostname });
  return event(internal ? "navigation_clicked" : "outbound_link_clicked", { ...properties, ...(internal ? {} : { destination_domain: url.hostname }) });
}
