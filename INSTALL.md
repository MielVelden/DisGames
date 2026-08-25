# Installation

## Option A: Docker (recommended)

The `Dockerfile` bundles the app and a MySQL server into a single image, so
there's nothing else to provision — no separate database service, no port
mappings to configure.

1. **Clone the repository**
   ```bash
   git clone https://github.com/MielVelden/DisGames.git
   cd DisGames
   ```

2. **Environment Setup**
   ```bash
   cp .example.env .env
   # Add your Discord bot token
   # Leave DATABASE_URL pointing at 127.0.0.1 to use the bundled MySQL server
   ```

3. **Build and run**
   ```bash
   docker compose up -d --build
   ```

   On first boot the container initializes MySQL, creates the database/user
   from `DATABASE_URL`, deploys Discord commands, and starts the bot.
   Database files persist in the `mysql_data` volume across restarts.

   To use an existing/external MySQL server instead, point `DATABASE_URL` at
   its host — the bundled server is then skipped automatically.

### Running a pre-built image (e.g. with Watchtower)

CI ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) builds and
pushes an image to `ghcr.io/mielvelden/disgames` on every push. Use
`docker-compose.prod.yml` instead of building locally:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Point a tool like [Watchtower](https://containrrr.dev/watchtower/) at the
resulting container to auto-pull and restart it whenever CI publishes a new
image.

## Option B: Local Node.js

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- A Discord bot application with a bot token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MielVelden/DisGames.git
   cd DisGames
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .example.env .env
   # Add your Discord bot token and database credentials
   ```

4. **Database Setup**
   ```bash
   npm run db:down
   ```

5. **Deploy Commands to Discord**
   ```bash
   npm run deploy
   ```

6. **Start the Bot**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## Running Jobs
For scheduled maintenance tasks:
```bash
npm run job
```

## Testing
```bash
npm run test
```
