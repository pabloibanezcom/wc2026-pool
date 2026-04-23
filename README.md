# WC2026 Predict

A mobile-first app for predicting FIFA World Cup 2026 match results. Compete in private leagues with friends and track your accuracy across the tournament.

## Features

- **Match predictions** — submit score predictions before kickoff; locked server-side once the match starts
- **Points system** — earn points for exact scores, correct goal differences, or correct winners, with stage multipliers
- **Private leagues** — create leagues, invite friends with a 6-character code, and track a live leaderboard
- **Google auth** — sign in with Google; dev login available for local testing

## Points System

| Result | Points |
|---|---|
| Exact score | 10 |
| Correct goal difference + winner | 6 |
| Correct draw (wrong score) | 5 |
| Correct winner only | 4 |
| Wrong | 0 |

Stage multipliers: Group ×1 · R32 ×1.5 · R16 ×2 · QF ×2.5 · SF ×3 · Final ×4

## Tech Stack

| | |
|---|---|
| **App** | Expo (SDK 52), React Navigation, Zustand, TypeScript |
| **API** | Node.js, Express, Mongoose, Zod, JWT |
| **Database** | MongoDB Atlas |
| **Auth** | Google OAuth via `expo-auth-session` |
| **Match data** | football-data.org API |

## Project Structure

```
app/          # Expo React Native app (targets iOS, Android, PWA)
api/          # Node.js REST API
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Google OAuth client ID
- football-data.org API key

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
FOOTBALL_DATA_API_KEY=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
```

3. Seed match data:

```bash
cd api && npm run seed
```

### Running

From the repo root:

```bash
npm run dev       # API + app concurrently
npm run api       # API only (http://localhost:3000)
npm run app       # Expo app only
```

Or individually:

```bash
# API
cd api && npm run dev

# App
cd app && npx expo start
```

## API

See [`api/wc2026.postman_collection.json`](api/wc2026.postman_collection.json) for a Postman collection with all endpoints. Hit **Dev Login** first — it auto-saves the token for all subsequent requests.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/google` | Exchange Google ID token for app JWT |
| POST | `/auth/dev` | Dev login (non-production only) |
| GET | `/auth/me` | Current user profile |
| GET | `/matches` | List matches (filter by stage, group, status) |
| GET | `/matches/:id` | Match detail with user's prediction |
| POST | `/predictions` | Create or update a prediction |
| GET | `/predictions/mine` | User's predictions |
| GET | `/predictions/match/:matchId` | Predictions for a match (post-kickoff) |
| POST | `/leagues` | Create a league |
| POST | `/leagues/join` | Join a league by invite code |
| GET | `/leagues` | User's leagues |
| GET | `/leagues/:id` | League detail with leaderboard |
| DELETE | `/leagues/:id/leave` | Leave a league |
