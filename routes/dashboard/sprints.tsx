import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { getAllSprints, getSprintsByProjectId, getProjectById, getAllProjects } from "../../utils/db.ts";
import SprintsPageIsland from "../../islands/SprintsPageIsland.tsx";

interface Sprint {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface SprintsData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
  sprints: Sprint[];
  projects: Array<{
    id: number;
    name: string;
  }>;
  selectedProjectId?: number;
}

export const handler: Handlers<SprintsData, State> = {
  async GET(req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    let sprints: Sprint[] = [];
    let selectedProjectId: number | undefined = undefined;

    if (projectId) {
      const projectIdNum = parseInt(projectId);
      if (!isNaN(projectIdNum)) {
        // Verificar que el proyecto existe
        const project = await getProjectById(projectIdNum);
        if (project && project.length > 0) {
          sprints = await getSprintsByProjectId(projectIdNum);
          selectedProjectId = projectIdNum;
        }
      }
    } else {
      // Si no se especifica un proyecto, mostrar todos los sprints
      sprints = await getAllSprints();
    }

    // Obtener todos los proyectos para el selector
    const projects = await getAllProjects();
    const projectsForSelect = projects.map(project => ({
      id: project.id,
      name: project.name
    }));

    return ctx.render({
      user: ctx.state.user,
      sprints,
      projects: projectsForSelect,
      selectedProjectId
    });
  },
};

export default function Sprints({ data }: PageProps<SprintsData>) {
  const { user, sprints, projects, selectedProjectId } = data;

  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <SprintsPageIsland 
          user={user} 
          sprints={sprints} 
          projects={projects} 
          selectedProjectId={selectedProjectId} 
        />
      </div>
    </DashboardLayout>
  );
}
