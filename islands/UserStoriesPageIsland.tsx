import { useState, useEffect } from "preact/hooks";
import { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";
import type { User } from "../utils/types.ts";
// Ensure UserStory from schema includes the optional sprintName if added by DB queries
import type { UserStory } from "../src/db/schema/index.ts";
import type { ProjectWithUserRole } from "../routes/dashboard/user-stories.tsx";
import { USER_STORY_PRIORITIES, UserStoryPriority, USER_STORY_STATUSES, UserStoryStatus, TODO, MEDIUM } from "../types/userStory.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../types/roles.ts";

// Define an extended UserStory type that includes sprintName from API
export type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

interface UserStoriesPageIslandProps {
  user: User;
  projects: ProjectWithUserRole[];
  initialUserStories: UserStoryWithSprintName[];
  selectedProjectId: number | null;
}

type StoryFormData = {
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: UserStoryPriority;
  storyPoints: number | null;
};

export default function UserStoriesPageIsland(
  { user, projects, initialUserStories, selectedProjectId: initialSelectedProjectId }: UserStoriesPageIslandProps,
) {
  const [currentStories, setCurrentStories] = useState<UserStoryWithSprintName[]>(initialUserStories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStoryWithSprintName | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialSelectedProjectId);

  const [formState, setFormState] = useState<StoryFormData>({
    title: "",
    description: "",
    acceptanceCriteria: "",
    priority: MEDIUM,
    storyPoints: null,
  });

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const canManageStories = activeProject?.userRole === PROJECT_OWNER || activeProject?.userRole === SCRUM_MASTER;

  // Filter state for sprint assignment
  const [sprintFilter, setSprintFilter] = useState<"all" | "backlog" | "assigned">("all");

  useEffect(() => {
    setCurrentStories(initialUserStories);
    setSelectedProjectId(initialSelectedProjectId);
  }, [initialUserStories, initialSelectedProjectId]);

  const fetchUserStories = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-stories?projectId=${projectId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch user stories: ${response.statusText}`);
      }
      const data = await response.json();
      setCurrentStories(data.userStories || []);
    } catch (e) {
      setError(e.message);
      setCurrentStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const newProjectIdStr = (e.target as HTMLSelectElement).value;
    const newProjectId = newProjectIdStr ? parseInt(newProjectIdStr, 10) : null;
    
    setSelectedProjectId(newProjectId);
    setSprintFilter("all"); // Reset filter when project changes
    history.pushState(null, "", newProjectId ? `/dashboard/user-stories?projectId=${newProjectId}` : "/dashboard/user-stories");

    if (newProjectId) {
      fetchUserStories(newProjectId);
    } else {
      setCurrentStories([]);
    }
  };

  const resetForm = () => {
    setFormState({
      title: "",
      description: "",
      acceptanceCriteria: "",
      priority: MEDIUM,
      storyPoints: null,
    });
  };

  const openCreateModal = () => {
    setEditingStory(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (story: UserStoryWithSprintName) => {
    setEditingStory(story);
    setFormState({
      title: story.title,
      description: story.description || "",
      acceptanceCriteria: story.acceptanceCriteria || "",
      priority: story.priority as UserStoryPriority,
      storyPoints: story.storyPoints || null,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!selectedProjectId && !editingStory) {
      setError("No project selected for the new story.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const storyDataForApi = {
      ...formState,
      storyPoints: formState.storyPoints ? Number(formState.storyPoints) : null,
    };

    try {
      let response;
      if (editingStory) {
        response = await fetch(`/api/user-stories/${editingStory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storyDataForApi),
        });
      } else {
        response = await fetch(`/api/user-stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...storyDataForApi, projectId: selectedProjectId }),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save user story");
      }
      
      setShowModal(false);
      const projectIdToRefresh = editingStory ? editingStory.projectId : selectedProjectId;
      if (projectIdToRefresh) {
        fetchUserStories(projectIdToRefresh);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (story: UserStoryWithSprintName) => {
    if (!confirm("Are you sure you want to delete this user story?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-stories/${story.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete user story");
      }
      fetchUserStories(story.projectId);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, Event>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setFormState(prev => ({ ...prev, [name]: name === 'storyPoints' ? (value === '' ? null : parseInt(value, 10)) : value }));
  };

  const filteredStories = currentStories.filter(story => {
    if (sprintFilter === "backlog") return !story.sprintId;
    if (sprintFilter === "assigned") return !!story.sprintId;
    return true; // "all"
  });

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">User Stories</h1>
        {canManageStories && selectedProjectId && (
          <button
            onClick={openCreateModal}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            disabled={isLoading}
          >
            <MaterialSymbol icon="add" className="mr-1" />
            Create User Story
          </button>
        )}
      </div>

      <div class="md:flex md:items-end md:justify-between">
        <div class="flex-1 min-w-0">
            <label htmlFor="project-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Project:
            </label>
            <select
            id="project-select"
            value={selectedProjectId || ""}
            onChange={handleProjectChange}
            disabled={isLoading}
            class="mt-1 block w-full md:max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => (
                <option key={project.id} value={project.id}>
                {project.name} (Role: {project.userRole})
                </option>
            ))}
            </select>
        </div>
        {selectedProjectId && (
        <div class="mt-4 md:mt-0 md:ml-4">
            <label htmlFor="sprint-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Sprint:</label>
            <select
                id="sprint-filter"
                value={sprintFilter}
                onChange={(e) => setSprintFilter((e.target as HTMLSelectElement).value as "all" | "backlog" | "assigned")}
                disabled={isLoading || !selectedProjectId}
                class="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">All Stories</option>
                <option value="backlog">Backlog (Unassigned)</option>
                <option value="assigned">Assigned to a Sprint</option>
            </select>
        </div>
        )}
      </div>

      {error && <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-800 dark:text-red-200" role="alert">{error}</div>}

      {isLoading && <div class="text-center py-4">Loading stories... <MaterialSymbol icon="hourglass_empty" className="animate-spin"/></div>}

      {!isLoading && !error && selectedProjectId && filteredStories.length === 0 && (
        <p class="text-center py-4 text-gray-500 dark:text-gray-400">
            {sprintFilter === "all" && currentStories.length === 0 ? "No user stories found for this project. " : `No user stories found for the current filter (${sprintFilter}). `}
            {canManageStories ? "Try creating one!" : ""}
        </p>
      )}

      {!isLoading && !error && selectedProjectId && filteredStories.length > 0 && (
        <div class="shadow overflow-x-auto border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sprint</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Story Points</th>
                {canManageStories && <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStories.map((story) => (
                <tr key={story.id}>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{story.title}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{story.sprintName || (story.sprintId ? `Error: Sprint ID ${story.sprintId}` : "Backlog")}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{story.priority}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{story.status}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{story.storyPoints ?? "-"}</td>
                  {canManageStories && (
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => openEditModal(story)} disabled={isLoading} class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50">Edit</button>
                      <button onClick={() => handleDeleteStory(story)} disabled={isLoading} class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal show={showModal} onClose={() => { if(!isLoading) setShowModal(false); }} maxWidth="2xl">
          <form onSubmit={handleFormSubmit} class="p-6 space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{editingStory ? "Edit User Story" : "Create User Story"}</h2>
            <div>
              <label htmlFor="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span class="text-red-500">*</span></label>
              <input type="text" name="title" id="title" value={formState.title} onInput={handleInputChange} required disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea name="description" id="description" value={formState.description} onInput={handleInputChange} rows={3} disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
              <label htmlFor="acceptanceCriteria" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Acceptance Criteria</label>
              <textarea name="acceptanceCriteria" id="acceptanceCriteria" value={formState.acceptanceCriteria} onInput={handleInputChange} rows={3} disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
              <label htmlFor="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority <span class="text-red-500">*</span></label>
              <select name="priority" id="priority" value={formState.priority} onChange={handleInputChange} required disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {USER_STORY_PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="storyPoints" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Story Points</label>
              <input type="number" name="storyPoints" id="storyPoints" value={formState.storyPoints ?? ""} onInput={handleInputChange} min="0" disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? (editingStory ? "Saving..." : "Creating...") : (editingStory ? "Save Changes" : "Create Story")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}