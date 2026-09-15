# 📚 PageTurner — Online Bookstore Web Application

A complete full-stack online bookstore with a customer storefront, shopping
cart, Cashfree payment checkout, and a full admin dashboard.

**Tech Stack**
- Frontend: HTML, CSS, Vanilla JavaScript (no frameworks)
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt
- Payments: Cashfree Payment Gateway (Orders API v2022-09-01)

---

## 1. Folder Structure

```
online-bookstore/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── Book.js
│   │   ├── Order.js
│   │   ├── ContactMessage.js
│   │   └── Coupon.js
│   ├── controllers/                # Business logic
│   │   ├── authController.js
│   │   ├── adminAuthController.js
│   │   ├── bookController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js    # Cashfree integration
│   │   ├── couponController.js
│   │   ├── contactController.js
│   │   └── adminDashboardController.js
│   ├── middleware/
│   │   └── authMiddleware.js       # protectUser / protectAdmin
│   ├── routes/                     # Express routers
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── sendEmail.js            # Falls back to console log if no SMTP set
│   │   └── seed.js                 # Auto-seeds default admin + sample books
│   ├── server.js                   # App entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── index.html                  # Home: book list + Contact Us
│   ├── login.html / register.html
│   ├── forgot-password.html / reset-password.html
│   ├── cart.html
│   ├── checkout.html               # Cashfree checkout
│   ├── orders.html                 # User's order history
│   ├── admin-login.html
│   ├── admin-forgot-password.html / admin-reset-password.html
│   ├── admin-dashboard.html        # Full admin SPA (books, orders, users, coupons, messages)
│   ├── css/style.css
│   └── js/
│       ├── api.js                  # fetch() wrapper + session helpers
│       ├── nav.js
│       ├── home.js
│       ├── auth.js
│       ├── cart.js
│       ├── checkout.js
│       ├── orders.js
│       ├── admin-auth.js
│       └── admin.js
├── README.md
└── .gitignore
```

---

## 2. Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, **or** a free
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (get a connection string)
- A [Cashfree](https://www.cashfree.com/) merchant account (free sandbox/test credentials
  from the [Cashfree Dashboard](https://merchant.cashfree.com/merchants/login))
- Any static file server for the frontend (VS Code "Live Server" extension, or `npx serve`)

---

## 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your real values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5500

MONGO_URI=mongodb://127.0.0.1:27017/online_bookstore
# or an Atlas URI: mongodb+srv://<user>:<pass>@cluster.mongodb.net/online_bookstore

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=SANDBOX

DEFAULT_ADMIN_EMAIL=admin@bookstore.com
DEFAULT_ADMIN_PASSWORD=Admin@12345
```

> `CLIENT_URL` must match the URL where you serve the `frontend` folder — this is used to
> build the Cashfree "return URL" and password-reset links.

Run the backend:

```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```

On first run the server automatically:
- Connects to MongoDB
- Seeds a **default admin account** (`DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`) if none exists
- Seeds 6 sample books if the `Book` collection is empty

The API will be live at `http://localhost:5000/api` — check `http://localhost:5000/api/health`.

---

## 4. Frontend Setup

The frontend is plain static HTML/CSS/JS — no build step required.

1. Open `frontend/js/api.js` and confirm `API_BASE_URL` points to your backend
   (defaults to `http://localhost:5000/api`).
2. Serve the `frontend` folder with any static server, for example:

   ```bash
   cd frontend
   npx serve -l 5500
   ```

   or use the VS Code "Live Server" extension on port `5500` (recommended, since
   `CLIENT_URL` in `.env` defaults to `http://localhost:5500`).

3. Visit `http://localhost:5500/index.html` in your browser.

> ⚠️ Whichever port you serve the frontend on, make sure it matches `CLIENT_URL` in the
> backend `.env` file, or password-reset links and the Cashfree return URL will point
> to the wrong address.

---

## 5. Using the App

### Customer flow
1. Register a new account (`register.html`) or log in.
2. Browse/search books on the home page, use "Add to Cart" or "Buy Now".
3. Review your cart (`cart.html`) and click **Proceed to Checkout**.
4. Enter shipping details, optionally apply a coupon code, then **Pay with Cashfree**.
5. Complete payment on the Cashfree sandbox checkout page (use Cashfree's
   [test card/UPI credentials](https://www.cashfree.com/docs/payments/online/resources/sandbox-environment)).
6. You're redirected back, the payment is verified server-side, and the order appears
   under **My Orders**.

### Admin flow
1. Go to `admin-login.html` and log in with the seeded default admin
   (`admin@bookstore.com` / `Admin@12345` unless you changed `.env`).
2. From the dashboard sidebar you can:
   - View live stats (users, books, orders, revenue)
   - Add / edit / delete books
   - View and update the status of all customer orders
   - View all registered users and each user's order history; block/unblock users
   - Create / edit / delete discount coupons (percentage or flat, with expiry & usage limits)
   - Read and manage messages submitted via the Home page "Contact Us" form

### Password reset (dev mode)
No SMTP is required to test password reset. If `SMTP_HOST` is left blank in `.env`,
reset links/tokens are printed to the **backend server console** and also returned in
the API response so the frontend can show a clickable "reset now" link directly on the
Forgot Password page — handy for local testing. Configure real SMTP credentials in
`.env` to send actual emails in production.

---

## 6. Cashfree Payment Notes

- The backend calls Cashfree's Orders API (`/pg/orders`) to create a payment session,
  then the frontend uses the official **Cashfree Checkout JS SDK**
  (`https://sdk.cashfree.com/js/v3/cashfree.js`) to open the hosted checkout.
- After payment, Cashfree redirects back to `checkout.html?localOrderId=<id>`, and the
  frontend calls `GET /api/payment/verify/:orderId`, which re-checks the order status
  directly with Cashfree's servers (never trusts the redirect alone) before marking the
  order as paid, decrementing book stock, and clearing purchased items from the cart.
- A `POST /api/payment/webhook` endpoint is also included for server-to-server payment
  confirmation — configure it in your Cashfree dashboard for production use.
- Switch `CASHFREE_ENV=PRODUCTION` in `.env` and update `CASHFREE_MODE` at the top of
  `frontend/js/checkout.js` to `"production"` when you go live.

---

## 7. Security Notes

- Passwords are hashed with bcrypt (never stored in plain text).
- JWTs are role-scoped (`user` vs `admin`) — an admin token cannot access user-only
  routes and vice versa, enforced in `middleware/authMiddleware.js`.
- All sensitive credentials (DB URI, JWT secret, Cashfree keys) are loaded from `.env`
  and never hard-coded. `.env` is git-ignored — only `.env.example` is committed.
- Order prices are always recalculated server-side from the database; the client can
  never manipulate the amount charged.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| "Failed to load books" on home page | Backend not running or wrong `API_BASE_URL` in `frontend/js/api.js` |
| MongoDB connection error | Check `MONGO_URI` in `.env`, ensure MongoDB is running/accessible |
| Cashfree checkout fails to open | Verify `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` are correct sandbox test keys |
| Reset link goes to the wrong port | Make sure `CLIENT_URL` in `.env` matches the port your frontend is served on |
| Admin login fails after first run | Check backend console logs for the auto-seeded admin credentials |

---

Enjoy building on top of PageTurner! 🚀
