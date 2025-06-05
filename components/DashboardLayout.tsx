import { ComponentChildren } from "preact";
import SidebarIsland from "../islands/SidebarIsland.tsx";

interface DashboardLayoutProps {
  children: ComponentChildren;
  user?: {
    name: string;
    email: string;
    role: string;
    formattedRole?: string;
  };
}

export function DashboardLayout({
  children,
  user = { name: "Usuario", email: "usuario@example.com", role: "team_developer", formattedRole: "Team Developer" }
}: DashboardLayoutProps) {
  return (
    <div id="dashboard-container" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <SidebarIsland user={user} />

      {/* El main se ajustará automáticamente gracias a las clases CSS que añadimos */}
      <main class="transition-all duration-300 ease-in-out ml-0 pt-16 md:pt-0">
        <div class="p-6 transition-all duration-300 ease-in-out">
          {children}
        </div>
      </main>
    </div>
  );
}