import { useEffect, useState } from "preact/hooks";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import "../utils/theme-types.ts";

interface ThemeUtils {
	applyDarkTheme: () => void;
	applyLightTheme: () => void;
}

export default function ThemeSwitchIsland() {
	// Estado para controlar si el tema es oscuro
	const [isDarkMode, setIsDarkMode] = useState(false);

	const toggleTheme = () => {
		const newIsDark = !isDarkMode;
		setIsDarkMode(newIsDark);

		console.log(
			"ThemeSwitchIsland: Cambiando a tema:",
			newIsDark ? "oscuro" : "claro",
		);

		if (newIsDark) {
			if (
				typeof globalThis !== "undefined" &&
				(globalThis as unknown as { themeUtils?: ThemeUtils }).themeUtils
			) {
				(
					globalThis as unknown as { themeUtils: ThemeUtils }
				).themeUtils.applyDarkTheme();
			} else {
				document.documentElement.classList.add("dark");
				localStorage.setItem("theme", "dark");
				applyDarkStyles();
			}
		} else {
			if (
				typeof globalThis !== "undefined" &&
				(globalThis as unknown as { themeUtils?: ThemeUtils }).themeUtils
			) {
				(
					globalThis as unknown as { themeUtils: ThemeUtils }
				).themeUtils.applyLightTheme();
			} else {
				document.documentElement.classList.remove("dark");
				localStorage.setItem("theme", "light");
				applyLightStyles();
			}
		}
	};

	// Efecto para detectar el tema actual al montar el componente
	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = globalThis.matchMedia?.(
			"(prefers-color-scheme: dark)",
		).matches;
		const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);
		setIsDarkMode(initialDark);
	}, []);

	// Función para aplicar estilos claros (fallback)
	const applyLightStyles = () => {
		// Aplicar estilos claros a elementos clave
		document.documentElement.style.backgroundColor = "#ffffff";
		document.body.style.backgroundColor = "#ffffff";

		// Aplicar clases de Tailwind directamente
		document.documentElement.classList.remove("dark");

		// Forzar actualización de colores en elementos específicos
		document
			.querySelectorAll(".bg-gray-50, .dark\\:bg-gray-900")
			.forEach((el) => {
				(el as HTMLElement).style.backgroundColor = "#f9fafb";
			});

		document
			.querySelectorAll(".bg-white, .dark\\:bg-gray-800")
			.forEach((el) => {
				(el as HTMLElement).style.backgroundColor = "#ffffff";
			});

		document
			.querySelectorAll(".text-gray-700, .dark\\:text-gray-200")
			.forEach((el) => {
				(el as HTMLElement).style.color = "#374151";
			});
	};

	// Función para aplicar estilos oscuros (fallback)
	const applyDarkStyles = () => {
		// Aplicar estilos oscuros a elementos clave
		document.documentElement.style.backgroundColor = "#111827";
		document.body.style.backgroundColor = "#111827";

		// Aplicar clases de Tailwind directamente
		document.documentElement.classList.add("dark");

		// Forzar actualización de colores en elementos específicos
		document
			.querySelectorAll(".bg-gray-50, .dark\\:bg-gray-900")
			.forEach((el) => {
				(el as HTMLElement).style.backgroundColor = "#111827";
			});

		document
			.querySelectorAll(".bg-white, .dark\\:bg-gray-800")
			.forEach((el) => {
				(el as HTMLElement).style.backgroundColor = "#1f2937";
			});

		document
			.querySelectorAll(".text-gray-700, .dark\\:text-gray-200")
			.forEach((el) => {
				(el as HTMLElement).style.color = "#e5e7eb";
			});
	};

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
