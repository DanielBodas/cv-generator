/**
 * Lógica para INICIATIVES (Modern Badges)
 */

function init(data, cfg, el) {
    // Ya no necesitamos lógica compleja de pills, el template es estático
    console.log("[Iniciatives] 🏅 Badge Grid inicializado.");
}

function onOverflow(el, cfg) {
    console.log("[Iniciatives] ⚠️ Aplicando modo ultra-compacto.");
    el.classList.add('mode-compact-init');
}

return { init, onOverflow };