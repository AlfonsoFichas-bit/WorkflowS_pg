import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";
import type { User } from "../utils/types.ts";
// Import UserStory from types instead of schema
import type { UserStory } from "../src/types/userStory.ts";
import type { ProjectWithUserRole } from "../routes/dashboard/user-stories.tsx";
import { USER_STORY_PRIORITIES, UserStoryPriority, USER_STORY_STATUSES, UserStoryStatus, TODO, MEDIUM } from "../src/types/userStory.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../src/types/roles.ts";

// Extend UserStory to include sprintName for display
type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

interface UserStoriesPageIslandProps {
  user: User;
  projects: ProjectWithUserRole[];
  initialStories: UserStoryWithSprintName[];
  selectedProjectId: number | null;
}

export default function UserStoriesPageIsland(
  { user, projects, initialStories, selectedProjectId: initialSelectedProjectId }: UserStoriesPageIslandProps,
) {
  const [currentStories, setCurrentStories] = useState<UserStoryWithSprintName[]>(initialStories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialSelectedProjectId);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStoryWithSprintName | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    acceptanceCriteria: "",
    status: TODO as UserStoryStatus,
    priority: MEDIUM as UserStoryPriority,
    storyPoints: "",
  });

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const canManageStories = activeProject?.userRole === PROJECT_OWNER || activeProject?.userRole === SCRUM_MASTER;

  useEffect(() => {
    setCurrentStories(initialStories);
    setSelectedProjectId(initialSelectedProjectId);
  }, [initialStories, initialSelectedProjectId]);

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
      const error = e instanceof Error ? e.message : String(e);
      setError(error);
      setCurrentStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const newProjectIdStr = (e.target as HTMLSelectElement).value;
    const newProjectId = newProjectIdStr ? parseInt(newProjectIdStr, 10) : null;
    setSelectedProjectId(newProjectId);
    history.pushState(null, "", newProjectId ? `/dashboard/user-stories?projectId=${newProjectId}` : "/dashboard/user-stories");
    if (newProjectId) fetchUserStories(newProjectId);
    else setCurrentStories([]);
  };

  const openCreateModal = () => {
    setEditingStory(null);
    setFormData({
      title: "",
      description: "",
      acceptanceCriteria: "",
      status: TODO,
      priority: MEDIUM,
      storyPoints: "",
    });
    setShowModal(true);
  };

  const openEditModal = (story: UserStoryWithSprintName) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      description: story.description || "",
      acceptanceCriteria: story.acceptanceCriteria || "",
      status: story.status,
      priority: story.priority,
      storyPoints: story.storyPoints?.toString() || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!selectedProjectId && !editingStory?.projectId) {
      setError("No project context for user story.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const storyData = {
        ...formData,
        storyPoints: formData.storyPoints ? parseInt(formData.storyPoints, 10) : null,
        projectId: editingStory?.projectId || selectedProjectId,
      };

      const url = editingStory 
        ? `/api/user-stories/${editingStory.id}` 
        : "/api/user-stories";
      
      const method = editingStory ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyData),
      });

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
      const error = e instanceof Error ? e.message : String(e);
      setError(error);
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
      const error = e instanceof Error ? e.message : String(e);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, Event>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">User Stories</h1>
        {canManageStories && selectedProjectId && (
          <button
            onClick={openCreateModal}
            class="btn-primary"
            disabled={isLoading}
          >
            <MaterialSymbol icon="add" className="mr-1" /> Create User Story
          </button>
        )}
      </div>

      <div>
        <label htmlFor="project-select" class="block text-sm font-medium">Select Project:</label>
        <select
          id="project-select"
          value={selectedProjectId || ""}
          onChange={handleProjectChange}
          disabled={isLoading}
          class="mt-1 input-field w-full"
        >
          <option value="">-- Select a Project --</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (Role: {p.userRole})</option>)}
        </select>
      </div>

      {error && <div class="alert-danger" role="alert">{error}</div>}
      {isLoading && <div class="text-center py-4">Loading...</div>}

      {!isLoading && !error && selectedProjectId && currentStories.length === 0 && (
        <p class="text-center py-4">No user stories found for this project. {canManageStories ? "Create one!" : ""}</p>
      )}

      {!isLoading && !error && selectedProjectId && currentStories.length > 0 && (
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sprint</th>
                {canManageStories && <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {currentStories.map((story) => (
                <tr key={story.id} class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{story.title}</div>
                    {story.description && <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{story.description}</div>}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${story.status === 'TODO' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                        story.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                        story.status === 'TESTING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                      {story.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${story.priority === 'LOWEST' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                        story.priority === 'LOW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                        story.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                        story.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {story.priority}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {story.storyPoints || 'N/A'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {story.sprintName || 'Backlog'}
                  </td>
                  {canManageStories && (
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(story)}
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStory(story)}
                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit User Story Modal */}
      {showModal && (
        <Modal
          show={showModal}
          onClose={() => !isLoading && setShowModal(false)}
        >
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-4">{editingStory ? "Edit User Story" : "Create User Story"}</h2>
            <form onSubmit={handleSubmit} class="space-y-4">
              {error && (
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                  <span class="block sm:inline">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onInput={handleInputChange}
                  required
                  disabled={isLoading}
                  class="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onInput={handleInputChange}
                  rows={3}
                  disabled={isLoading}
                  class="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="acceptanceCriteria" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acceptance Criteria
                </label>
                <textarea
                  id="acceptanceCriteria"
                  name="acceptanceCriteria"
                  value={formData.acceptanceCriteria}
                  onInput={handleInputChange}
                  rows={3}
                  disabled={isLoading}
                  class="input-field w-full"
                  placeholder="What needs to be done for this story to be considered complete?"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    class="input-field w-full"
                  >
                    {USER_STORY_STATUSES.map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    class="input-field w-full"
                  >
                    {USER_STORY_PRIORITIES.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="storyPoints" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Story Points
                  </label>
                  <input
                    type="number"
                    id="storyPoints"
                    name="storyPoints"
                    value={formData.storyPoints}
                    onInput={handleInputChange}
                    min="0"
                    max="100"
                    disabled={isLoading}
                    class="input-field w-full"
                  />
                </div>
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  class="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="btn-primary"
                >
                  {isLoading ? "Saving..." : (editingStory ? "Save Changes" : "Create User Story")}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}