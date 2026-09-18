# QuestVault waitlist landing

A static, mobile-first waitlist landing page for QuestVault. It uses the approved draft positioning and clearly labels the product and pricing as not live/final.

## Files

- `index.html` — semantic page structure, metadata, navigation, sections, and waitlist form
- `styles.css` — responsive B2B marketing styles; no framework required
- `app.js` — mobile navigation, FAQ behavior, localStorage waitlist capture, and optional POST endpoint

## Run locally

Serve the folder with any static server (opening `index.html` directly also works for the localStorage-only flow):

```bash
cd questvault-waitlist
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Waitlist behavior and endpoint configuration

The static MVP always stores a submission in the visitor’s browser under `questvault_waitlist_submissions` and shows a success state. This is useful for a demo, but localStorage is not a shared lead database.

To POST to a real service, set the endpoint at build/deploy time in `index.html`:

```html
<script>window.QUESTVAULT_CONFIG = { endpoint: "https://your-endpoint.example/waitlist" };</script>
```

For an environment-based build, keep the checked-in `__WAITLIST_ENDPOINT__` placeholder and replace it during your build step. For example, a small CI/build script can replace `__WAITLIST_ENDPOINT__` with `$WAITLIST_ENDPOINT`; do not commit the endpoint if it contains a secret. The browser only needs a public form endpoint—never put API keys or private credentials in these files.

### Formspree

1. Create a Formspree form and copy its public form endpoint.
2. Set `window.QUESTVAULT_CONFIG.endpoint` to that URL.
3. If the Formspree form expects URL-encoded fields rather than JSON, adjust the `fetch` body/headers in `app.js` or use Formspree’s native form action.
4. Submit a test email and confirm it appears in the Formspree inbox.

### Tally

1. Create a Tally form with an email field and copy its public share/embed URL or webhook destination.
2. For the simplest setup, replace the custom form submit with Tally’s hosted form/embed.
3. For a custom UI, send the matching JSON payload to a server-side proxy or Tally-compatible webhook. Keep any signing secret on that server, not in `app.js`.

## Future `api/` note (Next.js)

No backend or `api/` directory is shipped in this static MVP. A future Next.js implementation can point `window.QUESTVAULT_CONFIG.endpoint` at `/api/waitlist` and move provider credentials server-side. The route should validate the email, rate-limit and deduplicate submissions, apply bot protection, then forward to the chosen provider or database. Never expose provider keys in the browser or commit `.env` files.

Example environment names for the future app (not used by this static page):

```text
WAITLIST_PROVIDER_ENDPOINT=
WAITLIST_PROVIDER_TOKEN=
```

## Deploy

### Vercel (static)

1. Import the repository/project in Vercel.
2. Set the project root to `questvault-waitlist` if this folder is inside a larger repository.
3. Use no framework preset. Leave the build command blank; output directory is `.`.
4. Deploy. If using an endpoint, configure a public `WAITLIST_ENDPOINT` in the build environment and add a build replacement step—do not place private tokens in client code.

### Netlify (static)

1. Add the repository/site in Netlify.
2. Set the base directory to `questvault-waitlist`.
3. Leave the build command blank and publish directory as `.`.
4. Deploy. Configure any public endpoint replacement in the site’s build settings; keep provider secrets in a server-side function or external form provider.

## Scope guardrails

This is a draft waitlist page only. It includes no auth, Stripe, backend, analytics, or secrets. QuestVault is not live SaaS yet; draft pricing and product details may change.
