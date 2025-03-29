export interface UserSettings {
    notificationsEnabled: boolean;
    preferredLanguage: string;
}

export interface GroupSettings {
    allowedCommands: string[];
    notificationsEnabled: boolean;
}

export interface Todo {
    id: string;
    task: string;
    completed: boolean;
    createdAt: Date;
    completedAt?: Date;
}

export interface Note {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Timer {
    id: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
}

export interface Reminder {
    id: string;
    userId: string;
    task: string;
    time: Date;
    notifyUsers: string[];
    groupId?: string;
    isCompleted: boolean;
} 