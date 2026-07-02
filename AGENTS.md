# Analytics Tracking - Mixpanel

This project uses Mixpanel for lightweight portfolio and blog analytics. Do not add new analytics SDKs or duplicate tracking paths without explicit user instruction.

## Tech Stack

| Detail | Value |
|---|---|
| Platform | Astro static website |
| Mixpanel SDK | JavaScript browser SDK loaded from Mixpanel CDN |
| Tracking method | Client-side |
| CDP | None detected |
| Consent required | No, per user confirmation on 2026-06-30 |
| Token location | Hosting/build environment -> `PUBLIC_MIXPANEL_TOKEN` |
| Allowed host config | `PUBLIC_MIXPANEL_ALLOWED_HOSTS` |

## Initialization

Mixpanel is initialized once in:

`src/components/MixpanelTracker.astro`

The tracker is included from:

| File | Coverage |
|---|---|
| `src/layouts/SiteLayout.astro` | Main site pages: home, lab, writing, writing detail, resume |
| `src/layouts/Layout.astro` | Legacy layout, if reused by older pages |
| `src/pages/work.astro` | Standalone work page |

Legacy redirect stubs such as `/cv`, `/career`, `/portfolio`, `/taste`, `/reading`, and `/posts` have been removed. Keep the tracker focused on current public routes unless the user explicitly asks to restore redirects.

The tracker only initializes when both conditions are true:

- `PUBLIC_MIXPANEL_TOKEN` is set.
- `window.location.hostname` matches `PUBLIC_MIXPANEL_ALLOWED_HOSTS`.

Localhost is intentionally excluded by default so local testing does not send Mixpanel events.

## Current Events

| Mixpanel Event | Trigger | Key Properties | File |
|---|---|---|---|
| `page_viewed` | Page loads on an allowed production host | `page_path`, `page_title`, `page_section`, `hostname`, `referrer_domain`, UTM properties | `src/components/MixpanelTracker.astro` |
| `navigation_clicked` | Internal link click that is not a post, project, resume, newsletter, PDF, or contact link | `link_text`, `link_context`, `destination_path` | `src/components/MixpanelTracker.astro` |
| `writing_opened` | User opens a `/writing/...` article link | `post_slug`, `link_text`, `link_context`, `destination_path` | `src/components/MixpanelTracker.astro` |
| `project_opened` | User opens a Lab project card | `project_name`, `project_type`, `destination_domain`, `link_context` | `src/components/MixpanelTracker.astro` |
| `newsletter_opened` | User opens a newsletter panel or Substack link | `newsletter_name`, `newsletter_type`, `destination_domain`, `link_context` | `src/components/MixpanelTracker.astro` |
| `resume_opened` | User clicks a link to the resume page | `resume_action`, `link_text`, `link_context`, `destination_path` | `src/components/MixpanelTracker.astro` |
| `resume_pdf_clicked` | User opens or downloads a PDF/file link | `resume_action`, `link_text`, `link_context`, `destination_path` | `src/components/MixpanelTracker.astro` |
| `contact_link_clicked` | User clicks email or phone contact links | `contact_method`, `link_context` | `src/components/MixpanelTracker.astro` |
| `social_link_clicked` | User clicks LinkedIn, GitHub, or X links | `social_platform`, `destination_domain`, `link_text`, `link_context` | `src/components/MixpanelTracker.astro` |
| `outbound_link_clicked` | User clicks an external non-project, non-newsletter, non-social link | `destination_domain`, `link_text`, `link_context`, `destination_path` | `src/components/MixpanelTracker.astro` |

## Naming Rules

- Event names use `snake_case`, past tense, and a specific meaning.
- Property names use `snake_case`.
- Keep properties flat.
- Omit unavailable values instead of sending `null`, empty strings, or `"N/A"`.
- Do not track PII in event properties.
- Avoid dynamic event names. Use stable event names with properties.

## Identity

There is no login/signup flow in this static site, so no Mixpanel identity calls are currently wired.

If authentication is added later:

- Call `mixpanel.identify(user.id)` only after the user record is confirmed.
- Use a stable internal ID, never an email address.
- Call `mixpanel.reset()` on logout.

## How To Add Tracking

1. Check the event table above before adding a new event.
2. Prefer extending one of the existing grouped events with a property when that preserves meaning.
3. Add a new event only for a distinct user action that needs separate reporting.
4. Keep local testing silent unless the user explicitly asks for a dev Mixpanel project.
5. Update this file when the event plan changes.
