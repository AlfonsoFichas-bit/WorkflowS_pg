import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WorkflowS</title>
        <link rel="stylesheet" href="/styles.css" />
        {/* Material Symbols de Google */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        
        {/* Script para inicializar el tema (versión inline para evitar parpadeo) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Inicializar tema inmediatamente para evitar parpadeo
            (function() {
              const savedTheme = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              
              if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                // Aplicar tema oscuro
                document.documentElement.classList.add('dark');
                document.documentElement.style.backgroundColor = "#111827";
                document.documentElement.style.color = "#e5e7eb";
                document.body.style.backgroundColor = "#111827";
                
                // Aplicar estilos específicos para el tema oscuro
                setTimeout(() => {
                  document.querySelectorAll('.bg-gray-50, .dark\\\\:bg-gray-900').forEach(el => {
                    el.style.backgroundColor = "#111827";
                  });
                  
                  document.querySelectorAll('.bg-white, .dark\\\\:bg-gray-800').forEach(el => {
                    el.style.backgroundColor = "#1f2937";
                  });
                }, 0);
              } else {
                // Aplicar tema claro
                document.documentElement.classList.remove('dark');
                document.documentElement.style.backgroundColor = "#ffffff";
                document.documentElement.style.color = "#374151";
                document.body.style.backgroundColor = "#ffffff";
                
                // Aplicar estilos específicos para el tema claro
                setTimeout(() => {
                  document.querySelectorAll('.bg-gray-50').forEach(el => {
                    el.style.backgroundColor = "#f9fafb";
                  });
                  
                  document.querySelectorAll('.bg-white').forEach(el => {
                    el.style.backgroundColor = "#ffffff";
                  });
                }, 0);
              }
            })();
          `,
        }} />
        
        {/* Script principal de tema */}
        <script src="/theme.js"></script>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
