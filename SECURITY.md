# Security Review — Druze Spirit & Voice of Druze

**Date:** 2026-06-03
**Scope:** Static website (`index.html`, `activities.html`, `contact.html`, `druze-spirit.html`, `follow-us.html`, `voice-of-druze.html`, `shared.js`, `style.css`, `_headers`).
**Hosting:** GitHub Pages (`github.com/SaidGanim92/Druze-website`, CNAME `druzespirit.org`).

This is a **fully static site** with no server-side code. That fact bounds what is
attackable and what is fixable — there is no backend to inject into, no database, no
sessions, and (critically) **no way to set custom HTTP response headers on GitHub Pages.**

---

## The single most important finding

> **The `_headers` file added in earlier commits does nothing in production.**
> `_headers` is a **Netlify / Cloudflare Pages** feature. GitHub Pages ignores it and
> cannot serve custom headers at all. So HSTS, X-Frame-Options, Permissions-Policy, and
> the header-delivered CSP were **never reaching the browser.**
>
> Likewise, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy`
> delivered as `<meta http-equiv>` tags are **silently ignored by browsers** — those
> headers are only honored when sent as real HTTP headers.
>
> The one security header browsers *do* honor from a `<meta>` tag is
> **Content-Security-Policy**, and it was missing from the HTML. Adding it (done in this
> pass) is the highest-impact protection actually achievable on this host.

---

## Vulnerabilities found & what was done

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | No effective Content-Security-Policy (only lived in the inert `_headers` file) | **MEDIUM** | **Fixed** — added a working `<meta http-equiv="Content-Security-Policy">` to all 6 HTML files |
| 2 | Security headers configured only via `_headers` (inert on GitHub Pages) | **MEDIUM** | **Documented** — see `_headers` header note + "Requires hosting change" below |
| 3 | `X-Frame-Options` / `nosniff` / `Permissions-Policy` set via `<meta>` (ignored by browsers) | **LOW** | **Documented** — left in place (harmless) but they do not protect; real fix is a header-capable host |
| 4 | External `target="_blank"` links used `rel="noopener"` without `noreferrer` | **LOW** | **Fixed** — all upgraded to `rel="noopener noreferrer"` (tab-nabbing + referrer-leak hardening) |
| 5 | Contact form inputs had no length caps or autocomplete semantics | **LOW** | **Fixed** — added `maxlength` bounds + semantic `autocomplete`/`inputmode` tokens |
| 6 | `_headers` contained an invalid `Server: .` directive and an over-broad CSP (`unpkg.com`, unused) | **LOW** | **Fixed** — removed invalid directive, dropped unused `unpkg.com`, added `frame-ancestors 'none'` |

### Details

**1 & 2 — CSP.** Added this policy as a meta tag to every page (and kept a stricter
header-form copy in `_headers` for if/when hosting moves):

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
style-src  'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src   'self' https://fonts.gstatic.com;
img-src    'self' data: https:;
connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://formspree.io;
form-action 'self' https://formspree.io;
base-uri 'self'; object-src 'none'; frame-src 'none';
```

`'unsafe-inline'` is required because the site relies on inline `<script>` blocks,
inline `onclick=` handlers, and inline `style=` attributes throughout. Removing it would
need a substantial refactor (extract every inline handler/style) and is the main remaining
CSP hardening opportunity — see "Recommended next steps."

**4 — External links.** All social/external anchors now use `rel="noopener noreferrer"`.

**5 — Form inputs.** `name` (`maxlength=100`, `autocomplete=name`), `email`
(`maxlength=254`, `autocomplete=email`), `phone` (`maxlength=30`, `autocomplete=tel`),
`message` (`maxlength=5000`). These cap payload size and improve autofill semantics.
Authoritative validation still happens server-side at Formspree.

---

## Things checked and found NOT vulnerable

- **XSS / `innerHTML`:** `shared.js` and the contact-form reset both assign
  `el.innerHTML = el.getAttribute('data-ar'|'data-en')`. The source is **author-authored
  static HTML attributes**, not user input — and several values intentionally contain
  markup (`<br>`, `<span>`, `<a href>`). No untrusted data reaches the DOM, so this is not
  an XSS sink. Left as-is by design.
- **Reflected/DOM input:** The lightbox reads from hard-coded image arrays; nothing reads
  from `location`, `URLSearchParams`, `document.referrer`, `postMessage`, etc.
- **Mixed content:** None. Every external resource (Google Fonts, gtag, Formspree, social
  links) is `https://`.
- **Open redirect:** No redirect logic exists.
- **Secrets in client code:** None. The contact email (`druzespiritintl@gmail.com`), the
  GA4 measurement ID (`G-NYTTGCMX9L`), and the Formspree form ID (`meewjned`) are all
  **public-by-design client identifiers**, not credentials.
- **Form transport:** Contact form posts to `https://formspree.io` (TLS). Good.
- **`.DS_Store`:** Not tracked by git (correctly gitignored).

---

## Requested items deliberately NOT applied (and why)

A few items from the request would be counter-productive on this site; doing them blindly
would weaken or break it. Flagging instead of silently skipping:

- **SRI (`integrity`) on Google `gtag.js`** — **Do not.** Google serves `gtag.js` as a
  frequently-changing, dynamically-generated file and **explicitly does not support SRI**
  on it. A pinned `integrity` hash would break analytics the moment Google updates the
  file. SRI is only appropriate for versioned, immutable assets; this site has none.
- **`autocomplete="off"` on form fields** — **Not appropriate.** None of the fields are
  credentials/payment data. Browsers largely ignore `off` on name/email anyway, and it
  hurts accessibility and autofill. Correct best practice (applied instead): semantic
  `autocomplete` tokens.
- **`novalidate` on the form** — **Do not.** `novalidate` *disables* the browser's
  built-in validation (`required`, `type="email"`); it reduces input checking rather than
  adding "protection." The native validation was kept.
- **"Rate-limiting hints via meta tags"** — **Not a real mechanism.** There is no meta tag
  that rate-limits requests. Abuse throttling is enforced server-side by Formspree on the
  form endpoint.

---

## Requires a server / hosting change (not possible on static GitHub Pages)

These need infrastructure the current host cannot provide:

1. **Real HTTP security headers** (HSTS, `X-Frame-Options` / `frame-ancestors`,
   `X-Content-Type-Options`, `Permissions-Policy`, header-form CSP). GitHub Pages cannot
   send custom headers. **Recommended:** front the site with **Cloudflare** (free —
   Transform Rules / Response Header Modification) or move to **Cloudflare Pages /
   Netlify**, where the existing `_headers` file becomes active automatically. This is the
   biggest available security upgrade and would activate clickjacking protection
   (`frame-ancestors`), HSTS, and nosniff for real.
2. **CSRF tokens** on the contact form — requires server-rendered per-session tokens.
   Formspree handles abuse/spam protection server-side; a static page cannot mint tokens.
3. **Server-side input validation/sanitization** of submissions — handled by Formspree.

---

## Recommended next steps (priority order)

1. **Put Cloudflare in front of the domain** (or migrate to Cloudflare Pages/Netlify) so
   `_headers` activates → instantly gains HSTS, real clickjacking protection, nosniff.
2. **Enable Formspree's reCAPTCHA / honeypot** in the Formspree dashboard to cut spam.
3. (Optional, larger effort) Remove `'unsafe-inline'` from `script-src` by extracting
   inline scripts and `onclick` handlers into `shared.js`, then tighten the CSP.
