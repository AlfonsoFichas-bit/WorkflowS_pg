// Sprint Status
export const PLANNED = 'PLANNED';
export const ACTIVE = 'ACTIVE';
export const COMPLETED = 'COMPLETED';
export const CANCELLED = 'CANCELLED'; // Using two Ls for consistency if other places use it.

export const SPRINT_STATUSES = [PLANNED, ACTIVE, COMPLETED, CANCELLED] as const;
export type SprintStatus = typeof SPRINT_STATUSES[number];

// Sprint type definition
export interface Sprint {
    id: number;
    name: string;
    projectId: number;
    startDate: Date | null;
    endDate: Date | null;
    status: SprintStatus;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    sprintName?: string | null; // For join operations
}
