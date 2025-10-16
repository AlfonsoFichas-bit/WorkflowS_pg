// Type definitions for the application

// Project related types
export interface Project {
	id: number;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Sprint {
	id: number;
	projectId: number;
	name: string;
	startDate?: Date;
	endDate?: Date;
	status: "planning" | "active" | "completed" | "cancelled";
}

export interface Task {
	id: number;
	sprintId: number;
	title: string;
	description?: string;
	status: "todo" | "in-progress" | "review" | "done";
	assigneeId?: number;
	createdAt: Date;
	updatedAt: Date;
}

// User related types
export interface User {
	id: number;
	name: string;
	email: string;
	role: "admin" | "teacher" | "student";
}

export interface AuthUser {
	id: number;
	name: string;
	email: string;
	role: string;
	formattedRole: string;
}

// Team related types
export interface Team {
	id: number;
	name: string;
	projectId: number;
	members: number[]; // User IDs
}

// Add more types as needed for your application
