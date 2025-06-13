// Task Status
export const TODO = 'todo';
export const IN_PROGRESS = 'in_progress';
export const DONE = 'done';
export const BLOCKED = 'blocked';

export const TASK_STATUSES = [TODO, IN_PROGRESS, DONE, BLOCKED] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

// Task Priority
export const LOW = 'low';
export const MEDIUM = 'medium';
export const HIGH = 'high';

export const TASK_PRIORITIES = [LOW, MEDIUM, HIGH] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];