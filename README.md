# Plataforma Workflow

Una plataforma de gestión del flujo de trabajo para proyectos académicos utilizando la metodología Scrum. Esta plataforma permite que los profesores rastreen el progreso estudiantil y que los estudiantes gestionen sus proyectos usando metodologías ágiles.

## Desglose Tecnológico

- **Runtime**: [Deno](https://deno.land/)
- **Framework Web**: [Fresh](https://fresh.deno.dev/)
- **Base de Datos**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **UI**: Tailwind CSS

## Estructura del Proyecto

```
├── components
│   ├── Button.tsx
│   ├── DashboardLayout.tsx
│   ├── MaterialSymbol.tsx
│   └── Modal.tsx
├── deno.json
├── dev.ts
├── docs
│   ├── Build a Database App with Drizzle ORM and Deno.md
│   └── GuiaMaterialSymbols.md
├── drizzle
│   ├── 0000_amazing_xorn.sql
│   ├── 0001_oval_oracle.sql
│   └── meta
│       ├── 0000_snapshot.json
│       ├── 0001_snapshot.json
│       └── _journal.json
├── drizzle.config.ts
├── fresh.config.ts
├── fresh.gen.ts
├── islands
│   ├── AddUserToProjectIsland.tsx
│   ├── Counter.tsx
│   ├── CreateProjectFormIsland.tsx
│   ├── CreateUserFormIsland.tsx
│   ├── ModalIsland.tsx
│   ├── ProjectMembersIsland.tsx
│   ├── ProjectsPageIsland.tsx
│   ├── RubricsPageIsland.tsx
│   ├── SidebarIsland.tsx
│   ├── SprintsPageIsland.tsx
│   ├── TasksPageIsland.tsx
│   ├── tests
│   │   ├── SprintsPageIsland_test.tsx
│   │   └── UserStoriesPageIsland_test.tsx
│   ├── ThemeSwitchIsland.tsx
│   ├── UsersPageIsland.tsx
│   └── UserStoriesPageIsland.tsx
├── main_test.ts
├── main.ts
├── README.md
├── routes
│   ├── _404.tsx
│   ├── api
│   │   ├── joke.ts
│   │   ├── _middleware.ts
│   │   ├── rubric-criteria.ts
│   │   ├── rubrics.ts
│   │   ├── sprints
│   │   │   ├── [id]
│   │   │   │   └── user-stories.ts
│   │   │   └── [id].ts
│   │   ├── sprints.ts
│   │   ├── tasks.ts
│   │   ├── user-stories
│   │   │   └── [id].ts
│   │   └── user-stories.ts
│   ├── _app.tsx
│   ├── auth
│   │   ├── login.tsx
│   │   ├── logout.ts
│   │   └── register.tsx
│   ├── dashboard
│   │   ├── icons.tsx
│   │   ├── index.tsx
│   │   ├── _middleware.ts
│   │   ├── projects
│   │   │   ├── available-users.tsx
│   │   │   ├── [id]
│   │   │   │   ├── members.tsx
│   │   │   │   └── users.ts
│   │   │   └── [id].tsx
│   │   ├── projects.tsx
│   │   ├── rubrics.tsx
│   │   ├── sprints.tsx
│   │   ├── tasks.tsx
│   │   ├── team.tsx
│   │   ├── users
│   │   │   └── [id].tsx
│   │   ├── user-stories.tsx
│   │   └── users.tsx
│   ├── dashboard.tsx
│   ├── greet
│   │   └── [name].tsx
│   └── index.tsx
├── src
│   ├── config
│   │   └── database.ts
│   ├── db
│   │   ├── db.ts
│   │   ├── drop-tables.ts
│   │   ├── index.ts
│   │   ├── init.ts
│   │   ├── migrate.ts
│   │   ├── relations.ts
│   │   ├── schema
│   │   │   ├── comments.ts
│   │   │   ├── evaluations.ts
│   │   │   ├── index.ts
│   │   │   ├── projects.ts
│   │   │   ├── rubrics.ts
│   │   │   ├── sprints.ts
│   │   │   ├── tasks.ts
│   │   │   ├── teamMembers.ts
│   │   │   ├── teams.ts
│   │   │   ├── userStories.ts
│   │   │   └── users.ts
│   │   └── schema.ts.bak
│   ├── middleware
│   │   └── README.md
│   ├── models
│   │   └── README.md
│   ├── scripts
│   │   ├── init-admin.ts
│   │   ├── setup-db.ts
│   │   └── setup.ts
│   ├── script.ts
│   ├── services
│   │   └── README.md
│   ├── test-connection.ts
│   ├── types
│   │   ├── index.ts
│   │   ├── roles.d.ts
│   │   ├── roles.ts
│   │   ├── sprint.ts
│   │   └── userStory.ts
│   └── utils
│       ├── env.ts
│       └── permissions.ts
├── static
│   ├── favicon.ico
│   ├── logo.svg
│   ├── styles.css
│   └── theme.js
├── tailwind.config.ts
├── tests
│   └── api
│       ├── sprints_api_test.ts
│       └── user_stories_api_test.ts
└── utils
    ├── auth.ts
    ├── db.ts
    ├── hooks.ts
    ├── theme-types.ts
    └── types.ts

31 directories, 115 files
```

## Primeros Pasos

1. Asegúrate de instalar Deno: https://deno.land/manual/getting_started/installation

2. Clona el repositorio:
   ```
   git clone <repository-url>
   cd WorkflowS_pg
   ```

3. Copia el archivo de ejemplo de entorno y configúralo:
   ```
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus credenciales de base de datos.

4. Inicia el servidor de desarrollo:
   ```
   deno task start
   ```
   
   **Nota**: Al iniciar el servidor con `deno task start`, automáticamente se realizarán las siguientes acciones:
   1. Se configurará la base de datos desde cero (eliminando tablas existentes si las hay)
   2. Se crearán todas las tablas con la estructura correcta
   3. Se creará un usuario administrador por defecto con las siguientes credenciales:
      - Email: admin@workflow.com
      - Contraseña: admin123
   4. Se iniciará el servidor de desarrollo

   Si solo necesitas configurar la base de datos y crear el usuario administrador sin iniciar el servidor, puedes ejecutar:
   ```
   deno task setup:db
   ```
   
   **Importante**: La primera vez que ejecutes `deno task start` o `deno task setup:db`, se eliminará cualquier dato existente en la base de datos y se creará una estructura limpia. Esto garantiza que la aplicación funcione correctamente desde el principio.

Esto vigilará el directorio del proyecto y se reiniciará según sea necesario.

## Configuración de la Base de Datos

El proyecto utiliza PostgreSQL con Drizzle ORM. Se agregarán instrucciones de configuración de la base de datos cuando se complete la implementación del ORM.

## Características del Proyecto

- Gestión de proyectos con la metodología Scrum
- Planificación y seguimiento de sprints
- Gestión de tareas con tableros Kanban
- Métricas e informes para profesores
- Control de acceso basado en roles