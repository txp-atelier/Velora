# Velora Ecommerce Application

A full-stack Amazon/Flipkart-style ecommerce web application built with React (Vite) and Node.js/Express, powered by MongoDB.

## Features

- **Home** — Hero carousel, category shortcuts, deals, trending, best sellers
- **Product Listing** — Search, filters (price, category, rating, brand, stock, discount), sort
- **Product Detail** — Image gallery, specs, reviews with purchase eligibility
- **Cart & Checkout** — Server-side cart, mock payment flow, orders in MongoDB
- **Auth** — Customer/Seller signup, login, password reset (modal-based, no login wall for browsing)
- **Seller Dashboard** — Product CRUD with Cloudinary image upload
- **Customer Dashboard** — Order history
- **Theme** — Light/dark mode with sessionStorage persistence

## Tech Stack

- **Frontend:** React, Vite, React Router, Lucide React
- **Backend:** Node.js, Express, JWT, bcrypt
- **Database:** MongoDB via Mongoose
- **Images:** Cloudinary (user uploads); seed data uses picsum.photos URLs

## Prerequisites

- Node.js v18+
- MongoDB running locally (or a remote `MONGODB_URI`)
- Cloudinary account (optional — required only for image uploads)

## Installation

```bash
# Server
cd server
cp .env.example .env
npm install

# Client
cd ../client
npm install
```

## Environment Variables

Create `server/.env` from `.env.example`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/velora
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Seed Database

With MongoDB running:

```bash
cd server
npm run seed
```

This creates 35 products, 4 sellers, 4 customers, sample orders, and reviews.

## Running the Application

**Terminal 1 — API server (port 5000):**

```bash
cd server
npm start
```

**Terminal 2 — React dev server (port 5173):**

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Demo Accounts

All accounts use password: **`password123`**

| Role | Email |
|------|-------|
| Customer | tharun@example.com |
| Customer | priya@example.com |
| Customer | rahul@example.com |
| Customer | ananya@example.com |
| Seller | seller1@velora.com |
| Seller | seller2@velora.com |
| Seller | seller3@velora.com |
| Seller | seller4@velora.com |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account (customer or seller) |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Current user |
| POST | /api/auth/forgot-password | Request reset token (logged to console) |
| POST | /api/auth/reset-password | Reset password |
| GET | /api/products | List/search/filter products |
| GET/POST/PUT/DELETE | /api/products/:id | Product CRUD (seller) |
| GET/POST/PUT/DELETE | /api/cart | Cart operations |
| GET/POST | /api/orders | Orders |
| GET/POST | /api/reviews | Reviews |
| POST | /api/upload | Cloudinary image upload |

## Project Structure

```
ecommerce-app/
├── client/           # React Vite app
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/api.js
│       └── index.css
├── server/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── seed.js
│   └── server.js
├── STYLE_GUIDE.md
└── README.md
```

## Build

```bash
cd client
npm run build
```

## License

MIT
