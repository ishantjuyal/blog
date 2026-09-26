# Analytics tracking — Mixpanel and GA4

This Astro static site uses the existing Mixpanel browser SDK and Google tag. Do not add SDKs, autocapture, or duplicate tracking paths without explicit user instruction. Both providers share one event plan.

## Initialization and configuration

`src/components/AnalyticsTracker.astro` supplies build configuration. `src/scripts/analytics.ts` initializes each provider independently, once per page. `src/scripts/analytics-events.ts` defines event classification and properties. The existing Mixpanel CDN bootstrap lives in `src/scripts/mixpanel-loader.js`.

Both `src/layouts/SiteLayout.astro` (all current public pages and 404) and the legacy `src/layouts/Layout.astro` include the shared component. Redirect stubs never initialize analytics.

| Setting | Meaning |
|---|---|
| `PUBLIC_MIXPANEL_TOKEN` | Required Mixpanel token, configured in Vercel production build environment |
| `PUBLIC_MIXPANEL_API_HOST` | Defaults to `https://api-eu.mixpanel.com`; the existing project is EU-region |
| `PUBLIC_GA_MEASUREMENT_ID` | Existing GA4 stream, defaults to `G-GPHNTYTXYB` |
| `PUBLIC_ANALYTICS_ALLOWED_HOSTS` | Exact comma-separated production hostnames for both providers |
| `PUBLIC_MIXPANEL_ALLOWED_HOSTS` | Backward-compatible fallback when the shared host setting is absent |

Default allowed hosts: `ishantjuyal.com`, `www.ishantjuyal.com`. Localhost, preview deployments, and unlisted subdomains stay silent. Do not enable production tracking on local hosts to test. Consent is not required per user confirmation on 2026-06-30. There is no CDP or authentication flow.

Mixpanel uses manual page views, autocapture disabled, and session replay disabled. GA4 config uses `send_page_view: false` followed by the single shared manual page-view event. Account-level GA enhanced measurement settings must be checked separately before making claims about automatic events.

## Event plan

Every event includes `page_path`, `page_title`, `page_section`, `hostname`, and available `referrer_domain`/UTM properties. Custom names are identical in both providers except for the standard GA4 page-view name.

| Mixpanel event / GA4 event | Trigger | Additional properties |
|---|---|---|
| `page_viewed` / `page_view` | Initial page load or persisted back/forward-cache return | Base properties |
| `navigation_clicked` | Ordinary internal link | `link_text`, `link_context`, `destination_path` |
| `note_opened` | Click a `/notes/[slug]` link | `post_slug`, link properties |
| `project_opened` | Click project details, next-project, game project link, or Visit project | `project_name`, `project_slug`, `project_type`, `project_code`, `project_action` (`details`/`visit`), `destination_domain`, link properties |
| `newsletter_opened` | Click either newsletter or Substack profile | `newsletter_name`, `newsletter_type` (`personal`/`product`/`profile`), `destination_domain`, link properties |
| `contact_link_clicked` | Email/phone link | `contact_method`, `link_context`; no contact address or link text |
| `social_link_clicked` | LinkedIn, GitHub, X/Twitter link | `social_platform`, `destination_domain`, link properties |
| `outbound_link_clicked` | Other external link | `destination_domain`, link properties |
| `career_details_opened` | Expand a company on Work | `company`, `link_context: career_history` |
| `mode_changed` | Toggle Fun/Simple mode or exit with Escape | `mode`, `input_method` |
| `world_place_discovered` | Reach an unvisited stop in the current walk | `place_id`, `places_found`, `input_method` |
| `world_completed` | Discover the sixth unique stop | `places_found` |
| `world_restarted` | Click Start over | Previous `places_found` |

Career collapse, ordinary game movement, revisits, automatic mode restoration, and skip-to-content anchors do not generate custom events. Game tracking lives in `src/scripts/fun-world.ts`; company labels are on Work's details elements. Classifications are mutually exclusive per link action. Middle-click is supported; right-click is not counted.

On the focused game board, Enter opens the place within discovery range through its existing Explore link. It sends the same single `project_opened` or `navigation_clicked` event with `link_context: fun_mode`; no separate keyboard-entry event. Enter away from a place, in Simple mode, or from key-repeat does not open a place. Focused landmarks retain their native button activation.

## Routes and SEO

Current routes: `/`, `/projects`, seven `/projects/[slug]` pages, `/notes`, two `/notes/[slug]` pages, `/work`, `/life`. Native Vercel permanent redirects and Astro fallback stubs preserve `/lab`, `/writing`, their existing detail URLs, and `/resume`. Do not restore removed work case studies or other legacy routes without user instruction.

The canonical production origin is `https://www.ishantjuyal.com`. `sitemap.xml.ts` contains only indexable pages. Redirects and 404 are excluded. Preview builds have noindex and disallow crawling.

## Data rules

- Use stable snake_case, past-tense event names and flat snake_case properties.
- Omit unavailable values; do not send null, empty strings, or N/A.
- Do not send PII. Contact addresses are excluded; referrers use origin/domain; arbitrary query parameters and fragments are removed. Keep UTM campaign labels free of personal data.
- There is no identify/reset flow. If authentication is introduced, identify only after confirming a user record, use a stable internal ID (never email), and reset on logout.
- Clicks measure intent, not completed subscriptions, emails, or product usage.

## Verification and changes

Run `npm run check` to build and validate SEO plus analytics across every generated page/link and game/career interactions. Tests use fake SDK clients and never send events. A passing test proves application dispatch, not provider ingestion.

On an allowed production host, `?analytics_debug=1` enables session-scoped diagnostics and marks QA events with `is_debug: true`. `?analytics_debug=0` ends diagnostics. Mixpanel `accepted` is an ingestion acknowledgement; GA `processed_by_tag` is not proof the event reached reports. Use GA DebugView/Realtime and Mixpanel Events for end-to-end verification.

Check the plan before adding events, prefer properties on existing events, and update this file and `docs/seo-analytics-audit.md` when behavior changes. Keep production analytics silent during local tests.
