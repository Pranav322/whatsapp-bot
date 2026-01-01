# WhatsApp Reminder Bot 🤖

A WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) that can send you reminders.

## Features

- **Set Reminders**: Use `/new <time> <message>` to set a reminder
- **Flexible Time Formats**: Supports seconds, minutes, hours, and combinations
- **Instant Confirmation**: Get confirmation when a reminder is set
- **Push Notifications**: Receive reminder messages directly on WhatsApp

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the bot
npm start
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev
```

## Usage

Send a message to your WhatsApp (the one connected to the bot) with the following format:

```
/new <time> <message>
```

### Time Formats

| Format | Description |
|--------|-------------|
| `5s` | 5 seconds |
| `5m` | 5 minutes |
| `1h` | 1 hour |
| `1h30m` | 1 hour 30 minutes |
| `2h15m30s` | 2 hours 15 minutes 30 seconds |

### Examples

```
/new 5m Take a break
/new 1h30m Team meeting
/new 2h Check emails
```

## First Time Setup

1. Run the bot using `npm start` or `npm run dev`
2. A QR code will appear in the terminal
3. Open WhatsApp on your phone
4. Go to **Settings** > **Linked Devices** > **Link a Device**
5. Scan the QR code
6. You're connected! The bot will now listen for messages

## Project Structure

```
src/
├── index.ts                 # Main entry point
├── handlers/
│   └── messageHandler.ts    # Handles incoming messages
├── services/
│   └── reminderService.ts   # Manages reminders
└── utils/
    └── timeParser.ts        # Parses time strings
```

## Notes

- The `auth_info/` folder contains your WhatsApp credentials. Keep it secure!
- The bot uses in-memory storage for reminders. They will be lost if the bot restarts.
- Maximum reminder duration is 24 hours.

## License

MIT
