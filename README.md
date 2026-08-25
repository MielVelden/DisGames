![DisGames Header](images/header.png)
# DisGames - Interactive Discord Gaming Bot

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/beKZbQ9vxe)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

A Discord bot featuring word puzzles, logic games, and community challenges, built with TypeScript and Discord.js.

## Features

### Game Variety
Eight game types with interactive components, real-time scoring, and multi-language support:
- Word games with scrambled puzzles and word chains
- Logic challenges including pattern recognition, number guessing, and flag/country identification
- Trivia and connections-style community games
- Progressive difficulty and customizable settings per server

### Platform Features
- **Modern Discord Integration** - Slash commands, buttons, select menus, and rich embeds
- **Multi-language Support** - Full i18n system with server-specific language settings
- **Statistics & Leaderboards** - Track player progress and competition, including live-updating leaderboards
- **Dynamic Image Generation** - Canvas-based cards for profiles, badges, and leaderboards
- **Premium Features** - Optional premium tier with custom emoji support and additional customization
- **Flexible Configuration** - Per-channel game setup with customizable rules
- **REST API & WebSocket** - Dashboard integration and real-time updates
- **Job Scheduling** - Automated maintenance tasks, metrics collection, and cleanup
- **Auto-generated TypeScript Types** - Automatic generation of TypeScript definitions and an API wrapper for all endpoints

## Architecture

DisGames follows **Domain-Driven Design** and **clean architecture principles** with clear separation of concerns:

```
src/
├── commands/            # Command definitions
├── events/              # Event handlers (messages, interactions)
├── buttons/             # Persistent (long-lived) button handlers
├── builders/            # UI component builders
│   ├── buttons/         # Button components
│   ├── cards/           # Canvas-based image cards (profile, badge, leaderboard)
│   ├── containers/      # Message container builders
│   ├── embeds/          # Rich embed builders
│   ├── modals/          # Modal builders
│   └── selectmenus/     # Select menu components
├── services/
│   ├── application/     # Application layer (Components, Media, Charts, WebSocket, Jobs)
│   ├── domain/          # Domain layer (Game, User, Server, Points, Badges business logic)
│   ├── discord/         # Discord integration layer (Events, Handlers, Mappers)
│   ├── games/           # Game implementations (Anagram, Connections, Counting, etc.)
│   └── events/          # Domain event definitions
├── repositories/        # Data access layer with BaseRepository pattern
├── db/                  # Stored procedures/routines synced to the database
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
    ├── routines/        # Database routine/procedure sync
    └── i18n/            # Internationalization system
```

### Key Technologies

- **TypeScript 5.3+** - Strict type safety, compiled to ES2022
- **Discord.js v14** - Full-featured Discord API integration
- **MySQL2** - Efficient database operations with connection pooling
- **Express 5** - REST API for dashboard integration
- **WebSocket (ws)** - Real-time communication for live updates
- **Canvas** - Dynamic image generation for game visuals
- **node-schedule** - Cron-based job scheduling
- **Zod** - Schema validation and type-safe configuration
- **reflect-metadata** - Metadata reflection for advanced TypeScript patterns
- **Custom Test Framework** - Unit, integration, and performance testing

## Getting Started

See [INSTALL.md](INSTALL.md) for setup instructions, including a Docker
option that bundles the app and database into a single container.

## Usage

Configure games through slash commands in your Discord server:

- `/games` - Browse and set up available games
- `/profile` - View personal statistics and achievements
- `/leaderboard` - View server leaderboards
- `/settings` - Configure server-specific game and language settings
- `/premium` - Manage premium features
- `/debug` - Admin utilities for debugging (requires permissions)

Games automatically respond to messages in configured channels with real-time validation and scoring.

## Key Highlights

- **Domain-Driven Design** - Clear separation between application, domain, and infrastructure layers
- **Type Safety** - Strict TypeScript with comprehensive interface definitions and auto-generated API types
- **Performance** - Connection pooling, efficient queries, and optimized image generation
- **Multi-Language** - Complete i18n system with server-specific language preferences
- **Tested** - Custom test framework with unit, integration, and performance tests
- **API Ready** - REST endpoints with auto-generated TypeScript wrappers and WebSocket support
- **Maintainable** - Repository pattern, dependency injection, and clean architecture
- **Secure** - API key authentication, OAuth-based dashboard identity, and request context isolation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Contact

- **Discord Support Server**: [Join Here](https://discord.gg/beKZbQ9vxe)
- **Issues**: [GitHub Issues](https://github.com/MielVelden/DisGames/issues)

---

<p align="center">
  <strong>If you find this project useful, please consider giving it a star.</strong>
</p>

<p align="center">
  Made by <a href="https://github.com/MielVelden">Miel</a>
</p>