# Services Directory

This directory contains service classes that implement application business logic.

Services coordinate the work of multiple models and provide a higher-level API for the application routes.

## Structure

- Each service should focus on a specific domain area
- Services should use models to perform business logic
- Services should not contain UI or presentation logic

## Example Services for Workflow Platform

- `ProjectService.ts` - Project management operations
- `SprintService.ts` - Sprint planning and management
- `TaskService.ts` - Task tracking and management
- `UserService.ts` - User management and authentication
- `ReportService.ts` - Report generation for teachers/administrators
- `MetricsService.ts` - Calculating and providing project metrics