import { CommandHandler } from '../../types/commands.js';
import { NotifyHandler } from './NotifyHandler.js';
import { TodoHandler } from './TodoHandler.js';
import { NoteHandler } from './NoteHandler.js';
import { TimerHandler } from './TimerHandler.js';
import { HelpHandler } from './HelpHandler.js';
import { GroupHandler } from './GroupHandler.js';
import { StickerHandler } from './StickerHandler.js';

export { NotifyHandler } from './NotifyHandler.js';
export { TodoHandler } from './TodoHandler.js';
export { NoteHandler } from './NoteHandler.js';
export { TimerHandler } from './TimerHandler.js';
export { HelpHandler } from './HelpHandler.js';
export { GroupHandler } from './GroupHandler.js';
export { StickerHandler } from './StickerHandler.js';

// Map of command names to their handlers
export const commandHandlers: Map<string, CommandHandler> = new Map([
    ['notify', NotifyHandler],
    ['todo', TodoHandler],
    ['note', NoteHandler],
    ['timer', TimerHandler],
    ['help', HelpHandler],
    ['group', GroupHandler],
    ['sticker', StickerHandler]
]); 
