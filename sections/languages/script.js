/**
 * Lógica de Equilibrado y Renderizado para LANGUAGES
 */

function init(data, cfg, el) {
    // Aplicamos los anchos de las barras desde el data-attribute
    // Esto evita errores de linter en el HTML
    const bars = el.querySelectorAll('.skill-fill');
    bars.forEach(bar => {
        const pct = bar.getAttribute('data-pct');
        if (pct) {
            bar.style.width = `${pct}%`;
        }
    });
}

/**
 * onOverflow: Ajusta el espaciado para que la sección de idiomas 
 * también sea elástica y aproveche el folio.
 */
function onOverflow(el, cfg) {
    const list = el.querySelector('.lang-list');
    if (!list) return;

    const isOver = () => el.scrollHeight > (el.clientHeight + 4);
    const hasRoom = () => (el.clientHeight - el.scrollHeight) > 10;

    let gap = 12;
    let safety = 0;

    // Reset
    el.style.setProperty('--lang-gap', `${gap}px`);
    list.style.justifyContent = 'flex-start';

    // 1. Expansión Proactiva (Inflar espacios si sobra sitio)
    while (hasRoom() && gap < 28 && safety < 40) {
        gap += 1;
        el.style.setProperty('--lang-gap', `${gap}px`);
        if (isOver()) {
            gap -= 1;
            el.style.setProperty('--lang-gap', `${gap}px`);
            break;
        }
        safety++;
    }

    // 2. Compresión (Si el sidebar está muy lleno)
    if (isOver()) {
        el.classList.add('mode-compact');
        gap = 8;
        el.style.setProperty('--lang-gap', `${gap}px`);
    }

    console.log(`[Languages] Optimización de espacio: Gap ${gap}px`);
}

return { init, onOverflow };
