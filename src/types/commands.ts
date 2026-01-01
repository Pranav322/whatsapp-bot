import { WASocket, proto } from 'baileys';

export interface CommandContext {
    socket: WASocket;
    message: proto.IWebMessageInfo;
    chat: string;
    sender: string;
    args: string[];
    isGroup: boolean;
}

export interface CommandHandler {
    name: string;
    description: string;
    usage: string;
    examples: string[];
    execute: (context: CommandContext) => Promise<void>;
}

export interface ParsedCommand {
    command: string;
    args: string[];
    mentions: string[];
    isGroupCommand: boolean;
} 
