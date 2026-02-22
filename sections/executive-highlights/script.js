/**
 * Lógica de Autocorrección para EXECUTIVE HIGHLIGHTS
 * Escala las tarjetas para que encajen siempre en el alto asignado.
 */

function init(data, cfg, el) {
    // Inicialización básica
}

/**
 * onOverflow: Redimensiona las tarjetas para que no se corten.
 */
function onOverflow(el, cfg) {
    console.group(`[Executive Highlights] 💎 Ajustando tarjetas de impacto...`);

    // Detectores de estado
    const isOver = () => el.scrollHeight > (el.clientHeight + 4);

    // Reset a valores base
    let fzLabel = 9;
    let fzText = 8.5;
    let pad = 10;
    let gap = 10;

    const update = () => {
        el.style.setProperty('--card-label-fz', `${fzLabel}px`);
        el.style.setProperty('--card-text-fz', `${fzText}px`);
        el.style.setProperty('--card-padding', `${pad}px`);
        el.style.setProperty('--grid-gap', `${gap}px`);
    };

    update();

    // 1. Reducción Progresiva
    let safety = 0;
    while (isOver() && safety < 50) {
        if (fzText > 7.5) {
            fzText -= 0.2;
            fzLabel -= 0.1;
        }
        if (pad > 4) pad -= 0.5;
        if (gap > 4) gap -= 0.5;

        update();
        if (!isOver()) break;
        safety++;
    }

    // 2. Si sigue sin caber, forzamos un modo ultra-compacto
    if (isOver()) {
        el.classList.add('mode-ultra-compact');
    }

    console.log(`[Executive Highlights] Ajuste final tras ${safety} pasos. FZ: ${fzText.toFixed(1)}px`);
    console.groupEnd();
}

return { init, onOverflow };
