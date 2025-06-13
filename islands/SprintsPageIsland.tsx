import { useState, useEffect } from "preact/hooks";
import { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";
import type { User } from "../utils/types.ts";
import type { Sprint, UserStory } from "../src/db/schema/index.ts";
import type { ProjectWithUserRole } from "../routes/dashboard/sprints.tsx"; // Updated path
import { SPRINT_STATUSES, SprintStatus, PLANNED } from "../types/sprint.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../types/roles.ts";

interface SprintsPageIslandProps {
  user: User;
  projects: ProjectWithUserRole[];
  initialSprints: Sprint[];
  selectedProjectId: number | null;
}

// Use Omit for form data to exclude fields not directly set by user or derived
type SprintFormData = Omit<Sprint, "id" | "createdAt" | "updatedAt" | "projectId"> & { projectId?: number };


export default function SprintsPageIsland(
  { user, projects, initialSprints, selectedProjectId: initialSelectedProjectId }: SprintsPageIslandProps,
) {
  const [currentSprints, setCurrentSprints] = useState<Sprint[]>(initialSprints);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialSelectedProjectId);

  // Create/Edit Sprint Modal
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprintFormData, setSprintFormData] = useState<Partial<SprintFormData>>({ status: PLANNED });

  // Assign User Stories Modal
  const [showAssignStoriesModal, setShowAssignStoriesModal] = useState(false);
  const [selectedSprintForAssignment, setSelectedSprintForAssignment] = useState<Sprint | null>(null);
  const [availableUserStories, setAvailableUserStories] = useState<UserStory[]>([]);
  const [assignedUserStories, setAssignedUserStories] = useState<UserStory[]>([]);

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const canManageSprints = activeProject?.userRole === PROJECT_OWNER || activeProject?.userRole === SCRUM_MASTER;

  useEffect(() => {
    setCurrentSprints(initialSprints);
    setSelectedProjectId(initialSelectedProjectId);
  }, [initialSprints, initialSelectedProjectId]);

  const fetchSprints = async (projectId: number) => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`/api/sprints?projectId=${projectId}`);
      if (!response.ok) throw new Error((await response.json()).error || "Failed to fetch sprints");
      const data = await response.json();
      setCurrentSprints(data.sprints || []);
    } catch (e) { setError(e.message); setCurrentSprints([]); }
    finally { setIsLoading(false); }
  };

  const handleProjectChange = (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const newProjectIdStr = (e.target as HTMLSelectElement).value;
    const newProjectId = newProjectIdStr ? parseInt(newProjectIdStr, 10) : null;
    setSelectedProjectId(newProjectId);
    history.pushState(null, "", newProjectId ? `/dashboard/sprints?projectId=${newProjectId}` : "/dashboard/sprints");
    if (newProjectId) fetchSprints(newProjectId);
    else setCurrentSprints([]);
  };

  const handleSprintFormInputChange = (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, Event>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setSprintFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateSprintModal = () => {
    setEditingSprint(null);
    setSprintFormData({ name: "", description: "", startDate: new Date().toISOString().split('T')[0], endDate: "", status: PLANNED });
    setShowCreateEditModal(true);
  };

  const openEditSprintModal = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setSprintFormData({
      name: sprint.name,
      description: sprint.description || "",
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : "",
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : "",
      status: sprint.status as SprintStatus,
    });
    setShowCreateEditModal(true);
  };

  const handleSprintFormSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!selectedProjectId && !editingSprint?.projectId) { setError("No project context for sprint."); return; }
    setIsLoading(true); setError(null);

    const dataToSend = {
      ...sprintFormData,
      projectId: editingSprint ? editingSprint.projectId : selectedProjectId,
      startDate: sprintFormData.startDate ? new Date(sprintFormData.startDate) : undefined,
      endDate: sprintFormData.endDate ? new Date(sprintFormData.endDate) : undefined,
    };

    if(dataToSend.startDate && dataToSend.endDate && dataToSend.endDate <= dataToSend.startDate){
        setError("End date must be after start date.");
        setIsLoading(false);
        return;
    }

    try {
      const response = editingSprint
        ? await fetch(`/api/sprints/${editingSprint.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSend) })
        : await fetch(`/api/sprints`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSend) });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to save sprint");

      setShowCreateEditModal(false);
      if (dataToSend.projectId) fetchSprints(dataToSend.projectId);
    } catch (e) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    if (!confirm(`Are you sure you want to delete sprint: ${sprint.name}? User stories will be moved to backlog.`)) return;
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`/api/sprints/${sprint.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to delete sprint");
      fetchSprints(sprint.projectId);
    } catch (e) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const fetchProjectAndSprintStories = async (sprint: Sprint) => {
     // Fetch stories assigned to this sprint
      const assignedRes = await fetch(`/api/sprints/${sprint.id}/user-stories`);
      if (!assignedRes.ok) throw new Error((await assignedRes.json()).error || "Failed to fetch assigned stories");
      const assignedData = await assignedRes.json();
      const currentAssignedStories = assignedData.userStories || [];
      setAssignedUserStories(currentAssignedStories);

      // Fetch all stories for the project
      const projectStoriesRes = await fetch(`/api/user-stories?projectId=${sprint.projectId}`);
      if(!projectStoriesRes.ok) throw new Error((await projectStoriesRes.json()).error || "Failed to fetch project stories");
      const projectStoriesData = await projectStoriesRes.json();
      const allProjectStories: UserStory[] = projectStoriesData.userStories || [];

      const assignedIds = new Set(currentAssignedStories.map((us: UserStory) => us.id));
      // Available stories are those in the same project, not assigned to *any* sprint (sprintId is null)
      // OR those currently assigned to THIS sprint (so they can be unassigned)
      setAvailableUserStories(allProjectStories.filter(us => us.sprintId === null || us.sprintId === sprint.id));
  }

  const openAssignStoriesModal = async (sprint: Sprint) => {
    setSelectedSprintForAssignment(sprint);
    setIsLoading(true); setError(null);
    try {
      await fetchProjectAndSprintStories(sprint);
      setShowAssignStoriesModal(true);
    } catch (e) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleStoryAssignmentChange = async (storyId: number, isAssigning: boolean) => {
    if (!selectedSprintForAssignment) return;
    setIsLoading(true); setError(null);
    const currentSprintId = selectedSprintForAssignment.id;
    try {
      let response;
      if (isAssigning) {
        response = await fetch(`/api/sprints/${currentSprintId}/user-stories`, {
          method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ userStoryId: storyId })
        });
      } else {
         response = await fetch(`/api/sprints/${currentSprintId}/user-stories/${storyId}`, { method: "DELETE" });
      }
       if (!response.ok) throw new Error((await response.json()).error || `Failed to ${isAssigning ? 'assign' : 'unassign'} story`);

      await fetchProjectAndSprintStories(selectedSprintForAssignment); // Refresh lists in modal
    } catch (e) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Sprints</h1>
        {canManageSprints && selectedProjectId && (
          <button onClick={openCreateSprintModal} class="btn-primary" disabled={isLoading}>
            <MaterialSymbol icon="add" className="mr-1" /> Create Sprint
          </button>
        )}
      </div>
      <div>
        <label htmlFor="project-select-sprint-page" class="block text-sm font-medium">Select Project:</label>
        <select
          id="project-select-sprint-page"
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

      {!isLoading && !error && selectedProjectId && currentSprints.length === 0 && (
        <p class="text-center py-4">No sprints found for this project. {canManageSprints ? "Create one!" : ""}</p>
      )}
      {!isLoading && !error && selectedProjectId && currentSprints.length > 0 && (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentSprints.map(sprint => (
            <div key={sprint.id} class="card bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{sprint.name}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Status: <span class={`px-2 py-0.5 text-xs rounded-full font-semibold ${sprint.status === PLANNED ? 'bg-blue-100 text-blue-700' : sprint.status === ACTIVE ? 'bg-green-100 text-green-700' : sprint.status === COMPLETED ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{sprint.status}</span></p>
              {/* Placeholder for story count/points - requires fetching stories per sprint or aggregating */}
              {canManageSprints && (
                <div class="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openEditSprintModal(sprint)} class="btn-secondary btn-sm" disabled={isLoading}>Edit</button>
                  <button onClick={() => handleDeleteSprint(sprint)} class="btn-danger btn-sm" disabled={isLoading}>Delete</button>
                  <button onClick={() => openAssignStoriesModal(sprint)} class="btn-info btn-sm" disabled={isLoading}>Manage Stories</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateEditModal && (
        <Modal show={showCreateEditModal} onClose={() => !isLoading && setShowCreateEditModal(false)} maxWidth="lg">
          <form onSubmit={handleSprintFormSubmit} class="p-6 space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{editingSprint ? "Edit Sprint" : "Create Sprint"}</h2>
            <div>
              <label htmlFor="sprint-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span class="text-red-500">*</span></label>
              <input type="text" name="name" id="sprint-name" value={sprintFormData.name || ""} onInput={handleSprintFormInputChange} required disabled={isLoading} class="mt-1 input-field w-full" />
            </div>
            <div>
              <label htmlFor="sprint-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea name="description" id="sprint-description" value={sprintFormData.description || ""} onInput={handleSprintFormInputChange} rows={3} disabled={isLoading} class="mt-1 input-field w-full"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sprint-startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date <span class="text-red-500">*</span></label>
                <input type="date" name="startDate" id="sprint-startDate" value={sprintFormData.startDate?.toString() || ""} onInput={handleSprintFormInputChange} required disabled={isLoading} class="mt-1 input-field w-full" />
              </div>
              <div>
                <label htmlFor="sprint-endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date <span class="text-red-500">*</span></label>
                <input type="date" name="endDate" id="sprint-endDate" value={sprintFormData.endDate?.toString() || ""} onInput={handleSprintFormInputChange} required disabled={isLoading} class="mt-1 input-field w-full" />
              </div>
            </div>
            <div>
              <label htmlFor="sprint-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status <span class="text-red-500">*</span></label>
              <select name="status" id="sprint-status" value={sprintFormData.status || PLANNED} onChange={handleSprintFormInputChange} required disabled={isLoading} class="mt-1 input-field w-full">
                {SPRINT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setShowCreateEditModal(false)} disabled={isLoading} class="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} class="btn-primary">
                {isLoading ? "Saving..." : (editingSprint ? "Save Changes" : "Create Sprint")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAssignStoriesModal && selectedSprintForAssignment && (
        <Modal show={showAssignStoriesModal} onClose={() => !isLoading && setShowAssignStoriesModal(false)} maxWidth="3xl">
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Manage User Stories for: {selectedSprintForAssignment.name}</h2>
            {error && <div class="alert-danger mb-4">{error}</div>}
            {isLoading && <div class="text-center py-4">Loading stories...</div>}
            {!isLoading &&
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Available Stories (Backlog / Other Sprints)</h3>
                  <ul class="h-64 overflow-y-auto border rounded p-2 dark:border-gray-600 space-y-1 bg-gray-50 dark:bg-gray-700">
                    {availableUserStories.filter(us => us.sprintId !== selectedSprintForAssignment.id).map(us => (
                      <li key={us.id} class="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
                        <span>{us.title} (SP: {us.storyPoints || 'N/A'}) {us.sprintId ? '(In another sprint)' : '(Backlog)'}</span>
                        <button onClick={() => handleStoryAssignmentChange(us.id, true)} disabled={isLoading} class="btn-primary btn-xs">Assign <MaterialSymbol icon="arrow_forward" size="sm"/></button>
                      </li>
                    ))}
                    {availableUserStories.filter(us => us.sprintId !== selectedSprintForAssignment.id).length === 0 && !isLoading && <p class="text-sm text-gray-500 dark:text-gray-400 p-2">No available stories.</p>}
                  </ul>
                </div>
                <div>
                  <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Stories in this Sprint</h3>
                  <ul class="h-64 overflow-y-auto border rounded p-2 dark:border-gray-600 space-y-1 bg-gray-50 dark:bg-gray-700">
                    {assignedUserStories.map(us => (
                      <li key={us.id} class="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
                        <button onClick={() => handleStoryAssignmentChange(us.id, false)} disabled={isLoading} class="btn-danger btn-xs"><MaterialSymbol icon="arrow_back" size="sm"/> Unassign</button>
                        <span>{us.title} (SP: {us.storyPoints || 'N/A'})</span>
                      </li>
                    ))}
                    {assignedUserStories.length === 0 && !isLoading && <p class="text-sm text-gray-500 dark:text-gray-400 p-2">No stories assigned to this sprint.</p>}
                  </ul>
                </div>
              </div>
            }
            <div class="flex justify-end mt-6">
              <button type="button" onClick={() => setShowAssignStoriesModal(false)} disabled={isLoading} class="btn-secondary">Done</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
