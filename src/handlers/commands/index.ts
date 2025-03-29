export { NotifyHandler } from './NotifyHandler';
export { TodoHandler } from './TodoHandler';
export { NoteHandler } from './NoteHandler';
export { TimerHandler } from './TimerHandler';
export { HelpHandler } from './HelpHandler';
export { GroupHandler } from './GroupHandler';

import { CommandHandler } from '../../types/commands';
import { NotifyHandler } from './NotifyHandler';
import { TodoHandler } from './TodoHandler';
import { NoteHandler } from './NoteHandler';
import { TimerHandler } from './TimerHandler';
import { HelpHandler } from './HelpHandler';
import { GroupHandler } from './GroupHandler';

// Map of command names to their handlers
export const commandHandlers: Map<string, CommandHandler> = new Map([
    ['notify', NotifyHandler],
    ['todo', TodoHandler],
    ['note', NoteHandler],
    ['timer', TimerHandler],
    ['help', HelpHandler],
    ['group', GroupHandler]
]); 