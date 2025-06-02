# 🎮 DisGames - Interactive Discord Gaming Bot

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/beKZbQ9vxe)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

> **🌟 Trusted by 1000+ Discord servers** - A dynamic Discord bot designed to bring fun, interactive games directly into your Discord community, enhancing engagement and providing endless entertainment.

## ✨ Features

### 🎯 Interactive Games
- **🔢 Number Guessing** - Challenge your intuition with number prediction games
- **🔤 Anagram Solver** - Test your word skills with scrambled letter puzzles  
- **📊 Counting Game** - Community-based counting challenges

### 🛠️ Advanced Bot Features
- **⚡ Slash Commands** - Modern Discord interaction system
- **🔧 Server Management** - Admin controls for game setup and configuration
- **🌐 Multi-language Support** - Internationalization (i18n) system
- **📊 Database Integration** - Persistent game data and user statistics
- **🎛️ Interactive Components** - Select menus, buttons, and rich embeds
- **⚙️ Event-Driven Architecture** - Robust message and interaction handling

## 🏗️ Architecture

DisGames follows **clean architecture principles** with a well-structured TypeScript codebase:

```
src/
├── commands/         # Slash command implementations
├── events/           # Discord event handlers
├── services/         # Business logic layer
│   └── games/        # Individual game implementations
├── repositories/     # Data access layer
├── interfaces/       # Type definitions and contracts
└── utils/            # Helper functions and utilities
```

### 🔧 Key Technologies

- **TypeScript** - Type-safe development with modern ES features
- **Discord.js v14** - Latest Discord API wrapper with full feature support
- **MySQL** - Robust database ORM with type safety
- **Event-Driven Design** - Scalable architecture for handling Discord interactions
- **Dependency Injection** - Clean separation of concerns

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL Database
- Discord Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/disgames.git
   cd disgames
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your Discord bot token and database credentials
   ```

4. **Database Setup**
   ```bash
   npm run schema:up
   ```

5. **Deploy Commands**
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

## 🎮 Usage

### Setting Up Games

1. Use `/games setup` in your Discord server
2. Select the game type from the interactive menu
3. Configure game settings for your channel
4. Players can start participating immediately!

### Available Commands

- `/games setup` - Configure games for your server
- `/games manage` - Admin panel for game management  
- `/games help` - Display help information

## 🏆 Key Highlights

- **🔥 Production Ready** - Currently serving 1000+ Discord servers
- **📈 Scalable Architecture** - Clean code structure built for growth
- **🛡️ Type Safety** - Full TypeScript implementation with strict typing
- **⚡ Performance Optimized** - Efficient database queries and caching
- **🌍 International** - Multi-language support system
- **🔧 Maintainable** - Well-documented code with clear separation of concerns

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **Discord Support Server**: [Join Here](https://discord.gg/beKZbQ9vxe)
- **Issues**: [GitHub Issues](https://github.com/MisterMiel/DisGames/issues)

---

<p align="center">
  <strong>⭐ If you find this project useful, please consider giving it a star!</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/MisterMiel">Your Name</a>
</p>