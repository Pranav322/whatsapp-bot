# WhatsApp Assistant Bot 🤖

A lean, personal WhatsApp assistant built with [Baileys](https://github.com/WhiskeySockets/Baileys), PostgreSQL, and Drizzle ORM. Designed for private use to manage reminders, tasks, and utilities directly through WhatsApp DMs.

## 🚀 Features

- **Personal Reminders**: Set time-based notifications for yourself.
- **Task Management**: Keep a persistent todo list.
- **Notes**: Save and search through text snippets.
- **Sticker Maker**: Convert images, GIFs, and videos to stickers instantly.
- **Timers**: Set countdowns for quick alerts.
- **Persistence**: Powered by PostgreSQL to ensure your data survives restarts.

## 🛠️ Tech Stack

- **Runtime**: Node.js (ESM)
- **WhatsApp**: Baileys (WhiskeySockets)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Utilities**: Sharp (Image processing), Node-cron (Scheduling), Express (Health check/server)

## 📋 Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!notify` | `!notify <task> <time>` | Set a reminder (e.g., `!notify call mom 30m`) |
| `!todo` | `!todo <add/list/done/delete/clear>` | Manage your persistent todo list |
| `!note` | `!note <save/list/view/delete/search>` | Manage your personal snippets |
| `!sticker` | `!sticker [f/full]` | Convert media to sticker (reply or caption) |
| `!timer` | `!timer <start/list/cancel>` | Set countdown timers |
| `!help` | `!help [command]` | Show usage instructions |

## ⚙️ Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL=postgres://user:pass@host:port/db
   PORT=3000
   ```
4. Build the project:
   ```bash
   npm run build
   ```

### Running
- **Development**: `npm run dev`
- **Production**: `npm start`

On first run, scan the QR code in your terminal using WhatsApp's **Linked Devices** feature.

## 🔒 Security & Privacy
- This bot is designed for **Direct Messages (DMs) only**.
- It explicitly ignores group messages to ensure privacy and focus.
- Authentication data is stored locally in `auth_info/`. **Never share this folder.**

## 📄 License
MIT
