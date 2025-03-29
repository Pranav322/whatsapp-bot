# WhatsApp Bot - Software Requirements Specification (SRS)

## 1. Introduction
A WhatsApp bot built using Baileys that manages personal tasks, reminders, and notes with support for both private and group chats.

## 2. User Data Model
### 2.1 Per-User Storage
- Each user has their own private:
  - Todo list
  - Notes collection
  - Reminders list
  - Active timers
  - Settings preferences

### 2.2 Group Storage
- Group-specific settings
- Shared announcements
- Command access permissions

## 3. Feature Specifications

### 3.1 Reminder System
#### Private Chat Commands
```
!notify <task> <time>              # Personal reminder
!notify list                       # List your reminders
!notify delete <id>                # Delete a reminder
```

#### Group Chat Commands
```
!notify @me <task> <time>          # Personal reminder
!notify @all <task> <time>         # Group-wide reminder
!notify @user1 @user2 <task> <time># Notify specific users
```

### 3.2 Todo List System
#### Commands (Work in both private & groups)
```
!todo add <task>                   # Add personal todo
!todo list                         # View your todos
!todo done <id>                    # Mark as complete
!todo delete <id>                  # Delete todo
!todo clear                        # Clear completed
```

### 3.3 Notes System
#### Commands (Work in both private & groups)
```
!note save <text>                  # Save personal note
!note list                         # View your notes
!note view <id>                    # View specific note
!note delete <id>                  # Delete note
!note search <keyword>             # Search your notes
```

### 3.4 Timer System
#### Commands (Work in both private & groups)
```
!timer <minutes>                   # Start personal timer
!timer list                        # View your active timers
!timer cancel <id>                 # Cancel timer
```

## 4. Technical Architecture

### 4.1 Database Schema
```typescript
// User Data
interface User {
  phoneNumber: string;
  settings: UserSettings;
  todos: Todo[];
  notes: Note[];
  reminders: Reminder[];
  activeTimers: Timer[];
}

// Group Data
interface Group {
  groupId: string;
  settings: GroupSettings;
  allowedCommands: string[];
  adminUsers: string[];
}

// Reminder
interface Reminder {
  id: string;
  userId: string;
  task: string;
  time: Date;
  notifyUsers: string[];  // For @all or @user mentions
  groupId?: string;      // If created in a group
}
```

### 4.2 Core Components
1. Message Handler
   - Command parser
   - User/Group context detector
   - Mention parser (@me, @all, @user)

2. Data Manager
   - User data CRUD
   - Group data CRUD
   - Data persistence

3. Timer Service
   - Reminder scheduling
   - Timer management
   - Notification dispatcher

4. Security Manager
   - Command access control
   - Rate limiting
   - User verification

## 5. Implementation Phases

### Phase 1: Core Setup
- Project structure
- Database setup
- Basic bot connection
- Command parser

### Phase 2: Basic Features
- Personal reminders
- Todo list
- Notes system

### Phase 3: Group Features
- Group context detection
- @me, @all functionality
- User mentions

### Phase 4: Advanced Features
- Multiple timer support
- Search functionality
- Settings and customization

## 6. Non-Functional Requirements

### 6.1 Performance
- Response time < 2 seconds
- Support for 100+ concurrent users
- Handle 1000+ reminders

### 6.2 Security
- Input sanitization
- Command rate limiting
- User data isolation

### 6.3 Reliability
- Data backup system
- Error logging
- Crash recovery

## 7. Dependencies
- Node.js
- @whiskeysockets/baileys
- MongoDB/SQLite
- node-cron
- moment.js 