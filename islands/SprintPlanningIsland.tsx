import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import type { User } from "../utils/types.ts";
import { userStories } from "../src/db/schema/index.ts";
import { SPRINT_STATUSES, PLANNED } from "../src/types/sprint.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../src/types/roles.ts";
import type { ProjectRole } from "../src/types/roles.ts";

// Define types based on the schema tables
type UserStory = typeof userStories.$inferSelect;

// Extended UserStory type that includes sprintName from API
export type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

// Define ProjectWithUserRole interface
interface ProjectWithUserRole {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  userRole: ProjectRole | null;
}

interface SprintPlanningIslandProps {
  user: User;
  project: ProjectWithUserRole;
  projectId: number;
}

type SprintFormData = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function SprintPlanningIsland({
  user,
  project,
  projectId,
}: SprintPlanningIslandProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Sprint form data
  const [sprintFormData, setSprintFormData] = useState<SprintFormData>({
    name: "",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    status: PLANNED,
  });
  
  // User stories
  const [availableUserStories, setAvailableUserStories] = useState<UserStoryWithSprintName[]>([]);
  const [selectedUserStories, setSelectedUserStories] = useState<UserStoryWithSprintName[]>([]);
  
  // Team capacity
  const [teamCapacity, setTeamCapacity] = useState<number>(0);
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string; capacity: number }[]>([]);
  
  const canManageSprints = project.userRole === PROJECT_OWNER || project.userRole === SCRUM_MASTER;
  
  // Calculate total story points
  const totalSelectedPoints = selectedUserStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  
  useEffect(() => {
    fetchAvailableUserStories(projectId);
    fetchTeamMembers(projectId);
  }, []);
  
  // Ya no necesitamos el selector de proyecto, ya que estamos en el contexto de un proyecto específico
  
  const fetchAvailableUserStories = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-stories?projectId=${projectId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch user stories: ${response.statusText}`);
      }
      const data = await response.json();
      // Filter stories that are not assigned to any sprint
      setAvailableUserStories((data.userStories || []).filter((story: UserStoryWithSprintName) => story.sprintId === null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setAvailableUserStories([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTeamMembers = (projectId: number) => {
    setIsLoading(true);
    try {
      // In a real application, you would fetch team members from your API
      // For now, we'll use mock data
      setTimeout(() => {
        const mockTeamMembers = [
          { id: 1, name: "John Doe", capacity: 10 },
          { id: 2, name: "Jane Smith", capacity: 8 },
          { id: 3, name: "Bob Johnson", capacity: 12 },
        ];
        setTeamMembers(mockTeamMembers);
        // Calculate total team capacity
        const totalCapacity = mockTeamMembers.reduce((sum, member) => sum + member.capacity, 0);
        setTeamCapacity(totalCapacity);
        setIsLoading(false);
      }, 500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setTeamMembers([]);
      setTeamCapacity(0);
      setIsLoading(false);
    }
  };
  
  const handleSprintFormInputChange = (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, Event>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setSprintFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectUserStory = (story: UserStoryWithSprintName) => {
    setSelectedUserStories(prev => [...prev, story]);
    setAvailableUserStories(prev => prev.filter(s => s.id !== story.id));
  };
  
  const handleUnselectUserStory = (story: UserStoryWithSprintName) => {
    setAvailableUserStories(prev => [...prev, story]);
    setSelectedUserStories(prev => prev.filter(s => s.id !== story.id));
  };
  
  const handleCreateSprint = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 1. Create the sprint
      const sprintResponse = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sprintFormData,
          projectId: projectId,
        }),
      });
      
      if (!sprintResponse.ok) {
        const errData = await sprintResponse.json();
        throw new Error(errData.error || 'Failed to create sprint');
      }
      
      const sprintData = await sprintResponse.json();
      const newSprintId = sprintData.sprint.id;
      
      // 2. Assign selected user stories to the sprint
      if (selectedUserStories.length > 0) {
        for (const story of selectedUserStories) {
          const storyResponse = await fetch(`/api/user-stories/${story.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sprintId: newSprintId,
            }),
          });
          
          if (!storyResponse.ok) {
            console.error(`Failed to assign story ${story.id} to sprint ${newSprintId}`);
          }
        }
      }
      
      setSuccess("Sprint created successfully with assigned user stories");
      
      // Reset form
      setSprintFormData({
        name: "",
        description: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        status: PLANNED,
      });
      setSelectedUserStories([]);
      
      // Refresh available user stories
      fetchAvailableUserStories(projectId);
      
      // Redirect to sprint details page after a short delay
      setTimeout(() => {
        globalThis.location.href = `/dashboard/projects/${projectId}/sprints/${newSprintId}`;
      }, 2000);
      
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Sprint Planning</h1>
        <a 
          href={`/dashboard/sprints?projectId=${projectId}`}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <MaterialSymbol icon="arrow_back" class="mr-1" /> Back to Sprints
        </a>
      </div>
      
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Project: {project.name}
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {project.description || "No description available"}
        </p>
      </div>
      
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span class="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative dark:bg-green-900 dark:text-green-100 dark:border-green-700" role="alert">
          <span class="block sm:inline">{success}</span>
        </div>
      )}
      
      {isLoading ? (
        <div class="flex justify-center items-center py-8">
          <MaterialSymbol icon="sync" className="animate-spin text-3xl text-blue-600 dark:text-blue-400" />
          <span class="ml-2">Loading...</span>
        </div>
      ) : canManageSprints ? (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sprint Form */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:col-span-1">
            <h2 class="text-xl font-semibold mb-4">Create Sprint</h2>
            <form onSubmit={handleCreateSprint} class="space-y-4">
              <div>
                <label htmlFor="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sprint Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={sprintFormData.name}
                  onInput={handleSprintFormInputChange}
                  required
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={sprintFormData.description}
                  onInput={handleSprintFormInputChange}
                  rows={3}
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={sprintFormData.startDate}
                  onInput={handleSprintFormInputChange}
                  required
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={sprintFormData.endDate}
                  onInput={handleSprintFormInputChange}
                  required
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={sprintFormData.status}
                  onChange={handleSprintFormInputChange}
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {SPRINT_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div class="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || selectedUserStories.length === 0}
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span class="flex items-center justify-center">
                      <MaterialSymbol icon="sync" className="animate-spin mr-2" />
                      Creating...
                    </span>
                  ) : (
                    "Create Sprint"
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Team Capacity and Selected Stories */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:col-span-2">
            <div class="mb-6">
              <h2 class="text-xl font-semibold mb-4">Team Capacity</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Capacity</h3>
                  <p class="text-2xl font-bold">{teamCapacity} points</p>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Selected Points</h3>
                  <p class="text-2xl font-bold">{totalSelectedPoints} points</p>
                  <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                    <div 
                      class={`h-2.5 rounded-full ${
                        totalSelectedPoints > teamCapacity 
                          ? 'bg-red-600 dark:bg-red-500' 
                          : 'bg-green-600 dark:bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (totalSelectedPoints / teamCapacity) * 100)}%` }}
                    ></div>
                  </div>
                  <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    {totalSelectedPoints > teamCapacity 
                      ? `Overallocated by ${totalSelectedPoints - teamCapacity} points` 
                      : `${teamCapacity - totalSelectedPoints} points remaining`}
                  </p>
                </div>
              </div>
              
              <h3 class="text-lg font-medium mb-2">Team Members</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {teamMembers.map(member => (
                  <div key={member.id} class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p class="font-medium">{member.name}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Capacity: {member.capacity} points</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 class="text-xl font-semibold mb-4">Selected User Stories</h2>
              {selectedUserStories.length === 0 ? (
                <div class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <MaterialSymbol icon="playlist_add" className="text-4xl mb-2" />
                  <p>No user stories selected yet</p>
                  <p class="text-sm">Select stories from the backlog below</p>
                </div>
              ) : (
                <div class="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {selectedUserStories.map(story => (
                    <div 
                      key={story.id} 
                      class="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div>
                        <p class="font-medium">{story.title}</p>
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span class={`px-2 py-0.5 rounded-full text-xs font-semibold mr-2 ${
                            story.priority === 'HIGHEST' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            story.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                            story.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            story.priority === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            story.priority === 'LOWEST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {story.priority}
                          </span>
                          <span>{story.storyPoints !== null ? `${story.storyPoints} points` : 'Not estimated'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnselectUserStory(story)}
                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <MaterialSymbol icon="remove_circle" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Available User Stories (Backlog) */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:col-span-3">
            <h2 class="text-xl font-semibold mb-4">Product Backlog</h2>
            {availableUserStories.length === 0 ? (
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <MaterialSymbol icon="inbox" className="text-4xl mb-2" />
                <p>No available user stories in the backlog</p>
                <a 
                  href={`/dashboard/user-stories?projectId=${projectId}`}
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center mt-2"
                >
                  <MaterialSymbol icon="add" className="mr-1" /> Create User Stories
                </a>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Points
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {availableUserStories.map(story => (
                      <tr key={story.id}>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {story.title}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span class={`px-2 py-1 rounded-full text-xs font-semibold ${
                            story.priority === 'HIGHEST' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            story.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                            story.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            story.priority === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            story.priority === 'LOWEST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {story.priority}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {story.storyPoints !== null ? story.storyPoints : '-'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span class={`px-2 py-1 rounded-full text-xs font-semibold ${
                            story.status === 'TODO' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            story.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            story.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            story.status === 'DONE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {story.status}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleSelectUserStory(story)}
                            class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <MaterialSymbol icon="add_circle" className="mr-1" /> Add to Sprint
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : !canManageSprints ? (
        <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700" role="alert">
          <span class="block sm:inline">You don't have permission to plan sprints for this project. Only Product Owners and Scrum Masters can plan sprints.</span>
        </div>
      ) : (
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <MaterialSymbol icon="error" class="text-4xl mb-2" />
          <p>An unexpected error occurred</p>
        </div>
      )}
    </div>
  );
}