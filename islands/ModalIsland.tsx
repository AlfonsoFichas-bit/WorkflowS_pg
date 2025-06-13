import { useEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import { cn } from "../utils/hooks.ts";

interface ModalProps {
  show: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeable?: boolean;
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
}

export default function ModalIsland({
  show = false,
  maxWidth = "2xl",
  closeable = true,
  onClose,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showSlot, setShowSlot] = useState(show);

  // Manejar cambios en la propiedad show
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      setShowSlot(true);
      dialogRef.current?.showModal();
    } else {
      document.body.style.overflow = "";
      setTimeout(() => {
        dialogRef.current?.close();
        setShowSlot(false);
      }, 200);
    }
  }, [show]);

  // Función para cerrar el modal
  const close = () => {
    if (closeable) {
      onClose();
    }
  };

  // Agregar y eliminar event listeners
  useEffect(() => {
    // Manejar cierre con tecla Escape
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (show && closeable) {
          onClose();
        }
      }
    };
    
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [show, closeable, onClose]);

  // Determinar la clase de ancho máximo
  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  }[maxWidth];

  return (
    <dialog
      className="z-50 m-0 min-h-full min-w-full overflow-y-auto bg-transparent backdrop:bg-transparent"
      ref={dialogRef}
    >
      <div className="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50">
        {/* Overlay con animación */}
        <button
          type="button"
          className={cn(
            "fixed inset-0 transform transition-all duration-300 ease-in-out border-0 p-0 m-0 bg-transparent",
            show ? "opacity-100" : "opacity-0"
          )}
          onClick={close}
          aria-label="Cerrar modal"
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75" />
        </button>

        {/* Contenido del modal con animación */}
        <div
          className={cn(
            "mb-6 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all sm:w-full sm:mx-auto", // Added dark:bg-gray-800
            maxWidthClass,
            show
              ? "opacity-100 translate-y-0 sm:scale-100"
              : "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            "duration-300 ease-in-out"
          )}
        >
          {showSlot && children}
        </div>
      </div>
    </dialog>
  );
}
