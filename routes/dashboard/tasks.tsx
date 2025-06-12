import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { getAllTasks, getTasksBySprintId, getTasksByAssigneeId, getAllSprints, getAllUserStories, getAllProjects, getUserStoriesBySprintId } from "../../src/db/db.ts";
import TasksPageIsland from "../../islands/TasksPageIsland.tsx";

// Import the schema
import { tasks as tasksSchema } from "../../src/db/schema/index.ts";

// Define type based on schema
type Task = typeof tasksSchema.$inferSelect;

interface Sprint {
  id: number;
  name: string;
  projectId: number;
}

// Import the schema for user stories
import { userStories as userStoriesSchema } from "../../src/db/schema/index.ts";

// Define type based on schema with additional sprintName property
type UserStory = typeof userStoriesSchema.$inferSelect & { 
  sprintName?: string | null 
};

interface Project {
  id: number;
  name: string;
}

interface TasksData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
  tasks: Task[];
  sprints: Sprint[];
  userStories: UserStory[];
  projects: Project[];
  selectedSprintId?: number;
  selectedAssigneeId?: number;
}

export const handler: Handlers<TasksData, State> = {
  async GET(req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    const url = new URL(req.url);
    const sprintId = url.searchParams.get("sprintId");
    const assigneeId = url.searchParams.get("assigneeId");

    let tasks: Task[] = [];
    let selectedSprintId: number | undefined = undefined;
    let selectedAssigneeId: number | undefined = undefined;
    let userStories: UserStory[] = [];

    // Si se especifica un sprint, obtener las tareas de ese sprint
    if (sprintId) {
      const sprintIdNum = Number.parseInt(sprintId);
      if (!Number.isNaN(sprintIdNum)) {
        tasks = await getTasksBySprintId(sprintIdNum);
        selectedSprintId = sprintIdNum;

        // Obtener las historias de usuario asociadas a este sprint
        userStories = await getUserStoriesBySprintId(sprintIdNum);
      }
    } 
    // Si se especifica un assignee, obtener las tareas asignadas a ese usuario
    else if (assigneeId) {
      const assigneeIdNum = Number.parseInt(assigneeId);
      if (!Number.isNaN(assigneeIdNum)) {
        tasks = await getTasksByAssigneeId(assigneeIdNum);
        selectedAssigneeId = assigneeIdNum;
      }
    } else {
      // Si no se especifica un filtro, mostrar todas las tareas
      tasks = await getAllTasks();

      // Obtener todas las historias de usuario
      userStories = await getAllUserStories();
    }

    // Obtener todos los sprints para el selector
    const sprints = await getAllSprints();

    // Obtener todos los proyectos para el selector
    const projects = await getAllProjects();

    return ctx.render({
      user: ctx.state.user,
      tasks,
      sprints,
      userStories,
      projects,
      selectedSprintId,
      selectedAssigneeId
    });
  },
};

export default function Tasks({ data }: PageProps<TasksData>) {
  const { user, tasks, sprints, userStories, projects, selectedSprintId, selectedAssigneeId } = data;

  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <TasksPageIsland 
          user={user} 
          tasks={tasks} 
          sprints={sprints} 
          userStories={userStories}
          projects={projects}
          selectedSprintId={selectedSprintId} 
          selectedAssigneeId={selectedAssigneeId}
        />
      </div>
    </DashboardLayout>
  );
}
