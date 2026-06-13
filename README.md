# Pet Shop

Full-stack pet shop with customer checkout, seller dashboard, and a Node.js backend.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000)

The site must be served through the Node server so authentication and product APIs work.

## Demo accounts

| Role | Login | Password |
|------|-------|----------|
| Customer | customer@petshop.com | petshop123 |
| Seller | admin (username) | petshop2024 |

- Customer login: `/login.html`
- Seller dashboard: `/seller.html`

## Features

- Responsive layout for mobile, tablet, and desktop
- Customer sign up / login with secure password hashing
- Shopping cart and checkout with order storage
- Seller dashboard to manage products and update order status
- Product catalog loaded from the backend API
- Category pages: cats, dogs, pet food, accessories

## Optional configuration

Create a `.env` file for Google Sign-In:

```
GOOGLE_CLIENT_ID=your-google-client-id
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
DEFAULT_SELLER_EMAIL=seller@example.com
OTP_TTL_MS=600000
PORT=3000
```

The login and signup flow now sends a one-time password to the account email before issuing a session token. For local testing, OTP and order emails are written to `data/emails-debug.log` when SMTP is not configured.

## Project structure

- `server.js` — Express API (auth, products, orders)
- `auth.js` — Shared client auth helpers
- `products.js` — Shared product loading/rendering
- `shop.js` — Storefront, cart, and category pages
- `seller.js` — Seller dashboard logic
- `checkout.js` — Checkout flow
- `data/` — JSON storage (created automatically)

## Handoff notes

- Change the default seller password before production use.
- Replace JSON file storage with a database for high-traffic deployments.
- Payment fields on checkout are collected for demo purposes only; integrate a real payment gateway for live sales.
