// User Story Status
export const TODO = 'TODO';
export const IN_PROGRESS = 'IN_PROGRESS';
export const REVIEW = 'REVIEW';
export const DONE = 'DONE';

export const USER_STORY_STATUSES = [TODO, IN_PROGRESS, REVIEW, DONE] as const;
export type UserStoryStatus = typeof USER_STORY_STATUSES[number];

// User Story Priority
export const LOWEST = 'LOWEST';
export const LOW = 'LOW';
export const MEDIUM = 'MEDIUM';
export const HIGH = 'HIGH';
export const HIGHEST = 'HIGHEST';

export const USER_STORY_PRIORITIES = [LOWEST, LOW, MEDIUM, HIGH, HIGHEST] as const;
export type UserStoryPriority = typeof USER_STORY_PRIORITIES[number];
