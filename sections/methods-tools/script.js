/**
 * Lógica de Equilibrado Proactivo - METHODS & TOOLS
 * Esta versión fuerza el crecimiento hasta que el scrollHeight sea idéntico al clientHeight.
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
 * onOverflow: Redimensiona el contenido para que coincida exactamente con el alto del contenedor.
 */
function onOverflow(el, cfg) {
    const list = el.querySelector('.sidebar-skills-list');
    if (!list) return;

    // Detectores de estado (el = .cv-section que está estirada por flex-grow)
    const isOverflowing = () => el.scrollHeight > (el.clientHeight + 2);
    const hasRoom = () => el.scrollHeight < (el.clientHeight - 5);

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
    list.style.height = 'auto'; // Asegurar que podemos medir el scrollHeight real
    list.style.justifyContent = 'flex-start';

    // Aumentar progresivamente hasta llenar el hueco
    let safety = 0;
    while (hasRoom() && fz < 15 && safety < 80) {
        fz += 0.1;
        gapItems += 0.1;
        gapCat += 0.5;
        padCat += 0.2;
        update();
        if (isOverflowing()) {
            // Un paso atrás
            fz -= 0.1; gapItems -= 0.1; gapCat -= 0.5; padCat -= 0.2;
            update();
            break;
        }
        safety++;
    }

    // Reducir si empezamos ya desbordados
    safety = 0;
    while (isOverflowing() && fz > 7 && safety < 80) {
        fz -= 0.1;
        gapItems -= 0.1;
        gapCat -= 0.5;
        padCat -= 0.2;
        update();
        safety++;
    }

    // Ajuste final de distribución estética
    // Si aún queda una brizna de espacio, forzamos el estirado final con flex
    if (hasRoom()) {
        list.style.height = '100%';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.justifyContent = 'space-between';
    }

    console.log(`[Methods & Tools] Redimensión proactiva completada. FZ: ${fz.toFixed(1)}px`);
}

return { init, onOverflow };