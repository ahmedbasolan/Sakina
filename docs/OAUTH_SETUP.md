# OAuth Setup Guide — Google now, Apple later

Rollout plan: **Google Play first, App Store later.** The Apple sign-in button
only renders on iOS, so a Play release needs **only the Google steps** below.
The app code is done — after these dashboard steps, one new build activates
sign-in (and the notification background fix from the same batch).

Your Supabase callback URL (used in Google step 3):
`https://kfoogulmkylgtxwqbeat.supabase.co/auth/v1/callback`

---

## Now: Google (≈20 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create
   (or pick) a project called **Sakina**.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → app name "Sakina", your email, save.
   - Scopes: `email`, `profile`, `openid` (the defaults).
   - While testing, add your own Gmail as a test user.
   - ⚠️ **Before the Play launch, click "Publish app"** on the consent screen —
     in Testing mode only your test users can sign in.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application** (yes, web — Supabase does the
     browser handshake; no Android client or SHA-1 fingerprints needed for
     this flow, even on Play).
   - Name: `Sakina Supabase`.
   - Authorized redirect URIs: the Supabase callback URL above (exact, no
     trailing slash).
   - Create → copy **Client ID** and **Client Secret**.
4. **Supabase dashboard → Authentication → Sign In / Providers → Google**
   - Enable, paste Client ID + Client Secret, Save.
5. **Supabase dashboard → Authentication → URL Configuration**
   - Under **Redirect URLs**, add exactly: `sakina://`

## Now: Build & test (Android)

```bash
# test build first (installable APK)
eas build --profile preview --platform android
```

Verify on your phone:
- [ ] Google button opens a browser, you pick an account, you land back in
      the app signed in.
- [ ] Supabase dashboard → Authentication → Users shows the new account.
- [ ] Leave the app closed 3–4 days → prayer reminders keep arriving
      (verifies the notification top-up task in the same build).

Then the store build:

```bash
eas build --profile production --platform android   # produces the .aab for Play
```

## Play Store submission notes (not OAuth, but you'll hit them)

- Play Console will ask for a **privacy policy URL** — required because the
  app has accounts and optional crash reporting. A simple hosted page is fine.
- **Data Safety form**: data collected = email address + name (account),
  optional crash logs (user consent, off by default). No ads, no data sold.
  Location is used on-device for prayer times.
- First upload goes smoothest via **Internal testing** track, then promote.

---

## Later: Apple (before the App Store release)

1. [developer.apple.com](https://developer.apple.com/account) →
   **Identifiers** → App ID **com.lelahmed.sakina** → tick **Sign in with
   Apple** capability → Save.
   ⚠️ Skipping this makes the iOS EAS build fail at the credentials step.
2. **Supabase → Authentication → Providers → Apple** → Enable → add
   `com.lelahmed.sakina` under **Client IDs**. (No Services ID or secret
   needed for the native flow.)
3. `eas build --profile production --platform ios` — let EAS sync the
   capability when asked.
4. App Store review note: Apple **requires** Sign in with Apple whenever an
   app offers Google sign-in — you already have it, so you're compliant.

## If something fails

- **"redirect_uri_mismatch" (Google)** → callback URL in Google Credentials
  doesn't exactly match Supabase's. No trailing slash.
- **Signs in but returns to a blank app** → `sakina://` missing from
  Supabase Redirect URLs (step 5).
- **"Access blocked: app not verified"** → consent screen still in Testing
  mode and that account isn't a test user — add it, or publish the app.
- **EAS build fails on env** → run `eas env:list` and confirm
  `SUPABASE_ANON_KEY` (and `POSTHOG_API_KEY`) exist as EAS secrets — the
  build errors out if any `@env` key is missing.
