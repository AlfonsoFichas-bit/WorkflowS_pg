import { useState, useEffect } from "preact/hooks";
import { cn, useIsMobile } from "../utils/hooks.ts";
import ThemeSwitchIsland from "./ThemeSwitchIsland.tsx";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";

// Navigation items
const navItems = [
  {
    title: "Panel Principal",
    href: "/dashboard",
    iconName: "dashboard",
  },
  {
    title: "Proyectos",
    href: "/dashboard/projects",
    iconName: "folder",
  },
  {
    title: "Historias de Usuario",
    href: "/dashboard/user-stories",
    iconName: "auto_stories",
  },
  {
    title: "Tablero Kanban",
    href: "/dashboard/kanban",
    iconName: "view_kanban",
  },
  {
    title: "Sprints",
    href: "/dashboard/sprints",
    iconName: "sprint", // Or 'track_changes', 'autorenew'
  },
  {
    title: "Tareas",
    href: "/dashboard/tasks",
    iconName: "task",
  },
  {
    title: "Tablero Kanban de Tareas",
    href: "/dashboard/tasks/kanban",
    iconName: "view_week",
  },
  {
    title: "Equipo",
    href: "/dashboard/team",
    iconName: "group",
  },
  {
    title: "Usuarios",
    href: "/dashboard/users",
    iconName: "person",
  },
  {
    title: "Iconos",
    href: "/dashboard/icons",
    iconName: "palette",
  },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    formattedRole?: string;
  };
}

export default function SidebarIsland({
  user = {
    name: "Usuario",
    email: "usuario@example.com",
    role: "team_developer",
    formattedRole: "Team Developer"
  }
}: SidebarProps) {
  // Inicializar el estado de colapso desde localStorage si existe
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebarCollapsed");
      return savedState === "true";
    }
    return false;
  });

  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Efecto para inicializar el estado del sidebar cuando se carga la página
  useEffect(() => {
    // Verificar el estado inicial del sidebar
    const savedState = localStorage.getItem("sidebarCollapsed");
    const isInitiallyCollapsed = savedState === "true";

    // Aplicar la clase al body
    if (isInitiallyCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }

    // Aplicar estilos al contenido principal
    const mainElement = document.querySelector("main");
    if (mainElement) {
      if (isInitiallyCollapsed) {
        mainElement.classList.add("sidebar-collapsed-main");
        // Aplicar el estilo directamente para evitar la transición inicial
        mainElement.style.marginLeft = "4rem"; // 64px
      } else {
        mainElement.classList.remove("sidebar-collapsed-main");
        // Aplicar el estilo directamente para evitar la transición inicial
        mainElement.style.marginLeft = "16rem"; // 256px
      }
    }
  }, []);

  // Efecto para actualizar el estado de colapso en el localStorage y aplicar estilos
  useEffect(() => {
    // Guardar el estado de colapso en localStorage
    localStorage.setItem("sidebarCollapsed", isCollapsed ? "true" : "false");

    // Actualizar la clase del body para que el contenido principal se ajuste
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");

      // Aplicar estilos directamente al contenido principal
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.classList.add("sidebar-collapsed-main");
      }
    } else {
      document.body.classList.remove("sidebar-collapsed");

      // Quitar estilos del contenido principal
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.classList.remove("sidebar-collapsed-main");
      }
    }

    // Aplicar estilos con un pequeño retraso para asegurar la transición suave
    setTimeout(() => {
      const mainElement = document.querySelector("main");
      if (mainElement) {
        if (isCollapsed) {
          mainElement.style.marginLeft = "4rem"; // 64px
        } else {
          mainElement.style.marginLeft = "16rem"; // 256px
        }
      }
    }, 0);
  }, [isCollapsed]);

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md"
        >
          <MaterialSymbol icon="menu" className="icon-md" />
        </button>

        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50" 
            onClick={toggleMobileMenu}
            onKeyDown={(e) => e.key === 'Escape' && toggleMobileMenu()}
            role="button"
            tabIndex={0}
          >
            <div
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-blue-600">WorkflowS</h2>
                    <button type="button" onClick={toggleMobileMenu} className="p-2 text-gray-500">
                      <MaterialSymbol icon="close" className="icon-md" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        className="flex items-center gap-3 rounded-md p-1.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <MaterialSymbol icon={item.iconName} className="icon-md" />
                        <span>{item.title}</span>
                      </a>
                    ))}
                  </nav>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.formattedRole || user.role}</p>
                    </div>
                    <ThemeSwitchIsland />
                  </div>
                  <a
                    href="/auth/logout"
                    className="flex items-center gap-3 rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  >
                    <MaterialSymbol icon="logout" className="icon-md" fill={1} />
                    <span>Cerrar Sesión</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between transition-all duration-300 ease-in-out">
        {!isCollapsed ? (
          <h2 className="text-xl font-bold text-blue-600 transition-opacity duration-300 ease-in-out">WorkflowS</h2>
        ) : (
          <div className="w-0 opacity-0 transition-all duration-300 ease-in-out"></div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out",
            isCollapsed ? "mx-auto" : "ml-auto"
          )}
        >
          <MaterialSymbol
            icon={isCollapsed ? "chevron_right" : "chevron_left"}
            className="icon-md"
            weight={500}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md p-1.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 ease-in-out",
                isCollapsed && "justify-center px-1.5"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <MaterialSymbol 
                icon={item.iconName} 
                className={cn(
                  "icon-md transition-all duration-300 ease-in-out", 
                  isCollapsed && "icon-lg"
                )} 
                fill={item.title === "Dashboard" ? 1 : 0}
                weight={500}
              />
              {!isCollapsed && (
                <span className="transition-opacity duration-300 ease-in-out whitespace-nowrap overflow-hidden">
                  {item.title}
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out">
        {isCollapsed ? (
          <div className="flex justify-center transition-all duration-300 ease-in-out">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold transition-all duration-300 ease-in-out">
              {user.name.charAt(0)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4 transition-all duration-300 ease-in-out">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold transition-all duration-300 ease-in-out">
              {user.name.charAt(0)}
            </div>
            <div className="flex-grow transition-all duration-300 ease-in-out">
              <p className="font-medium transition-all duration-300 ease-in-out">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 ease-in-out">{user.formattedRole || user.role}</p>
            </div>
            <ThemeSwitchIsland />
          </div>
        )}
        <a
          href="/auth/logout"
          className={cn(
            "flex items-center gap-3 rounded-md p-1.5 text-red-600 hover:bg-red-50 mt-2 transition-all duration-300 ease-in-out",
            isCollapsed && "justify-center px-1.5"
          )}
          title={isCollapsed ? "Cerrar Sesión" : undefined}
        >
          <MaterialSymbol 
            icon="logout" 
            className={cn("icon-md transition-all duration-300 ease-in-out", isCollapsed && "icon-lg")} 
            fill={1}
            weight={500}
            grade={0}
          />
          {!isCollapsed && (
            <span className="transition-opacity duration-300 ease-in-out whitespace-nowrap overflow-hidden">
              Cerrar Sesión
            </span>
          )}
        </a>
      </div>
    </div>
  );
}
