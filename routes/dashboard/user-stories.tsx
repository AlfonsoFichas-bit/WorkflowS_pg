import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { getAllUserStories, getUserStoriesByProjectId, getUserStoriesBySprintId, getProjectById, getAllProjects, getSprintsByProjectId } from "../../utils/db.ts";
import UserStoriesPageIsland from "../../islands/UserStoriesPageIsland.tsx";

interface UserStory {
  id: number;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  projectId: number;
  sprintId: number | null;
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

interface UserStoriesData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
  userStories: UserStory[];
  projects: Array<{
    id: number;
    name: string;
  }>;
  sprints: Sprint[];
  selectedProjectId?: number;
  selectedSprintId?: number;
}

export const handler: Handlers<UserStoriesData, State> = {
  async GET(req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const sprintId = url.searchParams.get("sprintId");
    
    let userStories: UserStory[] = [];
    let selectedProjectId: number | undefined = undefined;
    let selectedSprintId: number | undefined = undefined;
    let sprints: Sprint[] = [];
    
    // Si se especifica un sprint, obtener las historias de usuario de ese sprint
    if (sprintId) {
      const sprintIdNum = parseInt(sprintId);
      if (!isNaN(sprintIdNum)) {
        userStories = await getUserStoriesBySprintId(sprintIdNum);
        selectedSprintId = sprintIdNum;
        
        // Si hay historias, obtener el projectId de la primera
        if (userStories.length > 0) {
          selectedProjectId = userStories[0].projectId;
        }
      }
    } 
    // Si se especifica un proyecto, obtener las historias de usuario de ese proyecto
    else if (projectId) {
      const projectIdNum = parseInt(projectId);
      if (!isNaN(projectIdNum)) {
        // Verificar que el proyecto existe
        const project = await getProjectById(projectIdNum);
        if (project && project.length > 0) {
          userStories = await getUserStoriesByProjectId(projectIdNum);
          selectedProjectId = projectIdNum;
          
          // Obtener los sprints del proyecto para el selector
          sprints = await getSprintsByProjectId(projectIdNum);
        }
      }
    } else {
      // Si no se especifica un proyecto ni un sprint, mostrar todas las historias de usuario
      userStories = await getAllUserStories();
    }
    
    // Obtener todos los proyectos para el selector
    const projects = await getAllProjects();
    const projectsForSelect = projects.map(project => ({
      id: project.id,
      name: project.name
    }));

    return ctx.render({
      user: ctx.state.user,
      userStories,
      projects: projectsForSelect,
      sprints,
      selectedProjectId,
      selectedSprintId
    });
  },
};

export default function UserStories({ data }: PageProps<UserStoriesData>) {
  const { user, userStories, projects, sprints, selectedProjectId, selectedSprintId } = data;
  
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <UserStoriesPageIsland 
          user={user} 
          userStories={userStories} 
          projects={projects} 
          sprints={sprints}
          selectedProjectId={selectedProjectId} 
          selectedSprintId={selectedSprintId}
        />
      </div>
    </DashboardLayout>
  );
}