import { JSX } from "preact";
import { cn } from "../utils/hooks.ts";

interface MaterialSymbolProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  icon: string;
  fill?: 0 | 1;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  className?: string;
}

/**
 * Componente para renderizar iconos de Material Symbols con control sobre los ejes de la fuente variable
 * 
 * @param icon - Nombre del icono de Material Symbols
 * @param fill - Eje FILL (0 o 1)
 * @param weight - Eje wght (100-700)
 * @param grade - Eje GRAD (-25, 0, 200)
 * @param opticalSize - Eje opsz (20, 24, 40, 48)
 * @param className - Clases CSS adicionales
 * @param props - Otras propiedades HTML para el span
 */
export function MaterialSymbol({
  icon,
  fill = 0,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  className,
  ...props
}: MaterialSymbolProps) {
  // Construir el estilo para los ejes de la fuente variable
  const fontVariationSettings = `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`;

  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{ fontVariationSettings }}
      {...props}
    >
      {icon}
    </span>
  );
}