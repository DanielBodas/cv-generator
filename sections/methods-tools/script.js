/**
 * Lógica de Equilibrado Proactivo Avanzada - CORE TECH & METHODS
 * Busca el llenado perfecto tanto en horizontal como en vertical.
 */

function init(data, cfg, el) {
    const containers = el.querySelectorAll('.sidebar-skill-items');
    containers.forEach(container => {
        const itemsRaw = container.getAttribute('data-items');
        if (!itemsRaw) return;
        container.innerHTML = '';
        const items = itemsRaw.split(',').map(i => i.trim()).filter(i => i !== '');
        items.forEach(text => {
            const pill = document.createElement('span');
            pill.className = 'sidebar-skill-pill';
            pill.innerText = text;
            container.appendChild(pill);
        });
    });

    setupOverflowController(el, cfg);
}

/**
 * onOverflow: Maximiza el uso del espacio asignado.
 */
function onOverflow(el, cfg) {
    const list = el.querySelector('.sidebar-skills-list');
    if (!list) return;

    // Detectores de estado (el = .cv-section que está estirada por flex-grow)
    const isOverflowing = () => el.scrollHeight > (el.clientHeight + 2);
    const hasRoom = () => el.scrollHeight < (el.clientHeight - 4);

    // Valores iniciales (Reset)
    let fz = 9.5;
    let gapItems = 5;
    let gapCat = 16;
    let padCat = 10;

    const update = () => {
        el.style.setProperty('--sidebar-pill-fz', `${fz}px`);
        el.style.setProperty('--sidebar-items-gap', `${gapItems}px`);
        el.style.setProperty('--sidebar-category-gap', `${gapCat}px`);
        el.style.setProperty('--sidebar-category-pad', `${padCat}px`);
    };

    update();
    list.style.height = 'auto';
    list.style.justifyContent = 'flex-start';

    // --- FASE 1: EXPANSIÓN VERTICAL Y HORIZONTAL ---
    let safety = 0;
    while (hasRoom() && fz < 14 && safety < 100) {
        // Expandir solo internamente (no tocar flex de la sección)
        fz += 0.08;
        gapItems += 0.08;
        gapCat += 0.4;
        padCat += 0.25;
        update();
        if (isOverflowing() || (el.closest('.area-container') && el.closest('.area-container').scrollHeight > el.closest('.area-container').clientHeight + 4)) {
            // Retroceder cambios si provocan overflow en la sección o en el área
            fz -= 0.08; gapItems -= 0.08; gapCat -= 0.4; padCat -= 0.25;
            update();
            break;
        }
        safety++;
    }

    // --- FASE 2: COMPRESIÓN (Si empezamos ya desbordados) ---
    safety = 0;
    while (isOverflowing() && fz > 7.5 && safety < 100) {
        fz -= 0.1;
        gapItems -= 0.1;
        gapCat -= 0.5;
        padCat -= 0.2;
        update();
        safety++;
    }

    // --- FASE 3: EQUILIBRADO FINAL ---
    // Si aún queda aire, estiramos la lista para que las categorías respiren
    if (hasRoom()) {
        // No cambies el flex del `.cv-section`. Ajusta el contenido internamente.
        list.style.maxHeight = `calc(${el.clientHeight}px - 10px)`;
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.justifyContent = 'space-around';
    } else {
        list.style.height = 'auto';
        list.style.justifyContent = 'flex-start';
    }

    console.log(`[Core Tech] Fill complete. FZ: ${fz.toFixed(1)}px, Safety: ${safety}`);
}

function setupOverflowController(el, cfg) {
    const parentArea = el.closest('.area-container');

    if (el.__overflowController) {
        if (el.__overflowController.ro) el.__overflowController.ro.disconnect();
        window.removeEventListener('resize', el.__overflowController.onResize);
    }

    let timerId = null;
    let isRunning = false;
    let lastRunAt = 0;

    const run = () => {
        if (isRunning) return;
        isRunning = true;
        try {
            onOverflow(el, cfg);
            lastRunAt = Date.now();
        } finally {
            requestAnimationFrame(() => {
                isRunning = false;
            });
        }
    };

    const schedule = () => {
        const now = Date.now();
        if (now - lastRunAt < 180) return;
        clearTimeout(timerId);
        timerId = setTimeout(run, 90);
    };

    const onResize = schedule;
    window.addEventListener('resize', onResize);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(schedule);
        ro.observe(el);
        if (parentArea) ro.observe(parentArea);
    }

    el.__overflowController = { ro, onResize };
    schedule();
}

return { init, onOverflow };
