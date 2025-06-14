import { useState, useEffect } from "preact/hooks";
import { type Signal, signal } from "@preact/signals";
import type { User } from "../../src/db/schema/users.ts";
import type { ProjectWithRelations } from "../../src/db/queries/projects.ts";
import type { Milestone } from "../../src/db/schema/milestones.ts";
import type { RubricWithRelations } from "../../src/db/queries/rubrics.ts";
import type { UserStory } from "../../src/db/schema/userStories.ts";

// Define more specific types for form data if needed
interface MilestoneFormData {
  id?: number;
  name: string;
  description?: string;
  deadline: string; // Store as ISO string (yyyy-MM-dd)
  rubricId?: number | null;
  status?: string; // Or a specific status enum/type
  linkedUserStoryIds?: number[];
}

interface MilestonesManagementIslandProps {
  project: ProjectWithRelations;
  initialMilestones: Milestone[];
  allRubrics: RubricWithRelations[];
  projectUserStories: UserStory[];
  currentUser: User;
  projectId: number;
}

// Helper to format date for input type="date"
const formatDateForInput = (date?: Date | string): string => {
  if (!date) return "";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch (e) {
    return ""; // Handle invalid date strings gracefully
  }
};


export default function MilestonesManagementIsland({
  project,
  initialMilestones,
  allRubrics,
  projectUserStories,
  currentUser,
  projectId,
}: MilestonesManagementIslandProps) {
  const [currentMilestones, setCurrentMilestones] = useState<Milestone[]>(initialMilestones);
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState<MilestoneFormData>({
    name: "",
    deadline: "",
    description: "",
    rubricId: null,
    status: "PENDING",
    linkedUserStoryIds: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMilestones(initialMilestones);
  }, [initialMilestones]);

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      if (!response.ok) throw new Error("Failed to fetch milestones");
      const data: Milestone[] = await response.json();
      setCurrentMilestones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMilestone(null);
    setMilestoneFormData({
      name: "",
      deadline: "",
      description: "",
      rubricId: null,
      status: "PENDING",
      linkedUserStoryIds: [],
    });
    setShowModal(true);
    setError(null);
  };

  const handleOpenEditModal = async (milestone: Milestone) => {
    setEditingMilestone(milestone);
    // Fetch full details for editing, especially linked user stories
    setIsLoading(true);
    try {
        const res = await fetch(`/api/milestones/${milestone.id}`);
        if (!res.ok) throw new Error(`Failed to fetch milestone details: ${res.statusText}`);
        const detailedMilestone = await res.json();

        setMilestoneFormData({
            id: detailedMilestone.id,
            name: detailedMilestone.name,
            description: detailedMilestone.description || "",
            deadline: formatDateForInput(detailedMilestone.deadline),
            rubricId: detailedMilestone.rubric?.id || null,
            status: detailedMilestone.status,
            linkedUserStoryIds: detailedMilestone.userStories?.map((us: UserStory) => us.id) || [],
        });
        setShowModal(true);
        setError(null);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete milestone");
      }
      setCurrentMilestones(currentMilestones.filter((m) => m.id !== milestoneId));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormInputChange = (e: Event) => {
    const { name, value, type } = e.target as HTMLInputElement;
     if (type === "checkbox" && name === "linkedUserStoryIds") {
      const checked = (e.target as HTMLInputElement).checked;
      const usId = parseInt(value, 10);
      setMilestoneFormData((prev) => ({
        ...prev,
        linkedUserStoryIds: checked
          ? [...(prev.linkedUserStoryIds || []), usId]
          : (prev.linkedUserStoryIds || []).filter((id) => id !== usId),
      }));
    } else {
      setMilestoneFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseInt(value, 10) || null : value,
      }));
    }
  };

  const handleRubricChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    setMilestoneFormData((prev) => ({
        ...prev,
        rubricId: value ? parseInt(value,10) : null,
    }));
  };


  const handleFormSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const apiPath = editingMilestone
      ? `/api/milestones/${editingMilestone.id}`
      : `/api/projects/${projectId}/milestones`;
    const method = editingMilestone ? "PUT" : "POST";

    const payload = {
      ...milestoneFormData,
      deadline: new Date(milestoneFormData.deadline).toISOString(), // Ensure ISO string for backend
      rubricId: milestoneFormData.rubricId === 0 ? null : milestoneFormData.rubricId, // Handle 0 as null if needed
    };
    // Do not send linkedUserStoryIds directly with milestone creation/update in this separated API design.
    // It will be handled by a subsequent call.
    const { linkedUserStoryIds, ...milestonePayload } = payload;


    try {
      // 1. Create or Update Milestone
      const response = await fetch(apiPath, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestonePayload),
      });
      const milestoneResult = await response.json();
      if (!response.ok) {
        throw new Error(milestoneResult.error || `Failed to ${editingMilestone ? 'update' : 'create'} milestone`);
      }

      const newOrUpdatedMilestoneId = milestoneResult.id;

      // 2. Update User Story Links (if any selected)
      if (newOrUpdatedMilestoneId && linkedUserStoryIds !== undefined) {
        const linkResponse = await fetch(`/api/milestones/${newOrUpdatedMilestoneId}/user-stories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userStoryIds: linkedUserStoryIds }),
        });
        if (!linkResponse.ok) {
            const linkError = await linkResponse.json();
            throw new Error(linkError.error || "Failed to link user stories");
        }
      }

      setShowModal(false);
      await fetchMilestones(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {isLoading && <div class="text-center py-4">Loading...</div>}

      <button
        onClick={handleOpenCreateModal}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        Create New Milestone
      </button>

      {/* Table of Milestones */}
      <div class="overflow-x-auto shadow-md sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubric</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {currentMilestones.map((milestone) => (
              <tr key={milestone.id}>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{milestone.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateForInput(milestone.deadline)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{milestone.status}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {milestone.rubricId ? allRubrics.find(r => r.id === milestone.rubricId)?.name || 'N/A' : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenEditModal(milestone)} class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  <button onClick={() => handleDeleteMilestone(milestone.id)} class="text-red-600 hover:text-red-900">Delete</button>
                  {/* Add link to submissions/evaluations page later */}
                  <a href={`/dashboard/projects/${projectId}/milestones/${milestone.id}/submissions`} class="text-green-600 hover:text-green-900 ml-3">
                    Submissions
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit Milestone */}
      {showModal && (
        <div class="fixed z-10 inset-0 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
              <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleFormSubmit}>
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingMilestone ? "Edit Milestone" : "Create New Milestone"}
                  </h3>
                  {error && <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
                  <div class="mb-4">
                    <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" id="name" value={milestoneFormData.name} onChange={handleFormInputChange} required class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2"/>
                  </div>
                  <div class="mb-4">
                    <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" id="description" value={milestoneFormData.description || ""} onChange={handleFormInputChange} rows={3} class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2"></textarea>
                  </div>
                  <div class="mb-4">
                    <label for="deadline" class="block text-sm font-medium text-gray-700">Deadline</label>
                    <input type="date" name="deadline" id="deadline" value={milestoneFormData.deadline} onChange={handleFormInputChange} required class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2"/>
                  </div>
                  <div class="mb-4">
                    <label for="rubricId" class="block text-sm font-medium text-gray-700">Rubric (Optional)</label>
                    <select name="rubricId" id="rubricId" value={milestoneFormData.rubricId || ""} onChange={handleRubricChange} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option value="">-- Select a Rubric --</option>
                      {allRubrics.map(rubric => (
                        <option key={rubric.id} value={rubric.id}>{rubric.name}</option>
                      ))}
                    </select>
                  </div>
                   <div class="mb-4">
                    <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" id="status" value={milestoneFormData.status || "PENDING"} onChange={handleFormInputChange} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="PENDING">Pending</option>
                        <option value="OPEN">Open</option>
                        <option value="CLOSED">Closed</option>
                        <option value="EVALUATING">Evaluating</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Link User Stories</label>
                    <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {projectUserStories.map(us => (
                            <div key={us.id} class="flex items-center">
                                <input
                                    id={`us-${us.id}`}
                                    name="linkedUserStoryIds"
                                    type="checkbox"
                                    value={us.id.toString()}
                                    checked={(milestoneFormData.linkedUserStoryIds || []).includes(us.id)}
                                    onChange={handleFormInputChange}
                                    class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor={`us-${us.id}`} class="ml-2 block text-sm text-gray-900">
                                    {us.title} (ID: {us.id})
                                </label>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={isLoading} class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                    {isLoading ? "Saving..." : "Save Milestone"}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
