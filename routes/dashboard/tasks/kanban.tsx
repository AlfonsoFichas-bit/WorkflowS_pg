import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import { DashboardLayout } from "../../../components/DashboardLayout.tsx";
import TaskKanbanBoardIsland from "../../../islands/TaskKanbanBoardIsland.tsx";
import { 
  getAllTasks, 
  getTasksBySprintId, 
  getAllSprints, 
  getAllProjects, 
  getProjectMembers 
} from "../../../utils/db.ts";

interface Task {
  id: number;
  title: string;
  description: string | null;
  sprintId: number | null;
  assigneeId: number | null;
  status: string;
  priority: string;
  storyPoints: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Sprint {
  id: number;
  name: string;
  projectId: number;
}

interface Member {
  id: number;
  userId: number;
  teamId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface TaskKanbanPageData {
  user: State["user"];
  tasks: Task[];
  sprints: Sprint[];
  projectMembers: Member[];
  selectedSprintId?: number;
}

export const handler: Handlers<TaskKanbanPageData, State> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const sprintId = url.searchParams.get("sprintId");

    let tasks: Task[] = [];
    let selectedSprintId: number | undefined = undefined;
    let projectMembers: Member[] = [];

    // Si se especifica un sprint, obtener las tareas de ese sprint
    if (sprintId) {
      const sprintIdNum = parseInt(sprintId);
      if (!isNaN(sprintIdNum)) {
        tasks = await getTasksBySprintId(sprintIdNum);
        selectedSprintId = sprintIdNum;
        
        // Obtener el sprint para saber a qué proyecto pertenece
        const sprintResult = await getAllSprints();
        const sprint = sprintResult.find(s => s.id === sprintIdNum);
        
        if (sprint) {
          // Obtener los miembros del proyecto al que pertenece el sprint
          projectMembers = await getProjectMembers(sprint.projectId);
        }
      }
    } else {
      // Si no se especifica un filtro, mostrar todas las tareas
      tasks = await getAllTasks();
      
      // Obtener todos los proyectos para obtener sus miembros
      const projects = await getAllProjects();
      
      // Para cada proyecto, obtener sus miembros
      for (const project of projects) {
        const members = await getProjectMembers(project.id);
        projectMembers = [...projectMembers, ...members];
      }
      
      // Eliminar duplicados (un usuario puede estar en varios proyectos)
      projectMembers = projectMembers.filter((member, index, self) =>
        index === self.findIndex((m) => m.user.id === member.user.id)
      );
    }

    // Obtener todos los sprints para el selector
    const sprints = await getAllSprints();

    return ctx.render({
      user: ctx.state.user,
      tasks,
      sprints,
      projectMembers,
      selectedSprintId
    });
  },
};

export default function TaskKanbanPage({ data }: PageProps<TaskKanbanPageData>) {
  const { user, tasks, sprints, projectMembers, selectedSprintId } = data;
  
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <TaskKanbanBoardIsland
          user={user}
          tasks={tasks}
          sprints={sprints}
          projectMembers={projectMembers}
          selectedSprintId={selectedSprintId}
        />
      </div>
    </DashboardLayout>
  );
}