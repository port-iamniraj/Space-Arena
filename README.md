# Space Arena

Real-time multiplayer browser arena shooter built with React, TypeScript, Socket.IO, and server-authoritative multiplayer architecture.

![Gameplay](./assets/gameplay.mp4)

---

## Features

- Real-time multiplayer combat
- Server-authoritative gameplay
- Missile system
- Upgrade progression
- Kill feed
- Minimap
- Shared workspace architecture
- Smooth interpolation rendering
- Modular game systems

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

Contributions are welcome.

Some areas open for improvement:
- Sound effects
- UI polish
- Mobile controls
- Performance optimization
- Visual effects
- Bug fixes
- Gameplay improvements

---

## Roadmap

- Sound system
- Mobile support
- More game modes
- Better VFX
- Matchmaking
- Account system
- Leaderboard improvements

---

## License

MIT
