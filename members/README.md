# INCOM member space — UI prototype

`/members/` is a public design prototype using explicitly fictional October 2026 fixtures. It is NOT a secured member portal. No private information, real registrations, Discord tokens or member roster may be added to these static files.

The Discord login button is intentionally disabled until backend authentication is connected. Demo role switching is not authorization. Demo registrations exist only in page memory and are erased on refresh or exit. The optional textarea is a UI example only; its text is neither stored nor sent.

## Production integration still required

- Server-side Discord OAuth authorization-code flow, state validation and secure HttpOnly sessions. Keep client secrets and bot tokens on the server, never in this static repository or browser storage.
- Configure the actual Discord guild ID and current-member / OB role IDs. Match role IDs, not editable display names. Do not request message access merely to authenticate members.
- Server policy: current member can read and register; OB/previous member can read only; no qualifying role or server membership denies access. Current member wins when both roles exist.
- Authenticate and authorize every protected read and mutation, including attachments. Recheck membership when applying; invalidate or expire access after role removal/server departure. Discord failures must not grant access.
- Private database for schedules, notices, files and applications; duplicate application constraints, server-side validation and CSRF protections. Define a separate administrator role before adding management tools.
- Test role removal during a session, forbidden direct API calls, dual roles, duplicate submissions and unavailable Discord API. Never expose private content as static HTML/JS fixtures.

The existing public website stays unchanged except for a member-space link. Actual hosting, OAuth configuration and production data require a separate setup step.
