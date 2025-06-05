import type { JSX } from "preact";
import ModalIsland from "../islands/ModalIsland.tsx";

interface ModalProps {
  show: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeable?: boolean;
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
}

// Este componente es un wrapper para ModalIsland
// Permite usar el componente Modal en los componentes importados
export default function Modal({
  show,
  maxWidth = "2xl",
  closeable = true,
  onClose,
  children,
}: ModalProps) {
  return (
    <ModalIsland
      show={show}
      maxWidth={maxWidth}
      closeable={closeable}
      onClose={onClose}
    >
      {children}
    </ModalIsland>
  );
}