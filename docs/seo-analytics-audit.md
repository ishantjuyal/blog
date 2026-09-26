# SEO and analytics audit

Audited 25 September 2026. Production domain: https://www.ishantjuyal.com.

## Current result

The redesigned site has the technical SEO essentials and a shared GA4/Mixpanel event plan. Local verification passes across **14 indexable pages, the 404 page, 227 rendered link instances, four career expanders, and the game interactions**. Twelve legacy URL stubs redirect without sending duplicate analytics.

**This is local verification, not a claim that production reports already contain these events.** Tests execute the actual tracking and game code against built HTML with fake provider clients; they never send traffic. The redesigned homepage also loads in the browser. Deployment and provider-dashboard verification are still pending.

The live homepage inspected before these changes loaded Mixpanel but not Google Analytics. GA existed only in an unused legacy layout. The supplied GA screenshot also says no data has been received and confirms measurement ID **G-GPHNTYTXYB**. That same ID is now configured in the shared layout. The production Mixpanel token is present in the existing live page, but the Vercel build configuration has not yet been inspected; the new deployment must retain `PUBLIC_MIXPANEL_TOKEN`.

## How SEO applies to this site

A personal site can appear when someone searches for your name, a project you made, or a topic you write about. Your homepage establishes who you are. Project and note pages give search engines specific subjects to match. A minimalist homepage is compatible with that: useful detail can live on the individual pages.

Start with searches such as “Ishant Juyal,” “Ishant Juyal product manager,” and your project names. Broader topic searches need useful, specific writing and evidence of your own experience. Titles and metadata help Google understand pages; they do not guarantee a position or traffic. See Google's [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

### Changes made

| Area | Result |
|---|---|
| Page titles and descriptions | Unique titles and meaningful descriptions on every indexable page; homepage identifies your name and role |
| Canonical URLs | Consistent `https://www.ishantjuyal.com` URLs, matching the existing production www redirect |
| Sitemap | `/sitemap.xml` contains exactly the 14 indexable pages |
| Crawling | `/robots.txt` allows production crawling and points to the sitemap; preview builds disallow crawling and carry noindex |
| Structured data | Person, WebSite, homepage ProfilePage, page metadata, and BlogPosting for the two notes, with actual publication dates |
| Sharing | Open Graph/Twitter metadata and a 1200×630 social card |
| Renamed URLs | Permanent Vercel redirects for `/lab` → `/projects`, `/writing` → `/notes`, their detail paths, and `/resume` → `/work` |
| Error pages | Friendly 404 with noindex, excluded from the sitemap |
| Internal links | 124 internal link instances resolve in the build; none point to the renamed old routes |
| Content delivery | Core text and links are rendered as static HTML; the optional game does not replace the searchable content |

Structured data and sitemaps make information explicit; Google decides indexing and presentation. References: [profile pages](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

Not verified yet: live HTTP status/redirect behavior after deployment, Search Console ownership/indexing, Core Web Vitals from real visitors, or ranking. No numerical SEO score or ranking promise is implied by these checks.

After launch, submit `https://www.ishantjuyal.com/sitemap.xml` in Search Console and inspect the homepage and a project/note URL. Search Console is where you see search queries, impressions, clicks, and indexing issues. Link this website from your real professional profiles and projects, and add substantial notes when you have something useful to share. There is no need to add filler to the homepage.

## Every tracked action

**Verification key:** “Pass” below means the application sends the expected event once to each test client. Live ingestion and appearance in reports remain unverified for every row until deployment and an account check.

Custom events have the same name in both providers. The only naming difference is Mixpanel `page_viewed` versus GA4 `page_view`.

| Event | When it fires | Useful properties | Local result |
|---|---|---|---|
| `page_viewed` / `page_view` | Initial page load; also returning to a page restored from the browser's back/forward cache | `page_path`, `page_title`, `page_section`, `hostname`, available `referrer_domain` and UTMs | Pass: exactly one per provider on initial load; no duplicate from ordinary pageshow |
| `navigation_clicked` | Click an ordinary internal link: header/home mark, all-projects/notes links, back links, or game Work/Life/Notes links | `destination_path`, `link_text`, `link_context` | Pass across all rendered pages |
| `project_opened` | Open a project's detail page from home, Projects, the next-project link, or game; also click its external Visit link | `project_name`, `project_slug`, `project_code`, `project_type`, `project_action`, `destination_domain`, link properties | Pass; `project_action=details` and `visit` are distinguished |
| `note_opened` | Click a particular `/notes/[slug]` article from Home, Notes, or Life | `post_slug`, link properties | Pass; a direct article arrival sends page_view, not a fabricated click |
| `newsletter_opened` | Click Ishant's Notes, PM Quest Newsletter, or the footer Substack profile | `newsletter_name`, `newsletter_type` (`personal`, `product`, `profile`), `destination_domain`, link properties | Pass; profile and newsletter are distinguished |
| `contact_link_clicked` | Click an email link; telephone links are supported if added later | `contact_method`, `link_context` | Pass on every current email link; phone covered by a synthetic test |
| `social_link_clicked` | Click LinkedIn, GitHub, or X | `social_platform`, `destination_domain`, link properties | Pass across all footer links |
| `outbound_link_clicked` | Click an external link not classified as a project, newsletter, or social link | `destination_domain`, `destination_path`, `link_text`, `link_context` | Pass in synthetic cases; no current rendered link needs this fallback |
| `career_details_opened` | Expand PICKUP Coffee, Crework, Houseworks, or Jar on Work | `company`, `link_context=career_history` | Pass for all four; closing does not fire; reopening counts another open |
| `mode_changed` | Choose Fun mode, Simple mode, or press Escape while in Fun mode | `mode=fun/simple`, `input_method=button/keyboard` | Pass; restoring a remembered mode does not count as a new interaction |
| `world_place_discovered` | Reach a stop not previously discovered in the current walk | `place_id`, `places_found`, `input_method=keyboard/controls/tap` | Pass for all six places, keyboard movement and on-screen movement; revisits do not duplicate |
| `world_completed` | Discover the sixth unique place | `places_found=6` | Pass, once per completed walk |
| `world_restarted` | Click Start over | `places_found` before reset | Pass; begins a fresh walk |

All events carry the base page properties from the first row. `link_context` explains whether an action came from `primary_navigation`, `footer`, `section_header`, `notes_list`, `newsletter_panel`, `project_link`, `next_project`, `fun_mode`, or ordinary `body` content. Project identity still works when a link has no project-card styling.

Keyboard update, 26 September 2026: pressing Enter on the game board while at any of the six places activates its existing Explore link, sending one project or navigation event with `link_context=fun_mode`. Enter away from a place does nothing; held-key repeats do not open it again.

## Page-by-page coverage

**Common on all 15 pages:** page view; header/home navigation; footer Email → `contact_link_clicked`; LinkedIn/GitHub/X → `social_link_clicked`; Substack profile → `newsletter_opened`. Every row below passed local event dispatch tests. Production receipt is pending for every page.

| Page | Additional actions |
|---|---|
| `/` | Three featured project details → `project_opened(details)`; two notes → `note_opened`; body navigation/contact; all four game event types listed above; game Explore links → project or ordinary navigation events |
| `/projects` | Seven project links → `project_opened(details)` |
| `/projects/pm-quest` | Visit PM Quest → `project_opened(visit)`; next TailorUp → `project_opened(details)`; All projects → navigation |
| `/projects/tailorup` | Visit TailorUp → `project_opened(visit)`; next Appvia → `project_opened(details)`; All projects → navigation |
| `/projects/appvia` | Visit Appvia → `project_opened(visit)`; next Loopwise → `project_opened(details)`; All projects → navigation |
| `/projects/loopwise` | Visit Loopwise → `project_opened(visit)`; next Secret Santa → `project_opened(details)`; All projects → navigation |
| `/projects/secret-santa` | Visit Secret Santa → `project_opened(visit)`; next Year Progress → `project_opened(details)`; All projects → navigation |
| `/projects/year-progress` | Visit Year Progress → `project_opened(visit)`; next Focus Hours → `project_opened(details)`; All projects → navigation |
| `/projects/focus-hours` | Visit Focus Hours → `project_opened(visit)`; next PM Quest → `project_opened(details)`; All projects → navigation |
| `/notes` | Two article links → `note_opened`; two newsletter panels → `newsletter_opened(personal/product)` |
| `/notes/books` | All notes → navigation; article itself does not emit note_opened on arrival |
| `/notes/how-to-un-fry-my-brain` | All notes → navigation; article itself does not emit note_opened on arrival |
| `/work` | Four company expanders → `career_details_opened`; projects link → navigation; Get in touch → contact |
| `/life` | Bookshelf → `note_opened`; Work/Projects/Notes → navigation; personal Substack → newsletter; Say hello → contact |
| Missing URL / 404 | Common events plus recovery links → navigation; page_path records the requested missing URL; page excluded from search indexing |

The 12 static redirect stubs are `/lab`, the seven old project detail URLs under `/lab/`, `/writing`, the two old note URLs under `/writing/`, and `/resume`. They send no events before navigation; the destination page sends its own page view. Vercel's native permanent redirects handle those paths in production.

## What intentionally does not produce a custom event

- Reading text, scrolling, hovering, and ordinary game movement.
- Returning to a discovered game stop, collapsing a company, or restoring saved game state.
- The skip-to-content link, right-click, or opening a context menu. Normal activation and middle-click are covered.
- A completed email, phone call, newsletter subscription, or session inside a separate project app. This site's clicks cannot prove those outcomes.
- Redirect stubs, localhost, preview domains, and unlisted subdomains.

GA4 can separately produce automatic events such as `session_start`, `first_visit`, and `user_engagement`. If its property's enhanced measurement is enabled, events such as `scroll` or outbound `click` can also appear. Those settings have not been inspected. Treat generic GA `click` separately from this site's descriptive custom events rather than adding the counts together. GA configuration follows Google's [page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views); Mixpanel stays on the [EU endpoint with manual capture](https://docs.mixpanel.com/docs/tracking-methods/sdks/javascript).

## Making sense of the data

| Question | Report to use |
|---|---|
| How did people find me? | GA acquisition and page views by source/medium; Search Console for Google queries |
| Which projects interest people? | `project_opened` grouped by `project_name` and `project_action` |
| Do visitors actually try a project? | Funnel: project detail page view → `project_opened` with action `visit` |
| Which notes get read? | Article page views by `page_path`; clicks alone miss visitors landing directly from search |
| Does the portfolio generate contact interest? | `contact_link_clicked` by page and link_context; label it contact intent |
| Which newsletter attracts interest? | `newsletter_opened` grouped by newsletter_type/name; label it outbound interest |
| Does the game help discovery? | `mode_changed(fun)` → unique `world_place_discovered` → project details or `world_completed` |
| Which work experience gets attention? | `career_details_opened` by company |

In GA4, register the custom parameters you want to use as report dimensions—particularly `project_name`, `project_action`, `page_section`, `link_context`, `newsletter_type`, `social_platform`, `mode`, and `company`. This account setup has not been done. Mixpanel can break down the supplied event properties directly. Do not mark every click as a key event: project visits and contact intent are the more useful starting choices.

## Verification details and remaining launch work

Run `npm run check` for the build, SEO checks, and all-page analytics tests. Strict TypeScript checks cover the analytics and game scripts. Tests also cover exact production-host gating, provider independence, duplicate-initialization prevention, middle-clicks, back/forward-cache returns, and removal of contact details/arbitrary query strings from event properties.

The production configuration keeps Mixpanel in the EU region and retains the existing GA4 ID. No new analytics SDK was introduced. Missing Mixpanel configuration does not disable GA, and a failed Mixpanel tracking call does not stop GA tracking.

For a real production check, visit `https://www.ishantjuyal.com/?analytics_debug=1`. Diagnostics persist for that browser session, mark events `is_debug=true`, and use GA debug_mode. Filter QA events out of business analysis. Turn this off with `?analytics_debug=0`.

- `queued`: the site handed the event to the provider API; this alone is not delivery proof.
- Mixpanel `accepted`: the SDK callback reports a successful ingestion response.
- GA `processed_by_tag`: the Google tag processed the event; confirm receipt in DebugView/Realtime.
- `disabled_on_host`: expected on local/preview URLs.
- `not_configured`, `load_failed`, `client_error`, or `not_confirmed`: investigate the relevant provider/configuration.

The earlier Vercel connection request was declined, so publication remains pending permission to connect this checkout to the existing `blog` project. After deployment, verify all public routes, redirect status codes, sitemap/robots, and production tracking requests. Then confirm representative events and their parameters in GA4 DebugView/Realtime and Mixpanel Events. The in-app analytics tabs requested sign-in, and computer access to Brave was not approved. The supplied GA screenshot was readable, but no dashboard-level event receipt has been confirmed yet.
