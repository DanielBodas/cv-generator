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
    while (hasRoom() && fz < 16 && safety < 100) {
        fz += 0.1;
        gapItems += 0.1;
        gapCat += 0.6;
        padCat += 0.3;
        update();
        if (isOverflowing()) {
            // Retroceder un poco más para margen de seguridad
            fz -= 0.1; gapItems -= 0.1; gapCat -= 0.6; padCat -= 0.3;
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
        list.style.height = '100%';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        // Usamos space-around para un reparto más equilibrado que space-between
        list.style.justifyContent = 'space-around';
    } else {
        list.style.height = 'auto';
        list.style.justifyContent = 'flex-start';
    }

    console.log(`[Core Tech] Fill complete. FZ: ${fz.toFixed(1)}px, Safety: ${safety}`);
}

return { init, onOverflow };