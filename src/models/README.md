# Models Directory

This directory contains the business logic models for the application.

Models represent the core domain entities and their behavior. They should be independent of the database implementation details and focus on the business rules.

## Structure

- Each model should be in its own file
- Models should not directly depend on database implementation
- Models should expose interfaces that services can use

## Example Models for Workflow Platform

- `Project.ts` - Project entity and operations
- `Sprint.ts` - Sprint entity and operations
- `Task.ts` - Task entity and operations
- `User.ts` - User entity and operations
- `Team.ts` - Team entity and operations