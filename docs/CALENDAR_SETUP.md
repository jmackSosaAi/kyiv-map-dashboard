# Calendar Integration Setup

## Why this doc exists

The "Coming Up" panel already ships a working **Export to calendar (.ics)** button.
Clicking it downloads `kyiv-events.ics` — drag that file into Google Calendar, Apple
Calendar, Outlook, or any RFC 5545-compliant app and all upcoming Kyiv cultural events
appear instantly.

The OAuth flow described below is **future scaffolding only**. It would let the app push
events directly to a signed-in user's Google Calendar without the drag-and-drop step.
The live-sync code is intentionally stubbed out; see `src/hooks/useCalendarExport.js`.

---

## Step 1 — Enable the Calendar API

1. Open the [Google Calendar API library page](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).
2. Select the same Cloud project that hosts your Maps API key.
3. Click **Enable**.

---

## Step 2 — Create OAuth 2.0 credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Choose **Web application**.
3. Add **Authorized redirect URIs**:
   - Production: `https://kyiv-map-dashboard.vercel.app/auth/callback`
   - Local dev: `http://localhost:5173`
4. Click **Create** and copy the **Client ID**.

> **Note:** You may also need to configure the OAuth consent screen
> (APIs & Services → OAuth consent screen) before credentials are usable.

---

## Step 3 — Add env vars

Copy `.env.example` to `.env` (if you haven't already) and fill in:

```
VITE_GOOGLE_CALENDAR_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:5173
```

Change `VITE_GOOGLE_CALENDAR_REDIRECT_URI` to your production URL before deploying.

---

## Step 4 — Wire up the OAuth flow

The commented skeleton in `src/hooks/useCalendarExport.js` shows the shape of the
`fetch` calls you'll need. For the popup/token-grant flow, the recommended library is
[`@react-oauth/google`](https://www.npmjs.com/package/@react-oauth/google) — it handles
the popup, PKCE, and token refresh without additional boilerplate:

```bash
npm install @react-oauth/google
```

Wrap your app root with `<GoogleOAuthProvider clientId={...}>`, then use the
`useGoogleLogin` hook to obtain an `accessToken` before calling `exportToGoogleCalendar`.

---

## Step 5 — Replace the stub

In `src/hooks/useCalendarExport.js`, locate `exportToGoogleCalendar` and:

1. Uncomment the implementation outline above the function.
2. Replace the `throw new Error(...)` body with the loop from the skeleton.
3. Pass the `accessToken` obtained in Step 4.

The `addOneDay` helper is already defined in the same file and handles the exclusive-end
date conversion required by the Google Calendar API (`end.date` is also exclusive,
matching the iCalendar DTEND convention).

---

## Security notes

- **Never commit `.env`** — it is in `.gitignore` for good reason.
- The OAuth redirect URI **must be HTTPS** in production; `http://` origins are blocked
  by Google for production OAuth apps.
- Scope your OAuth consent to the minimum required:
  `https://www.googleapis.com/auth/calendar.events` (write-only, no read of existing events).
- Revoke and rotate credentials if they are ever accidentally exposed.
