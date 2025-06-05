# WorkflowS Platform

A workflow management platform for academic projects using Scrum methodology. This platform allows teachers to track student progress and students to manage their projects using agile methodologies.

## Technology Stack

- **Runtime**: [Deno](https://deno.land/)
- **Web Framework**: [Fresh](https://fresh.deno.dev/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **UI**: Tailwind CSS

## Project Structure

```
WorkflowS_pg/
├── components/       # Reusable UI components
├── islands/          # Interactive components (client-side)
├── routes/           # Application routes and API endpoints
│   ├── api/          # API endpoints
│   └── ...           # Page routes
├── src/              # Application source code
│   ├── config/       # Configuration files
│   ├── db/           # Database related code
│   │   ├── migrations/  # Database migrations
│   │   └── schema/   # Database schema definitions
│   ├── middleware/   # Middleware functions
│   ├── models/       # Business logic models
│   ├── services/     # Service layer
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── static/           # Static assets
├── .env.example      # Example environment variables
├── deno.json         # Deno configuration
├── drizzle.config.ts # Drizzle ORM configuration
├── fresh.config.ts   # Fresh framework configuration
└── tailwind.config.ts # Tailwind CSS configuration
```

## Getting Started

1. Make sure to install Deno: https://deno.land/manual/getting_started/installation

2. Clone the repository:
   ```
   git clone <repository-url>
   cd WorkflowS_pg
   ```

3. Copy the environment example file and configure it:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials.

4. Start the development server:
   ```
   deno task start
   ```

This will watch the project directory and restart as necessary.

## Database Setup

The project uses PostgreSQL with Drizzle ORM. Database setup instructions will be added when the ORM implementation is complete.

## Project Features

- Project management with Scrum methodology
- Sprint planning and tracking
- Task management with Kanban boards
- Metrics and reporting for teachers
- Role-based access control
