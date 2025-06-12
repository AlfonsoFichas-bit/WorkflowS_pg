// Sprint Status
export const PLANNED = 'PLANNED';
export const ACTIVE = 'ACTIVE';
export const COMPLETED = 'COMPLETED';
export const CANCELLED = 'CANCELLED'; // Using two Ls for consistency if other places use it.

export const SPRINT_STATUSES = [PLANNED, ACTIVE, COMPLETED, CANCELLED] as const;
export type SprintStatus = typeof SPRINT_STATUSES[number];
