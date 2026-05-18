# Space Arena

Multiplayer browser arena shooter built with React, TypeScript, Socket.IO, and Canvas API.

Space Arena focuses on realtime multiplayer synchronization, server-authoritative gameplay, and modular game architecture, built entirely from scratch without a game engine.

---

## Preview

![Gameplay](./assets/gameplay.gif)

---

## Live Demo

🎮 Play Online: [Space Arena](https://space-arena.vercel.app/)

---

## Features

- Realtime multiplayer arena combat
- Server-authoritative gameplay architecture
- Projectile and missile combat systems
- Upgrade progression and stat scaling
- Minimap and kill feed systems
- Modular gameplay and rendering pipelines
- Shared client/server game contracts
- Canvas-based rendering system
- Entity interpolation and synchronization systems
- Workspace-based monorepo architecture

---

## Architecture Highlights

- Server-authoritative multiplayer architecture
- Shared game contracts between client and server
- Modular gameplay and rendering systems
- Realtime synchronization using Socket.IO
- Canvas-based rendering without a game engine
- Workspace-based monorepo structure
- Event-driven game systems and networking

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Canvas API
- TailwindCSS
- Socket.IO Client

### Backend
- Node.js
- Socket.IO
- Express
- TypeScript

### Architecture
- npm workspaces
- Shared package architecture
- Modular rendering systems
- Modular gameplay systems

---

## Engineering Notes

Building realtime multiplayer systems in the browser introduced several networking and synchronization challenges throughout development, including latency handling, websocket bandwidth optimization, interpolation smoothing, and server-authoritative state management.

The current implementation prioritizes synchronized gameplay consistency and modular architecture over aggressive client-side prediction techniques. Future iterations may further explore reconciliation, snapshot buffering, and advanced netcode optimizations.

---

## Technical Challenges

Some of the core challenges during development included:

- Maintaining synchronized multiplayer state across clients
- Managing websocket bandwidth and update frequency
- Handling realtime projectile and missile systems
- Preventing gameplay desynchronization between client and server
- Designing modular gameplay and rendering pipelines
- Optimizing rendering performance for large numbers of entities
- Balancing responsiveness with server-authoritative consistency

---

## Project Structure

```txt
client/   -> frontend game client
server/   -> multiplayer game server
shared/   -> shared configs and types
```

---

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/port-iamniraj/Shooter.io.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Shared Package Build

```bash
cd shared
npm run build
```

### 4. Start Backend

```bash
cd server
npm run dev
```

### 5. Start Frontend

```bash
cd client
npm run dev
```

---

## Contributing

Contributions, ideas, and improvements are welcome.

Some areas currently open for exploration and improvement:

- Sound design and audio feedback
- UI and gameplay polish
- Mobile and touch controls
- Rendering and networking optimization
- Visual effects and combat feedback
- Gameplay balancing and progression
- Netcode and synchronization improvements
- General bug fixes and system cleanup

If you're interested in realtime multiplayer architecture, browser game development, or networking systems, feel free to explore the project and contribute.

---

## Roadmap

Planned areas for future development include:

- Improved combat feedback and sound system
- Mobile and touch device support
- Additional weapons and gameplay mechanics
- Expanded visual effects and UI polish
- Matchmaking and session management
- Leaderboards and persistent progression
- Advanced netcode optimization and prediction systems
- Additional game modes and arena variations

---

## License

MIT
