# Guía de Despliegue en Vercel - CV Generator

Esta guía explica detalladamente por qué tu aplicación puede no estar cargando correctamente la información en Vercel y cómo solucionarlo en menos de un minuto.

---

## 🔍 El Origen del Problema

Tu proyecto es un **motor de CV dinámico y modular basado en Vanilla JS (ESM)**. Carga de forma dinámica y bajo demanda recursos y datos del lado del cliente desde directorios de runtime, tales como:
* `config/master.json` (ajustes globales)
* `jss/app.js` e `jss/inline-editor.js` (lógica y editor)
* `sections/` (plantillas, hojas de estilos CSS y archivos `data.json` de cada sección)

### ¿Por qué falla con la configuración actual (Vite)?
Como el repositorio incluye un archivo `package.json` con dependencias de Vite, Vercel autodetecta el proyecto como un **"Vite Single Page Application"** y ejecuta automáticamente el comando `vite build` para compilar todo en la carpeta `dist/`.

Sin embargo, el bundler por defecto de Vite **no copia carpetas estáticas como `config/`, `jss/` o `sections/`** al directorio de producción `dist/` a menos que se configure un plugin de copiado complejo. Como consecuencia:
1. El archivo `index.html` compilado busca scripts y recursos en directorios que **no existen** en el despliegue final de Vercel (errores 404).
2. Se muestra una **pantalla en blanco** o el CV no llega a renderizar ningún bloque.

---

## 🛠️ Solución Recomendada (Despliegue Estático Directo)

Como esta es una aplicación web estática pura de alto rendimiento, **no necesita un proceso de compilación**. Lo más limpio, rápido y libre de fallos es servir el repositorio de manera directa como archivos estáticos.

Sigue estos sencillos pasos en tu panel de Vercel (tal como se muestra en la captura de **Settings > Build & Development**):

1. Ve a tu panel de **Vercel** y entra al proyecto de tu CV.
2. Haz clic en la pestaña **Settings** (Ajustes) en la barra superior.
3. En el menú lateral izquierdo, selecciona **Build & Development**.
4. Realiza los siguientes ajustes (puedes activar el interruptor **Override** para cada campo para habilitar la edición):

| Configuración en Vercel | Valor a establecer | ¿Por qué? |
| :--- | :--- | :--- |
| **Framework Preset** | Selecciona `Other` (u `Otro`) | Desactiva las asunciones automáticas de Vite. |
| **Build Command** | *Dejar vacío* (vaciar por completo) | Evita compilar, acelerando el despliegue a menos de 5 segundos. |
| **Output Directory** | *Dejar vacío* (o poner `.` o `public`) | Le indica a Vercel que sirva los archivos directamente desde la raíz del proyecto. |
| **Install Command** | *Dejar vacío* (vaciar por completo) | No es necesario instalar librerías node_modules en producción. |

5. Haz clic en el botón **Save** (Guardar) abajo a la derecha.
6. Ve a la pestaña **Deployments** en Vercel, selecciona tu último commit y haz clic en **Redeploy** (Redesplegar) para aplicar los cambios.

¡Y listo! Tu CV se cargará instantáneamente con todos sus estilos, datos de secciones y el nuevo selector de componentes en tiempo real.

---

## 📝 Alternativa con Archivo `vercel.json`

Para garantizar que Vercel use la configuración correcta de manera automática sin tener que configurar la interfaz web, hemos agregado un archivo `vercel.json` en la raíz del proyecto.

Este archivo le indica de manera explícita a Vercel que trate el directorio como un sitio estático directo, configure cabeceras limpias y no use el pipeline de Vite para producción.
