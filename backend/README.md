# CharityGuard API

AI-powered fraud detection for charitable donations. Verifies nonprofits against the IRS database (559K+ records) and scores blockchain donation transactions for fraud risk.

## Quick Start

```bash
cp .env.example .env        # fill in your values
npm install
node scripts/seed-admin.js  # ADMIN_PASSWORD=yourpass required
npm run dev                 # starts on port 3001
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32 chars, used to sign access tokens |
| `NODE_ENV` | No | `development` / `production` |
| `PORT` | No | Default: `3001` |
| `GOOGLE_CLIENT_ID` | No | Enables Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Enables Google OAuth |
| `FRONTEND_URL` | No | CORS allowed origin, default: `http://localhost:3000` |

## Auth Flow

```
POST /api/auth/register  →  { accessToken, refreshToken }
POST /api/auth/login     →  { accessToken, refreshToken }
POST /api/auth/refresh   →  { accessToken, refreshToken }  (rotate)
POST /api/auth/logout    →  revokes both tokens

# Access token: 15 minutes
# Refresh token: 30 days, stored in DB, rotated on each /refresh call
# Include access token in all protected requests:
Authorization: Bearer <accessToken>
```

---

## Endpoints

### Auth — `/api/auth`

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password1","username":"alice"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password1"}'

# Refresh access token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Get current user
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Google OAuth
curl -X POST http://localhost:3001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<google-id-token>"}'
```

---

### Transactions — `/api/transactions`

```bash
# Submit a transaction (runs fraud detection)
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0xabc123...",
    "nonprofitName": "American Red Cross",
    "nonprofitEIN": "53-0196605",
    "donorAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "recipientAddress": "0xRedCrossWallet456",
    "amount": 0.05,
    "blockNumber": 18456789
  }'

# Response (fraud detected)
# { success: true, warning: "⚠️ FRAUD DETECTED", fraudScore: "72%", riskFlags: [...], aiAnalysis: {...} }

# Response (clean)
# { success: true, message: "✅ Transaction verified", fraudScore: "12%", data: {...} }

# Get all transactions
curl "http://localhost:3001/api/transactions?limit=20&skip=0&status=flagged"

# Get flagged transactions
curl http://localhost:3001/api/transactions/flagged

# Get by hash
curl http://localhost:3001/api/transactions/0xabc123...

# Get donor history
curl http://localhost:3001/api/transactions/donor/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Fraud stats (admin)
curl http://localhost:3001/api/transactions/stats/fraud \
  -H "Authorization: Bearer <adminToken>"

# Update status (admin)
curl -X PATCH http://localhost:3001/api/transactions/<id>/status \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"blocked","notes":"Confirmed fraud"}'
```

**Fraud Score Breakdown**

| Check | Weight | Trigger |
|---|---|---|
| Invalid/missing EIN | 35% | EIN not recognized |
| Not in IRS database | 25% | Nonprofit not IRS-verified |
| High amount | 15% | Amount > 0.5 ETH |
| New wallet | 10% | No prior transaction history |
| Suspicious name pattern | 9% | Matches known fraud name patterns |
| High velocity | 6% | 3+ transactions from wallet in last hour |

Threshold: **≥ 65%** = flagged as fraudulent.

---

### Nonprofits — `/api/nonprofits`

```bash
# Search IRS database (559K+ orgs)
curl "http://localhost:3001/api/nonprofits/search?q=red+cross&limit=12&state=NY"

# Get org by EIN or ObjectId
curl http://localhost:3001/api/nonprofits/53-0196605

# IRS stats
curl http://localhost:3001/api/nonprofits/stats

# --- Registered Nonprofits (app-managed) ---

# List registered nonprofits
curl http://localhost:3001/api/nonprofits/registered

# Register a nonprofit (authenticated)
curl -X POST http://localhost:3001/api/nonprofits/registered \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"ein":"53-0196605","name":"American Red Cross","contactEmail":"info@redcross.org"}'

# Update verification status (admin)
curl -X PATCH http://localhost:3001/api/nonprofits/registered/<id>/status \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"verified","trustLevel":"trusted"}'

# Add risk flag (admin)
curl -X POST http://localhost:3001/api/nonprofits/registered/<id>/flag \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"flagType":"suspicious_pattern","reason":"Multiple fraud transactions linked to this org"}'
```

---

### Users — `/api/users` (admin only except wallet routes)

```bash
# Get all users (admin)
curl "http://localhost:3001/api/users?page=1&limit=50&status=active" \
  -H "Authorization: Bearer <adminToken>"

# Suspend/activate/ban a user (admin)
curl -X PATCH http://localhost:3001/api/users/<id>/status \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"action":"suspend","reason":"Suspicious activity"}'

# Get user details (admin)
curl http://localhost:3001/api/users/<id>/details \
  -H "Authorization: Bearer <adminToken>"

# Get/create user by wallet address (public)
curl http://localhost:3001/api/users/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Get wallet donations (public)
curl http://localhost:3001/api/users/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/donations
```

---

### Activity Logs — `/api/activity-logs` (authenticated)

```bash
# Get all logs (admin)
curl http://localhost:3001/api/activity-logs \
  -H "Authorization: Bearer <adminToken>"

# Recent 24h (any auth)
curl http://localhost:3001/api/activity-logs/recent \
  -H "Authorization: Bearer <accessToken>"

# Stats chart data (any auth)
curl "http://localhost:3001/api/activity-logs/stats?days=7" \
  -H "Authorization: Bearer <accessToken>"
```

---

## Admin Setup

```bash
# Create first admin (run once)
ADMIN_PASSWORD=SecurePass1 node scripts/seed-admin.js

# Optionally override email/username
ADMIN_EMAIL=admin@yourorg.com ADMIN_PASSWORD=SecurePass1 ADMIN_USERNAME=Admin node scripts/seed-admin.js
```

## Health Check

```bash
curl http://localhost:3001/health
```
