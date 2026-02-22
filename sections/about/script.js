/**
 * Lógica específica para la sección ABOUT
 * el motor llama a esta función automáticamente.
 */

// Esta función se ejecuta al cargar la sección
function init(data, cfg, el) {
    console.log(`[About] Inicializado para ${data.name || 'usuario'}`);
}

// Esta función es llamada por el motor si detecta que la sección no cabe
function onOverflow(el, cfg) {
    const textEl = el.querySelector('.about-text');
    if (!textEl) return;

    console.log("[About] Manejando overflow: aplicando truncado de seguridad.");

    // Aplicamos un límite de líneas visual mediante CSS
    textEl.style.display = "-webkit-box";
    textEl.style.webkitLineClamp = "6";
    textEl.style.webkitBoxOrient = "vertical";
    textEl.style.overflow = "hidden";
}

// Exponemos las funciones al motor
return { onOverflow };
