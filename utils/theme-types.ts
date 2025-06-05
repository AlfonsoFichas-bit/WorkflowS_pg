// Declaración de tipos para las funciones globales de tema
declare global {
  interface Window {
    themeUtils?: {
      toggleTheme: () => void;
      applyDarkTheme: () => void;
      applyLightTheme: () => void;
      initTheme: () => void;
    };
  }
}

export {};