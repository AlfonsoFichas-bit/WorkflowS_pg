import { useEffect, useState } from "preact/hooks";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import "../utils/theme-types.ts";

export default function ThemeSwitchIsland() {
  // Estado para controlar si el tema es oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Estado para controlar si el componente está montado
  const [isMounted, setIsMounted] = useState(false);

  // Efecto para detectar el tema actual al montar el componente
  useEffect(() => {
    // Marcar el componente como montado
    setIsMounted(true);
    
    // Verificar el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Verificar si el tema oscuro está aplicado en el DOM
    const isDark = document.documentElement.classList.contains("dark");
    
    // Sincronizar el estado con el tema actual
    setIsDarkMode(isDark);
    
    // Asegurarse de que el localStorage y las clases del DOM estén sincronizados
    if (savedTheme === 'dark' && !isDark) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else if (savedTheme === 'light' && isDark) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
    
    // Forzar la aplicación de estilos según el tema actual
    setTimeout(() => {
      if (isDark) {
        document.querySelectorAll('.min-h-screen').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#111827";
        });
        
        document.querySelectorAll('.bg-white, .dark\\:bg-gray-800').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#1f2937";
        });
        
        document.querySelectorAll('.bg-gray-50, .dark\\:bg-gray-900').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#111827";
        });
      } else {
        document.querySelectorAll('.min-h-screen').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#f9fafb";
        });
        
        document.querySelectorAll('.bg-white').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#ffffff";
        });
        
        document.querySelectorAll('.bg-gray-50').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#f9fafb";
        });
      }
    }, 50);
    
    console.log("ThemeSwitchIsland: Tema inicial detectado:", isDark ? "oscuro" : "claro");
  }, []);

  // Función para cambiar el tema
  const toggleTheme = () => {
    // Cambiar al tema opuesto
    const newIsDark = !isDarkMode;
    
    console.log("ThemeSwitchIsland: Cambiando a tema:", newIsDark ? "oscuro" : "claro");
    
    // Actualizar el estado primero
    setIsDarkMode(newIsDark);
    
    // Usar las funciones globales de tema si están disponibles
    if (typeof window !== "undefined" && window.themeUtils) {
      if (newIsDark) {
        window.themeUtils.applyDarkTheme();
      } else {
        window.themeUtils.applyLightTheme();
      }
    } else {
      // Fallback si las funciones globales no están disponibles
      if (newIsDark) {
        // Cambiar a tema oscuro
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        applyDarkStyles();
      } else {
        // Cambiar a tema claro
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        applyLightStyles();
      }
    }
    
    // Forzar una actualización de los estilos después de un breve retraso
    setTimeout(() => {
      if (newIsDark) {
        document.querySelectorAll('.min-h-screen').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#111827";
        });
        
        document.querySelectorAll('.bg-white, .dark\\:bg-gray-800').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#1f2937";
        });
        
        document.querySelectorAll('.bg-gray-50, .dark\\:bg-gray-900').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#111827";
        });
      } else {
        document.querySelectorAll('.min-h-screen').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#f9fafb";
        });
        
        document.querySelectorAll('.bg-white').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#ffffff";
        });
        
        document.querySelectorAll('.bg-gray-50').forEach(el => {
          (el as HTMLElement).style.backgroundColor = "#f9fafb";
        });
      }
    }, 50);
  };
  
  // Función para aplicar estilos claros (fallback)
  const applyLightStyles = () => {
    // Aplicar estilos claros a elementos clave
    document.documentElement.style.backgroundColor = "#ffffff";
    document.body.style.backgroundColor = "#ffffff";
    
    // Aplicar clases de Tailwind directamente
    document.documentElement.classList.remove('dark');
    
    // Forzar actualización de colores en elementos específicos
    document.querySelectorAll('.bg-gray-50, .dark\\:bg-gray-900').forEach(el => {
      (el as HTMLElement).style.backgroundColor = "#f9fafb";
    });
    
    document.querySelectorAll('.bg-white, .dark\\:bg-gray-800').forEach(el => {
      (el as HTMLElement).style.backgroundColor = "#ffffff";
    });
    
    document.querySelectorAll('.text-gray-700, .dark\\:text-gray-200').forEach(el => {
      (el as HTMLElement).style.color = "#374151";
    });
  };
  
  // Función para aplicar estilos oscuros (fallback)
  const applyDarkStyles = () => {
    // Aplicar estilos oscuros a elementos clave
    document.documentElement.style.backgroundColor = "#111827";
    document.body.style.backgroundColor = "#111827";
    
    // Aplicar clases de Tailwind directamente
    document.documentElement.classList.add('dark');
    
    // Forzar actualización de colores en elementos específicos
    document.querySelectorAll('.bg-gray-50, .dark\\:bg-gray-900').forEach(el => {
      (el as HTMLElement).style.backgroundColor = "#111827";
    });
    
    document.querySelectorAll('.bg-white, .dark\\:bg-gray-800').forEach(el => {
      (el as HTMLElement).style.backgroundColor = "#1f2937";
    });
    
    document.querySelectorAll('.text-gray-700, .dark\\:text-gray-200').forEach(el => {
      (el as HTMLElement).style.color = "#e5e7eb";
    });
  };

  // No renderizar nada hasta que el componente esté montado para evitar problemas de hidratación
  if (!isMounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label={isDarkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDarkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {isDarkMode ? (
        <MaterialSymbol 
          icon="light_mode" 
          className="text-yellow-500" 
          fill={1} 
          weight={500}
          opticalSize={24}
        />
      ) : (
        <MaterialSymbol 
          icon="dark_mode" 
          className="text-gray-700 dark:text-gray-300" 
          fill={1} 
          weight={500}
          opticalSize={24}
        />
      )}
    </button>
  );
}