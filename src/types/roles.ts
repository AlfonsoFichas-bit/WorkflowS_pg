export const PROJECT_OWNER = 'PROJECT_OWNER';
export const SCRUM_MASTER = 'SCRUM_MASTER';
export const DEVELOPER = 'DEVELOPER';

export const PROJECT_ROLES = [PROJECT_OWNER, SCRUM_MASTER, DEVELOPER] as const;

export type ProjectRole = typeof PROJECT_ROLES[number];
