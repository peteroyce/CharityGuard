# CharityGuard

Blockchain-powered charity fraud detection platform with AI-driven risk scoring. Validates donations against IRS databases, records transactions on Ethereum, and provides real-time fraud analysis.

## Features
- **Real-time Fraud Detection** — Weighted Risk Scoring System (WRSS) with 92% accuracy
- **IRS Verification** — Validates charities against 559,000+ IRS nonprofit records
- **Blockchain Transparency** — All donations recorded on Ethereum via Solidity smart contract
- **Trust Score System** — Auto-whitelists high-performers, flags suspicious charities
- **Admin Dashboard** — Forensic tools, activity logs, flagged transaction management
- **Secure Auth** — JWT + Google OAuth2, bcrypt, rate limiting, XSS/injection protection

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Material-UI, ethers.js |
| Backend | Node.js, Express 4, MongoDB (Mongoose) |
| Blockchain | Solidity 0.8.19, Ethereum, MetaMask |
| Auth | JWT, Passport.js, Google OAuth2 |
| Payments | Stripe, Transak SDK |

## Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- MetaMask browser extension
- Git

## Setup

### 1. Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/charityguard
JWT_SECRET=your_32_char_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
# Optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
```

```bash
npm run dev   # Development server with nodemon
```

### 2. Frontend
```bash
cd charityguard-frontend
npm install
```

Create `charityguard-frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address
```

```bash
npm start   # Runs on http://localhost:3000
```

### 3. Smart Contract
Deploy `blockchain/CharityGuardContract.sol` to an Ethereum testnet (e.g. Sepolia), then update `REACT_APP_CONTRACT_ADDRESS` in the frontend `.env`.

## Project Structure
```
CharityGuard/
├── backend/
│   ├── controllers/        # Request handlers
│   ├── routes/             # API routes (nonprofits, transactions, users)
│   ├── models/             # MongoDB schemas
│   ├── middleware/         # Auth, security, validation, error handling
│   ├── services/           # Fraud detection, blockchain, analytics
│   └── index.js            # Entry point
├── charityguard-frontend/
│   ├── src/
│   │   ├── pages/          # 14+ page components (user + admin)
│   │   ├── components/     # Reusable UI (TrustScore, TransactionFeed, etc.)
│   │   └── hooks/          # Custom React hooks
│   └── public/
└── blockchain/
    └── CharityGuardContract.sol
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nonprofits/search?q=` | Search verified charities |
| POST | `/api/transactions` | Submit donation with fraud detection |
| GET | `/api/transactions/flagged` | View flagged transactions |
| GET | `/api/transactions/stats/fraud` | Fraud statistics |
| PATCH | `/api/transactions/:id/status` | Update transaction status |
| GET | `/api/activityLogs` | Admin activity logs |

## Scripts
```bash
# Backend
npm run dev        # Start with nodemon
npm start          # Production
npm test           # Jest tests with coverage
npm run lint       # ESLint

# Frontend
npm start          # Dev server on http://localhost:3000
npm run build      # Production build
```
