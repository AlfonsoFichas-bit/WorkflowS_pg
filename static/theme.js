// Función para aplicar el tema oscuro
function applyDarkTheme() {
  // Añadir clase dark al html
  document.documentElement.classList.add('dark');
  
  // Aplicar estilos directamente a elementos clave
  document.documentElement.style.backgroundColor = "#111827";
  document.documentElement.style.color = "#e5e7eb";
  document.body.style.backgroundColor = "#111827";
  
  // Aplicar estilos a elementos específicos
  applyStylesToDarkElements();
  
  // Guardar preferencia
  localStorage.setItem('theme', 'dark');
  
  console.log("Tema oscuro aplicado");
}

// Función para aplicar el tema claro
function applyLightTheme() {
  // Quitar clase dark del html
  document.documentElement.classList.remove('dark');
  
  // Aplicar estilos directamente a elementos clave
  document.documentElement.style.backgroundColor = "#ffffff";
  document.documentElement.style.color = "#374151";
  document.body.style.backgroundColor = "#ffffff";
  
  // Aplicar estilos a elementos específicos
  applyStylesToLightElements();
  
  // Guardar preferencia
  localStorage.setItem('theme', 'light');
  
  console.log("Tema claro aplicado");
}

// Función para aplicar estilos a elementos específicos en modo oscuro
function applyStylesToDarkElements() {
  // Aplicar estilos a elementos con clases específicas
  document.querySelectorAll('.bg-gray-50').forEach(el => {
    el.style.backgroundColor = "#111827";
  });
  
  document.querySelectorAll('.bg-white').forEach(el => {
    el.style.backgroundColor = "#1f2937";
  });
  
  document.querySelectorAll('.dark\\:bg-gray-800').forEach(el => {
    el.style.backgroundColor = "#1f2937";
  });
  
  document.querySelectorAll('.dark\\:bg-gray-900').forEach(el => {
    el.style.backgroundColor = "#111827";
  });
  
  document.querySelectorAll('.dark\\:text-gray-200').forEach(el => {
    el.style.color = "#e5e7eb";
  });
  
  document.querySelectorAll('.dark\\:text-gray-300').forEach(el => {
    el.style.color = "#d1d5db";
  });
  
  document.querySelectorAll('.dark\\:text-gray-400').forEach(el => {
    el.style.color = "#9ca3af";
  });
  
  // Aplicar estilos a elementos con clases de borde
  document.querySelectorAll('.border-gray-200').forEach(el => {
    el.style.borderColor = "#374151";
  });
  
  document.querySelectorAll('.dark\\:border-gray-700').forEach(el => {
    el.style.borderColor = "#374151";
  });
}

// Función para aplicar estilos a elementos específicos en modo claro
function applyStylesToLightElements() {
  // Aplicar estilos a elementos con clases específicas
  document.querySelectorAll('.bg-gray-50').forEach(el => {
    el.style.backgroundColor = "#f9fafb";
  });
  
  document.querySelectorAll('.bg-white').forEach(el => {
    el.style.backgroundColor = "#ffffff";
  });
  
  document.querySelectorAll('.dark\\:bg-gray-800').forEach(el => {
    el.style.backgroundColor = "#ffffff";
  });
  
  document.querySelectorAll('.dark\\:bg-gray-900').forEach(el => {
    el.style.backgroundColor = "#f9fafb";
  });
  
  document.querySelectorAll('.text-gray-700').forEach(el => {
    el.style.color = "#374151";
  });
  
  document.querySelectorAll('.dark\\:text-gray-200').forEach(el => {
    el.style.color = "#374151";
  });
  
  document.querySelectorAll('.dark\\:text-gray-300').forEach(el => {
    el.style.color = "#374151";
  });
  
  document.querySelectorAll('.dark\\:text-gray-400').forEach(el => {
    el.style.color = "#6b7280";
  });
  
  // Aplicar estilos a elementos con clases de borde
  document.querySelectorAll('.border-gray-200').forEach(el => {
    el.style.borderColor = "#e5e7eb";
  });
  
  document.querySelectorAll('.dark\\:border-gray-700').forEach(el => {
    el.style.borderColor = "#e5e7eb";
  });
}

// Función para alternar el tema
function toggleTheme() {
  if (document.documentElement.classList.contains('dark')) {
    applyLightTheme();
  } else {
    applyDarkTheme();
  }
}

// Función para inicializar el tema
function initTheme() {
  // Verificar si hay un tema guardado en localStorage
  const savedTheme = localStorage.getItem('theme');
  
  // Verificar preferencia del sistema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Aplicar tema
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    applyDarkTheme();
  } else {
    applyLightTheme();
  }
  
  // Detectar cambios en la preferencia del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // Solo cambiar automáticamente si no hay preferencia guardada
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
    }
  });
  
  // Aplicar estilos después de que el DOM esté completamente cargado
  document.addEventListener('DOMContentLoaded', () => {
    // Esperar un momento para asegurarse de que todos los elementos estén renderizados
    setTimeout(() => {
      if (document.documentElement.classList.contains('dark')) {
        applyStylesToDarkElements();
      } else {
        applyStylesToLightElements();
      }
    }, 100);
  });
  
  // Observar cambios en el DOM para aplicar estilos a nuevos elementos
  const observer = new MutationObserver((mutations) => {
    if (document.documentElement.classList.contains('dark')) {
      applyStylesToDarkElements();
    } else {
      applyStylesToLightElements();
    }
  });
  
  // Iniciar observación del DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Exponer funciones globalmente
window.themeUtils = {
  toggleTheme,
  applyDarkTheme,
  applyLightTheme,
  initTheme
};

// Inicializar tema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});