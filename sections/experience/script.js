/**
 * Lógica Proactiva para EXPERIENCE
 * Asegura que se ocupe siempre lo máximo al alto disponible.
 */

function init(data, cfg, el) {
    // 1. Renderizar Mini-Timeline (Professional Journey)
    const journeyContainer = el.querySelector('#journey-timeline');
    if (journeyContainer) {
        if (cfg.showJourney !== false && data.experience) {
            renderJourneyTimeline(data.experience, journeyContainer);
            journeyContainer.style.display = 'flex';
        } else {
            journeyContainer.style.display = 'none';
        }
    }

    // 2. Renderizar Tags
    const tagContainers = el.querySelectorAll('.exp-tags-container');
    tagContainers.forEach((container) => {
        const tagsString = container.getAttribute('data-tags');
        if (!tagsString || tagsString.trim() === "") {
            container.style.display = 'none';
            return;
        }
        container.innerHTML = '';
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t !== '');
        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'exp-tag-pill';
            pill.innerText = tag;
            container.appendChild(pill);
        });
    });
}

/**
 * Genera los puntos de la línea de tiempo horizontal
 */
function renderJourneyTimeline(items, container) {
    container.innerHTML = '';

    // Parsear años y preparar datos
    const timelineData = items.map(item => {
        const parts = item.dates.split('–').map(s => s.trim());
        const start = parseInt(parts[0]);
        let end = parts[1] === 'Present' ? new Date().getFullYear() : parseInt(parts[1]);
        if (isNaN(end)) end = start;
        return { start, end, role: item.role.split(/[–|]/)[0].trim() };
    });

    const minYear = Math.min(...timelineData.map(y => y.start));
    const maxYear = Math.max(...timelineData.map(y => y.end));
    const range = maxYear - minYear || 1;

    // Dibujar puntos
    timelineData.sort((a, b) => a.start - b.start).forEach((y, index) => {
        const pct = ((y.start - minYear) / range) * 100;
        const point = document.createElement('div');
        point.className = `journey-point ${index === timelineData.length - 1 ? ' active' : ''}`;
        point.style.left = `${pct}%`;

        const yearLabel = document.createElement('span');
        yearLabel.className = 'journey-year';
        yearLabel.innerText = y.start;

        const roleLabel = document.createElement('span');
        roleLabel.className = 'journey-role';
        roleLabel.innerText = y.role.length > 15 ? y.role.substring(0, 13) + '..' : y.role;

        point.appendChild(yearLabel);
        point.appendChild(roleLabel);
        container.appendChild(point);
    });
}

function onOverflow(el, cfg) {
    console.group(`[Experience] 🛡️ Ajuste Dinámico de Espacio`);

    const items = Array.from(el.querySelectorAll('.exp-item'));
    const parentArea = el.closest('.area-container');
    const scrollList = el.querySelector('.experience-list');

    // Detectores de colisión
    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    const hasRoom = () => {
        const selfRoom = el.scrollHeight < (el.clientHeight - 10);
        const areaRoom = parentArea && parentArea.scrollHeight < (parentArea.clientHeight - 10);
        return selfRoom && areaRoom;
    };

    // 1. RESET Y COMPRESIÓN SI SOBRA/FALTA
    items.forEach(item => item.classList.remove('is-minimized'));
    el.classList.remove('mode-compact');

    // Valores base
    let gap = 18;
    let roleFz = 13;
    let descLh = 1.5;
    let itemPad = 2;

    const update = () => {
        el.style.setProperty('--exp-gap', `${gap}px`);
        el.style.setProperty('--exp-role-fz', `${roleFz}px`);
        el.style.setProperty('--exp-desc-line-height', `${descLh}`);
        el.style.setProperty('--exp-item-pad-bottom', `${itemPad}px`);
    };

    update();

    // 2. FASE DE COMPRESIÓN (Si no cabe)
    if (isOver()) {
        el.classList.add('mode-compact');
        gap = 8;
        update();
    }

    // Minimizar si sigue sin caber
    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    if (isOver() && items.length > 0) {
        items[0].classList.add('is-minimized');
    }

    // 3. FASE DE EXPANSIÓN (Si sobra espacio)
    // Queremos que use todo el alto disponible para que no queden huecos blancos abajo
    let safety = 0;
    while (hasRoom() && gap < 35 && safety < 80) {
        gap += 0.5;
        roleFz += 0.05;
        descLh += 0.01;
        itemPad += 0.1;
        update();
        if (isOver()) {
            gap -= 0.5;
            roleFz -= 0.05;
            descLh -= 0.01;
            itemPad -= 0.1;
            update();
            break;
        }
        safety++;
    }

    console.log(`[Experience] Expansión completada. Gap: ${gap.toFixed(1)}px`);
    console.groupEnd();
}

return { init, onOverflow };