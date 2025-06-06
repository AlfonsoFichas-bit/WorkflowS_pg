import { useState } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";

interface CreateUserFormProps {
  onSubmit: (userData: {
    name: string;
    paternalLastName: string;
    maternalLastName: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CreateUserFormIsland({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateUserFormProps) {
  const [name, setName] = useState("");
  const [paternalLastName, setPaternalLastName] = useState("");
  const [maternalLastName, setMaternalLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("team_developer");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!paternalLastName.trim()) {
      newErrors.paternalLastName = "El apellido paterno es obligatorio";
    }

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "El correo electrónico no es válido";
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name,
        paternalLastName,
        maternalLastName,
        email,
        password,
        role,
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Nombre
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.name ? "border-red-500" : ""
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="paternalLastName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Apellido Paterno
          </label>
          <div className="mt-1">
            <input
              id="paternalLastName"
              name="paternalLastName"
              type="text"
              required
              value={paternalLastName}
              onChange={(e) => setPaternalLastName((e.target as HTMLInputElement).value)}
              className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.paternalLastName ? "border-red-500" : ""
              }`}
            />
            {errors.paternalLastName && (
              <p className="mt-1 text-sm text-red-600">{errors.paternalLastName}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="maternalLastName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Apellido Materno
          </label>
          <div className="mt-1">
            <input
              id="maternalLastName"
              name="maternalLastName"
              type="text"
              value={maternalLastName}
              onChange={(e) => setMaternalLastName((e.target as HTMLInputElement).value)}
              className="block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Correo electrónico
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.email ? "border-red-500" : ""
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Contraseña
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.password ? "border-red-500" : ""
            }`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={togglePasswordVisibility}
          >
            <MaterialSymbol
              icon={showPassword ? "visibility_off" : "visibility"}
              className="h-5 w-5 text-gray-400"
            />
          </button>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirmar contraseña
        </label>
        <div className="mt-1 relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword((e.target as HTMLInputElement).value)
            }
            className={`block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.confirmPassword ? "border-red-500" : ""
            }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Rol
        </label>
        <div className="mt-1">
          <div className="block w-full p-2.5 rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            Team Developer
          </div>
          <input type="hidden" name="role" value="team_developer" />
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
            "Guardar"
          )}
        </button>
      </div>
    </form>
  );
}