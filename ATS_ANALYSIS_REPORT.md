# Reporte de Análisis ATS y Compatibilidad de CV: Daniel Bodas

Este informe proporciona un análisis detallado sobre la viabilidad, extracción de datos y compatibilidad de tu Currículum Vitae con los sistemas de seguimiento de candidatos (**ATS**, *Applicant Tracking Systems*) utilizados por departamentos de Recursos Humanos (RRHH) y plataformas de aplicación de empleo (ej. Workday, SuccessFactors, Taleo).

---

## 1. ¿Cómo extraen información de tu CV los ATS y Programas de RRHH?

Los ATS procesan los archivos subidos (generalmente PDF o Word) a través de un motor de análisis sintáctico (*CV Parser*). Este proceso se compone de tres fases secuenciales:

1. **Extracción de Texto Plano:** Convierte el archivo visual en una sola cadena de caracteres continua de arriba a abajo y de izquierda a derecha.
2. **Segmentación de Secciones:** Mediante heurística e inteligencia artificial, el sistema busca palabras clave de cabecera como *"Experience"*, *"Education"*, *"Professional Summary"*, o *"Skills"* para dividir el texto plano en bloques lógicos.
3. **Mapeo de Campos:** Identifica datos específicos dentro de cada bloque, como nombres de empresas, cargos profesionales, fechas de inicio y fin, nombres de universidades o certificaciones, direcciones de email y números de teléfono.

---

## 2. Resultados de la Simulación de Extracción (Simulador ATS)

Hemos ejecutado un simulador del parser ATS desarrollado a medida en Python (`simulate_ats.py`) sobre la base de datos estructurada de tu CV actual. Esto es exactamente lo que el sistema extrae y procesa:

### A. Información de Contacto (Contact Fields)
* **Nombre:** Daniel Bodas
* **Email:** `danielbodasromero@gmail.com`
* **Teléfono:** `(+34) 625 232 666`
* **Ubicación:** Madrid, España
* **LinkedIn:** `linkedin.com/in/danielbodas/`
* *Diagnóstico:* Excelente. Los datos están claramente individualizados y los formatos son estándares.

### B. Resumen Profesional (Profile Summary)
* *Texto Extraído:* *"Forward-thinking Aerospace Engineer combining technical aeronautical expertise with Agile product management. Specialized in rescuing and restructuring complex projects through the practical implementation of Agile methodologies..."*
* *Diagnóstico:* Es denso, preciso, y sitúa muy bien tus dos roles clave (Aerospace Engineer y Agile Product Owner).

### C. Experiencia Laboral (Work Experience Timeline)
El motor de extracción reconstruye de forma idónea las siguientes 6 experiencias:
1. **Technical Product Owner – Digital Twin / Aircraft Mock-Up** en **AIRBUS DS** (Apr 2024 – Present)
2. **Digital Transformation Leader – ILS Data Management** en **AIRBUS DS** (Jan 2022 – Apr 2024)
3. **ILS Data & Delivery Lead – MRTT** en **AIRBUS DS** (Dec 2020 – Jan 2022)
4. **In-Service Structural Support Engineer** en **AIRBUS DS** (Sept 2017 – Dec 2020)
5. **Structural Maintenance Program Engineer (MSG-3)** en **AIRBUS DS** (Jun 2016 – Sept 2017)
6. **R&D Structural Engineer** en **AERNNOVA** (Jun 2015 – Jun 2016)
* *Diagnóstico:* Las empresas están claramente identificadas, y el uso del formato `"Month Year – Month Year"` es perfecto para evitar que el ATS calcule mal la duración de tu trayectoria profesional.

### D. Educación detectada (Education & Degrees)
1. **Artificial Intelligence Nanodegree** (Udacity & AIRBUS, 2023)
2. **Data Analyst Nanodegree** (Udacity & AIRBUS, 2022)
3. **Master in Professional Development 4.0** (University of Alcala UAH, 2018)
4. **Degree in Aerospace Engineering (Aircraft Spec.)** (Technical University of Madrid UPM, 2016)

### E. Análisis de Densidad de Palabras Clave (Keywords Cloud)
Los ATS filtran candidatos calculando la coincidencia de palabras clave con la descripción de la oferta. En tu CV actual, el simulador arroja la siguiente densidad:
* **Data:** 12 menciones
* **Aerospace / Engineering:** 7 menciones de cada una
* **Agile:** 5 menciones
* **Change Management / ILS:** 4 menciones de cada una
* **Product Owner / Analytics / MRTT:** 3 menciones de cada una
* **Digital Twin / Airworthiness / R&D:** 2 menciones de cada una
* **Scrum / Kanban / Process Optimization / Python / SQL:** 1 mención de cada una

---

## 3. Puntos de Riesgo de tu CV actual frente a un ATS (Puntos Críticos)

A pesar de que el contenido es muy rico y profesional, la **arquitectura visual y técnica** del CV actual presenta riesgos que podrían causar descartes automáticos o malas lecturas:

### Riesgo 1: Estructura de doble columna (CSS Grid: Sidebar + Main)
* **El problema:** La mayoría de motores ATS antiguos o básicos leen los archivos PDF de manera horizontal lineal (de izquierda a derecha en toda la anchura de la página). Al procesar una estructura de dos columnas (barra lateral + contenido principal), el parser puede entrelazar líneas de código de ambas zonas. Por ejemplo, podría combinar la sección de idiomas de la columna izquierda con la descripción de tu puesto en Airbus de la columna derecha, arruinando la legibilidad sintáctica de ambas secciones.
* **Impacto:** Alto en plataformas heredadas (Legacy ATS).

### Riesgo 2: Foto y gráficos vectoriales SVG (`photo.svg` e Iconos)
* **El problema:** Las imágenes incrustadas dentro del PDF suelen causar que el lector ATS intente realizar un procesamiento por reconocimiento óptico de caracteres (OCR) para descifrar si hay texto dentro de ellas. Esto no solo ralentiza el procesado, sino que puede introducir "ruido" (caracteres extraños o saltos de línea incorrectos) en el texto extraído. Los iconos de contacto en SVG pueden ser procesados como caracteres extraños si el archivo no está bien vectorizado o estructurado como texto etiquetado.
* **Impacto:** Medio.

### Riesgo 3: Sistema de minimizado dinámico por overflow (`is-minimized`) e indicadores de cantidad (`+X additional roles`)
* **El problema:** Tu CV modular inteligente utiliza Javascript y CSS para contraer puestos de trabajo a formatos de una sola línea (`is-minimized`) e inyectar un aviso textual visual como `+1 additional professional roles` si los elementos exceden la altura física de la página A4.
  * Si exportas el CV a PDF **desde la vista web en su estado comprimido**, el texto completo de las descripciones que han sido colapsadas mediante `display: none` o removidas de la vista **no estará presente en el PDF**. El ATS jamás se enterará de esas funciones tan valiosas.
  * Si el código HTML original los conserva en el DOM pero ocultos por CSS, algunos parses de alta capacidad sí podrían extraerlos, pero otros los ignorarán por completo, causando que tus experiencias tempranas queden vacías de contenido descriptivo.
* **Impacto:** Muy Alto si se exporta el CV visualmente truncado.

### Riesgo 4: Mezcla idiomática (Bilingüismo inconsistente)
* **El problema:** Todo tu contenido técnico, roles, descripciones, habilidades y educación están escritos en **inglés**. Sin embargo, algunos metadatos de perfil y localizaciones se encuentran en **español** (*"Madrid, España"*, *"Master in..."*). Si un ATS está configurado para filtrar candidatos de vacantes internacionales evaluando palabras clave en inglés, la mezcla puede bajar tu porcentaje de coincidencia semántica global.
* **Impacto:** Bajo-Medio.

---

## 4. Recomendaciones Profesionales para una Optimización ATS al 100%

Si vas a aplicar a ofertas de empleo a través de portales corporativos automáticos, te sugerimos aplicar las siguientes mejoras:

1. **Generar un perfil de exportación "Single Column" (Una Sola Columna):**
   * Configura tu archivo `master.json` para definir un layout de una única columna fluida (`"columns": "1fr"` y `"gridAreas": ["main"]` o similar) cuando necesites aplicar a ofertas frías a través de plataformas automatizadas. Esto garantiza que la lectura lineal sea 100% perfecta, secuencial e imposible de fragmentar.
2. **Evitar exportaciones con items colapsados o minimizados:**
   * Asegúrate de que, al generar el PDF para portales de empleo, la opción `maxItems` esté deshabilitada o ampliada lo suficiente como para renderizar **todo tu historial profesional con descripciones y tags legibles**, y que no se aplique la clase `is-minimized` en ningún ítem. El ATS no tiene restricciones de página física A4, prefiere leer 2 o 3 páginas completas de texto estructurado y limpio que una sola página ultracompactada visualmente.
3. **Preservar los datos de contacto en formato de texto puro:**
   * Aunque utilices bonitos iconos SVG para el correo, teléfono y redes, mantén el texto al lado de cada uno (como lo haces actualmente). Evita colocar los enlaces o números de contacto dentro de imágenes o formas gráficas sin texto indexable.
4. **Homogeneizar el idioma del documento:**
   * Si aplicas a vacantes en España que requieran español, traduce las descripciones. Si aplicas a multinacionales que usen el inglés como lengua vehicular, cambia las pocas palabras que quedan en español (*"Madrid, España"* -> *"Madrid, Spain"*, *"Socio"* o similares -> *"Partner"* o *"Member"*).
