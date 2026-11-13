# CS MARCHE

A bilingual (English / Arabic) student-to-student marketplace for the CS community. Discover useful items, publish your own listings, and contact sellers directly by phone or WhatsApp.

## Features

- Registration and login with email and password; email is used only as the account login identifier.
- Argon2 password hashing and HttpOnly JWT session cookies.
- Public product browsing with text search, category filtering, and pagination.
- Public listing responses contain seller display names only. Phone and WhatsApp contact details are returned only to signed-in users through a separate endpoint.
- Authenticated Cloudinary image uploads (JPG, PNG, WebP, GIF, AVIF, BMP; 10 MB maximum), with server-side file-signature checks and upload rate limiting.
- Seller availability controls to mark a listing as sold or available.
- Egyptian WhatsApp number normalization before generating chat links.
- Create, edit, and delete your own listings with server-side ownership enforcement.
- Profile settings for name, phone, WhatsApp, and short bio.
- Responsive homepage, marketplace, listing details, dashboard, profile, login, and registration pages.
- Arabic / English language switch with RTL layout.
- Zod request validation, API rate limiting, Helmet security headers, and MongoDB indexes.

## Stack

Node.js 20+, Express 5, MongoDB/Mongoose, vanilla HTML/CSS/JavaScript, Argon2, JWT, Zod, Helmet.

## Run locally

1. Install Node.js 20+ and MongoDB (local or Atlas).
2. Install packages:

   ```bash
   npm install
   ```

3. Create `.env` in the project root:

   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/cs_marche
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
   APP_ORIGIN=http://localhost:3000
   TRUST_PROXY=0
   JWT_EXPIRES_IN=1d
   ```

   Generate a secret:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

4. Start:

   ```bash
   npm run dev
   ```

5. Visit http://localhost:3000. Health check: `GET /api/health`. The health check returns HTTP 503 if MongoDB is disconnected.

## Pages

- `/` — Homepage
- `/market.html` — Browse, search, and filter listings
- `/product.html?id=...` — Listing details
- `/login.html` and `/register.html` — Authentication
- `/dashboard.html` — Manage your listings
- `/create-listing.html` — Create or edit a listing
- `/profile.html` — Edit profile and contact details

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Start session |
| POST | `/api/auth/logout` | Signed in | End session and revoke existing sessions |
| GET | `/api/auth/me` | Signed in | Current account |
| PATCH | `/api/auth/profile` | Signed in | Update profile |
| GET | `/api/products` | Public | Search and browse |
| GET | `/api/products/:id` | Public | Listing details without private contact data |
| GET | `/api/products/:id/contact` | Signed in | Seller phone and WhatsApp contact |
| PATCH | `/api/products/:id/availability` | Owner | Mark a listing sold or available |
| GET | `/api/products/mine` | Signed in | Your listings |
| POST | `/api/products` | Signed in | Publish listing |
| PATCH | `/api/products/:id` | Owner | Edit listing |
| DELETE | `/api/products/:id` | Owner | Delete listing |

## Password recovery

There is no email-based password reset. If a user forgets their password, an administrator with access to the deployment environment can run:

```bash
npm run admin:reset-password -- student@example.com
```

The script asks for a new password without displaying it, stores only its Argon2 hash, and revokes the user's existing sessions. Confirm the user's identity personally before running it. Do not expose this operation as a public API endpoint.

## Production checklist

- Use managed MongoDB with a dedicated database user, restricted network access, and automatic backups. Test that a backup can be restored.
- Set `NODE_ENV=production`, a unique random `JWT_SECRET` of at least 48 characters, and the production `MONGODB_URI`.
- Deploy behind HTTPS and set `APP_ORIGIN` to the exact HTTPS origin.
- Set `TRUST_PROXY` only to the exact number of trusted reverse proxies used by the host.
- Keep production secrets in the hosting provider's environment settings, never in Git.
- Test registration, login, logout, listing ownership, profile privacy, contact visibility, search, and WhatsApp/phone links on the deployed domain.
- Monitor application errors and database availability.

## Product images

Product photos are uploaded to Cloudinary; only the resulting HTTPS URL is stored with the listing. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in hosting environment variables. Uploads require login, accept JPG/PNG/WebP up to 10 MB, validate file signatures server-side, and are rate-limited. Never expose the Cloudinary API secret in frontend code.

## Security notes

Passwords are hashed with Argon2. JWTs are restricted to HS256 and stored in HttpOnly, SameSite=Lax cookies; cookies are Secure in production. A per-user token version revokes existing sessions on logout and administrative password reset. Unsafe API requests require a matching Origin header. API requests are rate-limited, inputs are validated, and listing mutations are restricted to their owner. Public listing responses do not include seller phone numbers or WhatsApp details.
