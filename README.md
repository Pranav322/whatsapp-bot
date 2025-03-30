# WhatsApp Bot Assistant

A feature-rich WhatsApp bot built with Node.js that helps manage todos, reminders, timers, and group chats. The bot uses the WhatsApp Web API through the `@whiskeysockets/baileys` library.

## Features

### Todo Management
- Create and manage todo lists
- Mark items as complete
- List all pending todos
- Remove completed todos

### Timer System
- Set countdown timers
- Get notifications when timers complete
- Multiple concurrent timers support
- Cancel active timers

### Notification System
- Set reminders with custom messages
- Get notified at specified times
- Manage multiple reminders

### Group Chat Features
- Group settings management
- Admin controls (add/remove admins)
- User management (ban/unban users)
- Mention controls
- Group-wide notifications

## Available Commands

### Todo Commands
- `!todo add <item>` - Add a new todo item
- `!todo list` - List all pending todos
- `!todo done <number>` - Mark a todo as complete
- `!todo clear` - Remove all completed todos

### Timer Commands
- `!timer start <duration>` - Start a countdown timer
- `!timer list` - List all active timers
- `!timer cancel <id>` - Cancel a specific timer

### Notification Commands
- `!notify add <time> <message>` - Set a reminder
- `!notify list` - List all pending reminders
- `!notify remove <id>` - Remove a specific reminder

### Group Commands
- `!group settings` - View/modify group settings
- `!group admin add/remove <@user>` - Manage admins
- `!group ban/unban <@user>` - Manage banned users
- `!group mentions` - Configure mention settings

### Help Command
- `!help` - Display available commands and usage

## Technical Details

### Built With
- Node.js
- TypeScript
- MongoDB (for data persistence)
- @whiskeysockets/baileys (WhatsApp Web API)
- Mongoose (MongoDB ODM)

### Prerequisites
- Node.js 14+
- MongoDB database
- WhatsApp account for the bot

### Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
```

### Installation

1. Clone the repository
```bash
git clone <repository-url>
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

4. Start the bot
```bash
npm start
```

5. Scan the QR code with WhatsApp to authenticate

### Deployment

The bot can be deployed to Heroku:

1. Create a new Heroku app
2. Set the MongoDB URI in config vars
3. Deploy using Git
4. Scale the worker dyno:
```bash
heroku ps:scale worker=1 web=0
```

## License

This project is licensed under the MIT License - see the LICENSE file for details 