# CharityGuard

Blockchain-powered charity fraud detection platform with AI-driven risk scoring. Validates donations against IRS databases (559,000+ records), records transactions on Ethereum, and provides real-time fraud analysis with 92% detection accuracy.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Material-UI 5, Recharts, ethers.js |
| Backend | Node.js 18+, Express 4, MongoDB (Mongoose 8) |
| Blockchain | Solidity 0.8.19, Ethereum, MetaMask |
| Auth | JWT, Google OAuth2, bcryptjs |
| Payments | Stripe, Transak SDK |
| Logging | Winston |

## Features

- **Real-time Fraud Detection** — Weighted Risk Scoring System (WRSS) with 92% accuracy
- **IRS Verification** — Validates charities against 559,000+ IRS nonprofit records
- **Blockchain Transparency** — All donations recorded on Ethereum via Solidity smart contract
- **Trust Score System** — Auto-whitelists high-performers, flags suspicious charities
- **Admin Dashboard** — Forensic tools, activity logs, flagged transaction management
- **Secure Auth** — JWT + Google OAuth2, bcrypt, rate limiting, XSS/injection protection

**Fraud Detection Weights:**
- Invalid/Unknown EIN: +0.35
- Not in IRS database: +0.25
- Unusually high donation (>0.5 ETH): +0.15
- New donor wallet (<24h old): +0.10
- Suspicious name patterns: +0.09
- High transaction velocity: +0.06
- Score >= 0.65 = FLAGGED, < 0.65 = VERIFIED

## Project Structure

```
CharityGuard/
├── backend/                # Express API server
│   ├── index.js            # Entry point + fraud detection logic
│   ├── config/             # DB connection, env validation
│   ├── controllers/        # Business logic
│   ├── models/             # Mongoose schemas (Transaction, User, Nonprofit, IRSOrg)
│   ├── routes/             # API route handlers
│   ├── services/           # Blockchain, verification, analytics
│   ├── middleware/         # Auth, security, error handling
│   └── scripts/            # IRS data import, demo data generation
├── charityguard-frontend/  # React + TypeScript UI
│   └── src/
│       ├── pages/          # 14+ page components (user + admin)
│       ├── components/     # TrustScore, TransactionFeed, etc.
│       └── hooks/          # useBlockchain, useAdminAuth
└── blockchain/
    └── CharityGuardContract.sol  # Solidity smart contract
```

## Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- MetaMask browser extension

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

### Data Import (optional)

```bash
cd backend
node scripts/importIrsData.js       # Load IRS nonprofit CSV data
node scripts/generateDemoData.js    # Generate test transactions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/nonprofits/search?q=` | Search verified charities |
| `POST` | `/api/transactions` | Submit donation with fraud detection |
| `GET` | `/api/transactions/flagged` | View flagged transactions |
| `GET` | `/api/transactions/stats/fraud` | Fraud statistics |
| `PATCH` | `/api/transactions/:id/status` | Update transaction status |
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/activityLogs` | Admin activity logs |

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

## Smart Contract

`CharityGuardContract.sol` provides on-chain:
- Charity registration and deactivation
- Donation recording with fraud scores
- Funds held if fraud score > 70%, released on manual verification
- Donor history tracking
- Emergency withdrawal function

## License

Private
