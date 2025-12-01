# Word Clash Backend

Node.js server with Express and Socket.io for real-time multiplayer word game.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `HOST` | `0.0.0.0` | Server host (use `0.0.0.0` for network access) |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |
| `LETTER_TIME_OPTIONS` | `3,5,7,10,15` | Available letter time options (seconds) |
| `DEFAULT_LETTER_TIME` | `5` | Default letter time |
| `WORD_TIME_OPTIONS` | `15,20,30,45,60,90,120` | Available word time options (seconds) |
| `DEFAULT_WORD_TIME` | `30` | Default word time |
| `ROUNDS_OPTIONS` | `3,5,7,10` | Available rounds to win options |
| `DEFAULT_ROUNDS` | `5` | Default rounds to win |

**Examples:**

```bash
# CORS - Allow all origins (local network play)
ALLOWED_ORIGINS=*

# CORS - Allow specific origins (production)
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000

# Game Config - Customize timer options
LETTER_TIME_OPTIONS=5,10,15,20
DEFAULT_LETTER_TIME=10
WORD_TIME_OPTIONS=30,60,120
DEFAULT_WORD_TIME=60

# Game Config - Customize rounds options
ROUNDS_OPTIONS=5,7,10,15
DEFAULT_ROUNDS=7
```

## Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on http://localhost:3001 (or your configured PORT)

## API Endpoints

### GET /api/config

Returns the current game configuration.

**Response:**
```json
{
  "letterTimeOptions": [3, 5, 7, 10, 15],
  "defaultLetterTime": 5,
  "wordTimeOptions": [15, 20, 30, 45, 60, 90, 120],
  "defaultWordTime": 30,
  "roundsOptions": [3, 5, 7, 10],
  "defaultRounds": 5
}
```

This endpoint is also automatically sent to clients via Socket.io on connection as the `game-config` event.
