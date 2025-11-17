# 🎮 DisGames - Interactive Discord Gaming Bot

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/beKZbQ9vxe)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

> **🌟 Trusted by 1250+ Discord servers** - A dynamic Discord bot featuring engaging word puzzles, logic games, and community challenges that enhance server interaction and provide endless entertainment.

## ✨ Features

### 🎮 Game Variety
Six unique game types with interactive components, real-time scoring, and multi-language support:
- Word games with scrambled puzzles and word chains
- Logic challenges including pattern recognition and flag identification
- Community-driven games with collaborative gameplay
- Progressive difficulty and customizable settings per server

### 🛠️ Platform Features
- **⚡ Modern Discord Integration** - Slash commands, buttons, select menus, and rich embeds
- **🌐 Multi-language Support** - Full i18n system with server-specific language settings
- **📊 Statistics & Leaderboards** - Track player progress and competition
- **🎨 Dynamic Image Generation** - Canvas-based visuals for enhanced gameplay
- **🔧 Flexible Configuration** - Per-channel game setup with customizable rules
- **📡 REST API & WebSocket** - Dashboard integration and real-time updates
- **⏰ Job Scheduling** - Automated maintenance tasks and cleanup
- **📝 Auto-generated TypeScript Types** - Automatic generation of TypeScript definitions and API wrapper for all endpoints

## 🏗️ Architecture

DisGames follows **Domain-Driven Design** and **clean architecture principles** with clear separation of concerns:

```
src/
├── commands/            # Command definitions
├── events/              # Event handlers (messages, interactions)
├── builders/            # UI component builders
│   ├── buttons/         # Button components
│   ├── containers/      # Message container builders
│   ├── embeds/          # Rich embed builders
│   └── selectmenus/     # Select menu components
├── services/
│   ├── application/     # Application layer (Components, Media, WebSocket, Jobs)
│   ├── domain/          # Domain layer (Game, User, Server, Points business logic)
│   ├── discord/         # Discord integration layer (Events, Handlers, Mappers)
│   ├── games/           # Game implementations (Anagram, Connections, Counting, etc.)
│   └── image/           # Image generation services
├── repositories/        # Data access layer with BaseRepository pattern
├── controllers/         # API controllers (Dashboard, Timeline, User, TypeGenerator)
├── middleware/          # Express middleware (API keys, request context)
├── jobs/                # Scheduled background tasks
├── interfaces/          # TypeScript types (application, domain, database, enums, view)
└── utils/               # Utilities and helpers
    ├── api/             # API type generation and exceptions
    ├── application/     # Application utilities (Config, Error, Logger)
    ├── collectors/      # Automatic discovery (Commands, Endpoints, Interfaces)
    ├── constants/       # Constants (Colors, Emojis)
    ├── database/        # Database utilities and validators
    ├── handlers/        # Event and command handlers
    ├── helpers/         # Helper functions (Duration, Embed, Enum, etc.)
    └── i18n/            # Internationalization system
```

### 🔧 Key Technologies

- **TypeScript 5.3+** - Strict type safety with modern ES features
- **Discord.js v14** - Full-featured Discord API integration
- **MySQL2** - Efficient database operations with connection pooling
- **Express 5** - REST API for dashboard integration
- **WebSocket (ws)** - Real-time communication for live updates
- **Canvas** - Dynamic image generation for game visuals
- **node-schedule** - Cron-based job scheduling
- **Zod** - Schema validation and type-safe configuration
- **reflect-metadata** - Metadata reflection for advanced TypeScript patterns
- **Custom Test Framework** - Unit, integration, and performance testing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Discord Bot Token with required permissions

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

### Running Jobs
For scheduled maintenance tasks:
```bash
npm run job
```

### Testing
```bash
npm run test
```

## 🎮 Usage

Configure games through slash commands in your Discord server:

- `/games` - Browse and setup available games
- `/profile` - View personal statistics and achievements
- `/debug` - Admin utilities for debugging (requires permissions)

Games automatically respond to messages in configured channels with real-time validation and scoring.

## 🏆 Key Highlights

- **🔥 Battle-Tested** - Currently serving 1000+ Discord servers in production
- **🏗️ Domain-Driven Design** - Clear separation between application, domain, and infrastructure layers
- **🛡️ Type Safety** - Strict TypeScript with comprehensive interface definitions and auto-generated API types
- **⚡ Performance** - Connection pooling, efficient queries, and optimized image generation
- **🌍 Multi-Language** - Complete i18n system with server-specific language preferences
- **🧪 Well-Tested** - Custom test framework with unit, integration, and performance tests
- **📡 API Ready** - REST endpoints with auto-generated TypeScript wrappers and WebSocket support
- **🔧 Maintainable** - Repository pattern, dependency injection, and clean architecture
- **🔐 Secure** - API key authentication, OAuth support, and request context isolation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **Discord Support Server**: [Join Here](https://discord.gg/beKZbQ9vxe)
- **Issues**: [GitHub Issues](https://github.com/MielVelden/DisGames/issues)

---

<p align="center">
  <strong>⭐ If you find this project useful, please consider giving it a star!</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/MielVelden">Miel</a>
</p>