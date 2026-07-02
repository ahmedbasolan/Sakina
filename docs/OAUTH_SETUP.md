# OAuth Setup Guide — Google & Apple Sign-In

The app code is **done**. Sign-in will start working after you complete these
dashboard steps and make one new EAS build. Budget ~45 minutes.

Keep this handy: your Supabase callback URL is
`https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
(find the project ref in Supabase → Project Settings → General).

---

## Part 1 — Google (≈20 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create
   (or pick) a project called **Sakina**.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → fill in app name "Sakina", your email, save.
   - Add scopes: `email`, `profile`, `openid` (the defaults).
   - Publish the app (or add your own email as a test user while testing).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application** (yes, web — Supabase does the
     browser handshake, not the phone).
   - Name: `Sakina Supabase`.
   - Authorized redirect URIs: paste your Supabase callback URL from above.
   - Create → copy the **Client ID** and **Client Secret**.
4. **Supabase dashboard → Authentication → Sign In / Providers → Google**
   - Toggle **Enable**, paste the Client ID and Client Secret, Save.
5. **Supabase dashboard → Authentication → URL Configuration**
   - Under **Redirect URLs**, add exactly: `sakina://`
   - (This lets the browser hand the session back to the app.)

## Part 2 — Apple (≈20 min, needs your Apple Developer account)

1. Go to [developer.apple.com](https://developer.apple.com/account) →
   **Certificates, Identifiers & Profiles → Identifiers**.
2. Find the App ID **com.lelahmed.sakina** (create it if missing).
   - Tick the **Sign in with Apple** capability → Save.
   - ⚠️ Skipping this makes the iOS EAS build fail at the credentials step.
3. **Supabase dashboard → Authentication → Sign In / Providers → Apple**
   - Toggle **Enable**.
   - In **Client IDs**, add: `com.lelahmed.sakina`
   - (That's all the native flow needs — the app sends Apple's identity token
     straight to Supabase. No Services ID or secret key required unless you
     later add Apple sign-in on web.)

## Part 3 — Rebuild (one build covers OAuth + the notification fix)

```bash
eas build --profile preview --platform all
```

- The build must be a **fresh native build** — OAuth and the notification
  background task both added native modules that Expo OTA updates can't ship.
- When EAS asks about iOS capabilities, let it sync (it will pick up Sign in
  with Apple).

## Part 4 — Verify on device

- [ ] Google button opens a browser, you pick an account, and you land back
      in the app signed in.
- [ ] Apple button (iOS only) shows the native Face ID sheet and signs you in.
- [ ] Supabase dashboard → Authentication → Users shows the new accounts.
- [ ] Leave the app closed 3–4 days → prayer reminders keep arriving
      (verifies the notification top-up task from the same build).

## If something fails

- **"redirect_uri_mismatch" (Google)** → the callback URL in Google
  Credentials doesn't exactly match the Supabase one. No trailing slash.
- **Browser opens, signs in, but returns to a blank app** → `sakina://` is
  missing from Supabase's Redirect URLs (Part 1, step 5).
- **Apple button does nothing / build fails** → the Sign in with Apple
  capability isn't on the App ID (Part 2, step 2).
