# Deployment Guide

## Prerequisites

- Node.js 18+
- A Google Cloud project with billing enabled
- A Vercel account (free tier is sufficient)

---

## 1. API Key Setup (Google Cloud Console)

### Create and restrict the key

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials → API key**.
3. Click **Edit key** on the new key.
4. Under **Application restrictions**, choose **HTTP referrers (web sites)**.
5. Add your domains:
   ```
   https://your-project.vercel.app/*
   https://yourdomain.com/*
   http://localhost:5173/*
   ```
6. Under **API restrictions**, choose **Restrict key** and select:
   - Maps JavaScript API
   - Places API (new)
   - Geocoding API
   - Directions API
7. Click **Save**.

---

## 2. Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings → Environment Variables**.
2. Add:
   - **Name**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: your restricted API key
   - **Environments**: Production, Preview, Development (check all three)
3. Click **Save**.

> Note: Vercel environment variables starting with `VITE_` are inlined at build time. They are visible in the browser bundle — API key restrictions (step 1) are your security boundary.

---

## 3. First Deploy

```bash
npm install -g vercel
vercel login          # opens browser for OAuth
vercel                # first deploy → follow prompts to link repo
vercel --prod         # promote to production URL
```

During `vercel` (first run):
- **Set up and deploy**: Yes
- **Which scope**: your personal account or team
- **Link to existing project**: No (creates new)
- **Project name**: `kyiv-map-dashboard` (or anything you like)
- **Directory**: `.` (project root)
- Vercel auto-detects Vite; confirm the settings.

---

## 4. Custom Domain

1. In Vercel Dashboard → your project → **Settings → Domains**.
2. Add your domain (e.g., `kyiv.yourdomain.com`).
3. Add the DNS records Vercel shows you (CNAME or A record) at your registrar.
4. Vercel auto-provisions a TLS certificate.

Remember to add the custom domain to your Google Cloud API key HTTP referrer restrictions.

---

## 5. Automatic Re-deploys via Git Push

Connect GitHub for automatic deployments:

1. In Vercel Dashboard → your project → **Settings → Git**.
2. Connect the `jmackSosaAi/kyiv-map-dashboard` repository.
3. Set **Production Branch** to `master`.

After that, every `git push origin master` triggers a production deploy automatically. Pull request branches get preview deployments.

---

## 6. Rolling Back

In Vercel Dashboard → your project → **Deployments**, click any previous deployment → **Promote to Production** to instantly roll back.
