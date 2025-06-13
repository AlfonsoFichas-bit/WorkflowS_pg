import { useState, useEffect } from "preact/hooks";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import BurndownChartIsland from "./BurndownChartIsland.tsx";
import type { User } from "../utils/types.ts";
import type { ProjectRole } from "../src/types/roles.ts";
import type { UserStoryWithSprintName } from "../routes/dashboard/projects/[id]/sprints/[sprintId].tsx";
import { TODO, IN_PROGRESS, REVIEW, DONE } from "../src/types/userStory.ts";

interface SprintDetailIslandProps {
  user: User;
  sprint: any; // Sprint details
  userStories: UserStoryWithSprintName[];
  userRole: ProjectRole | null;
  projectId: number;
}

export default function SprintDetailIsland({
  user,
  sprint,
  userStories,
  userRole,
  projectId,
}: SprintDetailIslandProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [burndownData, setBurndownData] = useState<{ date: string; points: number }[]>([]);
  
  // Calculate total story points and completed points
  const totalStoryPoints = userStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  const completedStoryPoints = userStories
    .filter(story => story.status === DONE)
    .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  
  // Calculate progress percentage
  const progressPercentage = totalStoryPoints > 0 
    ? Math.round((completedStoryPoints / totalStoryPoints) * 100) 
    : 0;

  // Count stories by status
  const storiesByStatus = {
    [TODO]: userStories.filter(story => story.status === TODO).length,
    [IN_PROGRESS]: userStories.filter(story => story.status === IN_PROGRESS).length,
    [REVIEW]: userStories.filter(story => story.status === REVIEW).length,
    [DONE]: userStories.filter(story => story.status === DONE).length,
  };

  useEffect(() => {
    // Simulate fetching burndown data
    // In a real application, you would fetch this data from your API
    generateMockBurndownData();
  }, [sprint, userStories]);

  const generateMockBurndownData = () => {
    if (!sprint || !sprint.startDate || !sprint.endDate) return;
    
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    
    // Generate dates between start date and today (or end date if today is after end date)
    const currentDate = new Date(startDate);
    const lastDate = today > endDate ? endDate : today;
    
    const mockData: { date: string; points: number }[] = [];
    let remainingPoints = totalStoryPoints;
    
    while (currentDate <= lastDate) {
      // Simulate some random progress each day
      // In a real app, this would be actual data from your database
      const pointsCompleted = Math.floor(Math.random() * 5); // Random points between 0-4
      remainingPoints = Math.max(0, remainingPoints - pointsCompleted);
      
      mockData.push({
        date: currentDate.toISOString().split('T')[0],
        points: pointsCompleted,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setBurndownData(mockData);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{sprint.name}</h1>
          <p class="text-gray-600 dark:text-gray-400">
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </p>
        </div>
        <a 
          href={`/dashboard/sprints?projectId=${sprint.projectId}`}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <MaterialSymbol icon="arrow_back" className="mr-1" /> Back to Sprints
        </a>
      </div>

      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span class="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div class="flex justify-center items-center py-8">
          <MaterialSymbol icon="sync" className="animate-spin text-3xl text-blue-600 dark:text-blue-400" />
          <span class="ml-2">Loading...</span>
        </div>
      ) : (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sprint Overview */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Sprint Overview</h2>
            
            {sprint.description && (
              <div class="mb-4">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p class="mt-1 text-gray-900 dark:text-gray-100">{sprint.description}</p>
              </div>
            )}
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                <p class="mt-1 text-gray-900 dark:text-gray-100">
                  <span class={`px-2 py-1 rounded-full text-xs font-semibold ${
                    sprint.status === 'PLANNED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    sprint.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    sprint.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {sprint.status}
                  </span>
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Story Points</h3>
                <p class="mt-1 text-gray-900 dark:text-gray-100">{totalStoryPoints}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Points</h3>
                <p class="mt-1 text-gray-900 dark:text-gray-100">{completedStoryPoints}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</h3>
                <p class="mt-1 text-gray-900 dark:text-gray-100">{progressPercentage}%</p>
              </div>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
              <div 
                class="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div class="grid grid-cols-4 gap-2">
              <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">To Do</p>
                <p class="text-lg font-semibold">{storiesByStatus[TODO]}</p>
              </div>
              <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg text-center">
                <p class="text-xs text-blue-500 dark:text-blue-400">In Progress</p>
                <p class="text-lg font-semibold">{storiesByStatus[IN_PROGRESS]}</p>
              </div>
              <div class="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg text-center">
                <p class="text-xs text-yellow-500 dark:text-yellow-400">Review</p>
                <p class="text-lg font-semibold">{storiesByStatus[REVIEW]}</p>
              </div>
              <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg text-center">
                <p class="text-xs text-green-500 dark:text-green-400">Done</p>
                <p class="text-lg font-semibold">{storiesByStatus[DONE]}</p>
              </div>
            </div>
          </div>
          
          {/* Burndown Chart */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Burndown Chart</h2>
            <BurndownChartIsland
              sprintId={sprint.id}
              startDate={sprint.startDate}
              endDate={sprint.endDate}
              totalStoryPoints={totalStoryPoints}
              completedPointsData={burndownData}
            />
          </div>
          
          {/* User Stories */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">User Stories</h2>
              <a 
                href={`/dashboard/kanban?projectId=${sprint.projectId}`}
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                <MaterialSymbol icon="view_kanban" className="mr-1" /> View Kanban
              </a>
            </div>
            
            {userStories.length === 0 ? (
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <MaterialSymbol icon="inbox" className="text-4xl mb-2" />
                <p>No user stories assigned to this sprint</p>
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
                        Status
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {userStories.map(story => (
                      <tr key={story.id}>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {story.title}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span class={`px-2 py-1 rounded-full text-xs font-semibold ${
                            story.status === TODO ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            story.status === IN_PROGRESS ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            story.status === REVIEW ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            story.status === DONE ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {story.status}
                          </span>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}