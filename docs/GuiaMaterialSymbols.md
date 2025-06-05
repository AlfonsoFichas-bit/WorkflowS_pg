# Guía de símbolos de Material  |  Google Fonts  |  Google for Developers
¿Qué son los símbolos de Material?
----------------------------------

Los símbolos de Material son nuestros íconos más recientes, que consolidan más de 2,500 glifos en un único archivo de fuente con una amplia gama de variantes de diseño. Los símbolos están disponibles en tres estilos y cuatro ejes de fuentes variables ajustables (relleno, grosor, grado y tamaño óptico). Consulta el conjunto completo de símbolos de Material en el [Biblioteca de símbolos de Material](http://fonts.google.com/icons?hl=es-419).

### Eje `FILL`

El relleno te permite modificar el diseño predeterminado del ícono. Un solo icono puede renderizan estados sin completar y con relleno.

Para transmitir una transición de estado, usa el eje de relleno para animación o interacción. Los valores son 0 para la configuración predeterminada o 1 para completados completos. Junto con el peso el relleno también afecta el aspecto del ícono.

### Eje `wght`

El grosor define el grosor del trazo del símbolo, con un rango de grosores entre delgado (100) y en negrita (700). El peso también puede afectar el tamaño general de la .

### Eje `GRAD`

![Visualización del eje de calificaciones](https://www.gstatic.com/images/icons/material/apps/fonts/1x/material-symbols/grade.png)

El peso y la calificación afectan el grosor de un símbolo. Los ajustes de calificación son son más granulares que los ajustes de ponderación y tienen un pequeño impacto en el tamaño del el símbolo.

La calificación también está disponible en algunas fuentes de texto. Puedes hacer coincidir los niveles de grado entre texto y símbolos para lograr un efecto visual armonioso. Por ejemplo, si la fuente del texto tiene un valor de calificación -25, los símbolos pueden coincidir con un valor adecuado, por ejemplo, -25.

Puedes usar la calificación para diferentes necesidades:

**Énfasis bajo (p.ej., grado -25):** Para reducir el reflejo de un símbolo claro en una imagen oscura de fondo, usa un grado bajo.

**Énfasis alto (p.ej., grado 200):** para destacar un símbolo, aumenta el positivo calificación.

### Eje `opsz`

Los tamaños ópticos varían de 20 dp a 48 dp.

Para que la imagen se vea igual en diferentes tamaños, es necesario el grosor del trazo (grosor) cambia a medida que se escala el tamaño de los íconos. El tamaño óptico ofrece una forma de ajustar el grosor del trazo cuando aumentes o disminuyas el tamaño de los símbolos.

Cómo obtener símbolos de Material
---------------------------------

Los símbolos de Material están disponibles en varios formatos y son adecuados para diferentes tipos de proyectos y plataformas, tanto para los desarrolladores en sus apps como para diseñadores en sus maquetas o prototipos.

### Licencias

Los símbolos de Material están disponibles en el [Licencia de Apache versión 2.0](https://www.apache.org/licenses/LICENSE-2.0)

### Cómo navegar y descargar íconos individuales

El conjunto completo de símbolos de Material está disponible en el [Biblioteca de símbolos de Material](http://fonts.google.com/icons?hl=es-419) en formato SVG o PNG. Son adecuados para la Web, iOS y Android, o con cualquier herramientas de diseño.

### Repositorio de Git

El [Repositorio de Git](https://github.com/google/material-design-icons) contiene el conjunto completo de símbolos de Material en formato SVG.

```
$ git clone https://github.com/google/material-design-icons

```


Cómo usar símbolos de Material
------------------------------

### Uso en la Web

La fuente Material Symbols es la forma más fácil de incorporar símbolos de Material en proyectos web.

Los íconos se empaquetan en una sola fuente para que los desarrolladores web puedan incorporar estos íconos con solo unas pocas líneas de código.

#### Fuente estática con Google Fonts

La forma más fácil de configurar fuentes de íconos para usar en cualquier página web es a través de [Google Fonts](http://fonts.google.com/?hl=es-419). Incluye esta única línea de HTML:

```
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

```


El fragmento anterior incluye la configuración predeterminada para cada [eje](https://fonts.google.com/knowledge/glossary/axis_in_variable_fonts?hl=es-419) con [peso](https://fonts.google.com/knowledge/glossary/weight_axis?hl=es-419) en 400, [tamaño óptico](https://fonts.google.com/knowledge/glossary/optical_size_axis?hl=es-419) a los 48, [calificación](https://fonts.google.com/knowledge/glossary/grade_axis?hl=es-419) en 0 y [completar](https://fonts.google.com/knowledge/glossary/fill_axis?hl=es-419) (también 0).

Usa el [API de Fonts CSS](https://developers.google.com/fonts/docs/css2?hl=es-419#forming_api_urls) para configurar diferentes valores de ejes. Observa los siguientes ejemplos:

#### Fuente variable con Google Fonts

Si deseas animar iconos con CSS o deseas un control más detallado de las funciones de los iconos, usa la fuente variable Google Symbols. Mediante el uso de rangos, en el formato `number..number`, podemos cargar toda la variable de fuente. Finalizar la compra [Compatibilidad con fuentes variables de Can I Use](https://caniuse.com/variable-fonts) para comprender si tus usuarios podrán cargar la fuente variable, la mayoría más probable que sean. Estos son algunos ejemplos:

¡O incluso animarlos!

#### Alojamiento propio de la fuente

Alojar el [fuente de los íconos](https://github.com/google/material-design-icons/tree/master/variablefont) en una ubicación que puedas controlar para decidir cuándo actualizar el recurso. Para ejemplo, si la URL es `https://example.com/material-symbols.woff`, agrega el siguiente regla de CSS:

```
@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  src: url(https://example.com/material-symbols.woff) format('woff');
}

```


Para representar la fuente de manera correcta, declara las reglas de CSS para renderizar el ícono. Estos las reglas se entregan como parte de la hoja de estilo de la API de Google Fonts, pero deberá incluirse manualmente en tus proyectos cuando se aloje tú mismo:

```
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}

```


#### Cómo usar los íconos en HTML

En los ejemplos anteriores se utiliza un atributo tipográfico denominado [ligaturas](https://fonts.google.com/knowledge/glossary/ligature?hl=es-419), que permite la renderización de un glifo de ícono usando simplemente su nombre textual. El navegador web reemplaza automáticamente la ligadura de texto con el vector de icono y proporciona un código más legible que la referencia de caracteres numéricos equivalente. Para Por ejemplo, en tu código HTML, tendrás `arrow_forward` para representar un ícono, en lugar de `&#xE5C8;`. En el caso de los otros íconos, usa _mayúsculas y minúsculas_ del nombre del ícono. (es decir, reemplaza los espacios por guiones bajos).

Esta función es compatible con la mayoría de los navegadores actualizados en computadoras de escritorio y dispositivos móviles. dispositivos. Consulta [¿Puedo usar las ligaduras de soporte](https://caniuse.com/mdn-css_properties_font-variant-ligatures) para ver si los usuarios son capaces de procesar ligaduras. Lo más probable es que puedes hacerlo.

Si necesitas compatibilidad con navegadores que no admiten ligaduras, especifica la iconos con referencias de caracteres numéricos (también conocidos como puntos de código), como en el ejemplo a continuación:

Encuentra los nombres de íconos y puntos de código en la [Biblioteca de símbolos de Material](https://fonts.google.com/icons/?hl=es-419) seleccionando cualquier icono y abriendo el panel de fuentes de iconos. La fuente de cada ícono tiene un índice de puntos de código en Google Fonts [Repositorio de Git](https://github.com/google/material-design-icons/tree/master/variablefont) que muestra el conjunto completo de nombres y códigos de caracteres.

#### Cómo aplicar estilo a íconos en Material Design

Estos iconos fueron diseñados para seguir el [Lineamientos de Material Design](https://material.io/design/iconography/system-icons.html#design-principles), y se ven mejor cuando se usan los tamaños y colores recomendados para los íconos. Los estilos a continuación facilitan la aplicación de nuestros tamaños, colores y estados de actividad recomendados.

### Usar en Android

En la Biblioteca de símbolos de Material, todos los íconos tienen el formato de elementos de diseño vectoriales. Para para obtener más información, consulta la [Documentación de Android Vector Asset Studio](https://developer.android.com/studio/write/vector-asset-studio?hl=es-419#svg)

### Usar en iOS

Los íconos también están disponibles en formato de símbolos de Apple. Para obtener más información sobre ellas, echa un vistazo a la guía oficial de Apple [resumen](https://developer.apple.com/design/human-interface-guidelines/sf-symbols/overview/) y [guía de uso](https://developer.apple.com/documentation/uikit/uiimage/configuring_and_displaying_symbol_images_in_your_ui).

### Usar en Flutter

Se planifica la compatibilidad de Flutter con símbolos de Material. No te pierdas las novedades.