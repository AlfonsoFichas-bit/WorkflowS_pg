import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import { PROJECT_OWNER, SCRUM_MASTER, DEVELOPER } from "../src/types/roles.ts";

// First block of interfaces and incomplete function definition removed.

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AddUserToProjectProps {
  projectId: number;
  onSubmit: (userData: {
    userId: number;
    role: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function AddUserToProjectIsland({
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddUserToProjectProps) {
  const [userId, setUserId] = useState<number | "">("");
  const [role, setRole] = useState(DEVELOPER);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar la lista de usuarios disponibles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Pasar el projectId como parámetro para filtrar usuarios que ya son miembros
        const response = await fetch(`/dashboard/projects/available-users?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error("Error al cargar los usuarios");
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [projectId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userId) {
      newErrors.userId = "Debes seleccionar un usuario";
    }

    if (!role) {
      newErrors.role = "Debes seleccionar un rol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();

    if (validateForm() && userId !== "") {
      onSubmit({
        userId: Number(userId),
        role,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="userId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Usuario
        </label>
        <div className="mt-1">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <MaterialSymbol icon="sync" className="animate-spin mr-2" />
              Cargando usuarios...
            </div>
          ) : (
            <select
              id="userId"
              name="userId"
              value={userId}
              onChange={(e) => setUserId(Number((e.target as HTMLSelectElement).value))}
              className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.userId ? "border-red-500" : ""
              }`}
            >
              <option value="">Selecciona un usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          )}
          {errors.userId && (
            <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Rol en el Proyecto
        </label>
        <div className="mt-1">
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole((e.target as HTMLSelectElement).value)}
            className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.role ? "border-red-500" : ""
            }`}
          >
            <option value={DEVELOPER}>Developer</option>
            <option value={SCRUM_MASTER}>Scrum Master</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Nota: Este rol es específico para este proyecto y no cambia el rol global del usuario en la plataforma.
            Si el usuario ya está asignado a este proyecto, su rol será actualizado.
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <MaterialSymbol icon="sync" className="animate-spin mr-2" />
              Guardando...
            </span>
          ) : (
            "Agregar Usuario"
          )}
        </button>
      </div>
    </form>
  );
}
