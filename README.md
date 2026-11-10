# CS MARCHE

A bilingual (English / Arabic) student-to-student marketplace for the CS community. Discover useful items, publish your own listings, and contact sellers directly.

## Features

- Registration, login, logout, HttpOnly JWT session cookies, and Argon2 password hashing.
- Public product browsing with text search, category filtering, and pagination.
- Listing details with seller contact information and WhatsApp contact.
- Create, edit, and delete your own listings with ownership enforcement.
- Profile settings for name, phone, WhatsApp, and short bio.
- Responsive homepage, marketplace, listing details, dashboard, profile, login, and registration pages.
- Arabic / English language switch with RTL layout and a darker warm-neutral visual theme.
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

5. Visit http://localhost:3000. Health check: `GET /api/health`.

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
| POST | `/api/auth/logout` | Public | End session |
| GET | `/api/auth/me` | Signed in | Current account |
| PATCH | `/api/auth/profile` | Signed in | Update profile |
| GET | `/api/products` | Public | Search and browse |
| GET | `/api/products/:id` | Public | Listing details |
| GET | `/api/products/mine` | Signed in | Your listings |
| POST | `/api/products` | Signed in | Publish listing |
| PATCH | `/api/products/:id` | Owner | Edit listing |
| DELETE | `/api/products/:id` | Owner | Delete listing |

## Production checklist

- Use MongoDB Atlas or managed MongoDB with a dedicated database user, restricted network access, and backups.
- Set `NODE_ENV=production`, a unique strong `JWT_SECRET`, and the production `MONGODB_URI`.
- Deploy behind HTTPS. Secure cookies are enabled automatically in production.
- Configure a persistent image hosting service (such as Cloudinary) before enabling binary image uploads.
- Configure the production domain, monitoring, backups, and error reporting.
- Test registration, login, ownership, listing CRUD, search, and WhatsApp contact on the deployed domain.

## Localization

The interface supports English and Arabic. Use the language switch in the header; the selected language is saved in the browser. Arabic pages use right-to-left layout. Listing titles and descriptions are user-generated content and remain as entered by their authors.

## Image handling limitation

Listings currently accept an HTTPS image URL. Direct image uploads and Cloudinary integration are not implemented yet; this must be added before presenting uploads as a supported feature.

## Security

Passwords are hashed with Argon2. Session tokens use HttpOnly, SameSite=Lax cookies. API requests are rate-limited, inputs are validated, and listing mutations are restricted to their owner. Never commit `.env` or production secrets.
