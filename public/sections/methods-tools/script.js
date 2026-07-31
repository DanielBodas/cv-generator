/**
 * Methods & Tools overflow: compresión/expansión limpia.
 * Sin space-around que crea huecos raros. Prioriza las primeras categorías.
 */

function init(data, cfg, el) {
    const containers = el.querySelectorAll('.sidebar-skill-items');
    containers.forEach(container => {
        const itemsRaw = container.getAttribute('data-items');
        if (!itemsRaw) return;
        container.innerHTML = '';
        
        // Soporta tanto array JSON ["a","b"] como string "a, b"
        let items;
        try {
            // 1. Limpiamos las comillas simples por si vienen del HTML para que JSON.parse funcione
            const sanitized = itemsRaw.replace(/'/g, '"');
            const parsed = JSON.parse(sanitized);
            items = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            // 2. Si falla y es texto plano, protegemos la coma cambiándola temporalmente por un comodín
            let safeString = itemsRaw.replace(/Java,\s*HTML/gi, 'Java__COMA__HTML');
            items = safeString.split(',').map(i => i.replace('__COMA__', ', ').trim()).filter(Boolean);
        }
        
        items.forEach(text => {
            const pill = document.createElement('span');
            pill.className = 'sidebar-skill-pill';
            pill.innerText = text;
            container.appendChild(pill);
        });
    });

    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const list = el.querySelector('.sidebar-skills-list');
    const categories = Array.from(el.querySelectorAll('.sidebar-skill-category'));
    if (!list) return;

    const parentArea = el.closest('.area-container');

    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    const hasRoom = () => {
        const selfRoom = el.scrollHeight < (el.clientHeight - 4);
        const areaRoom = parentArea && parentArea.scrollHeight < (parentArea.clientHeight - 10);
        return selfRoom && areaRoom;
    };

    // Reset
    categories.forEach(c => c.classList.remove('is-minimized'));
    list.style.justifyContent = 'flex-start';

    let fz      = 9.3;
    let gapItems = 5;
    let gapCat  = 14;
    let padCat  = 9;

    const update = () => {
        el.style.setProperty('--sidebar-pill-fz',       `${fz}px`);
        el.style.setProperty('--sidebar-items-gap',     `${gapItems}px`);
        el.style.setProperty('--sidebar-category-gap',  `${gapCat}px`);
        el.style.setProperty('--sidebar-category-pad',  `${padCat}px`);
    };

    update();

    // PASO 1: Compresión suave
    let safety = 0;
    while (isOver() && safety < 60) {
        if (fz > 7.5)       fz       -= 0.1;
        if (gapItems > 2)   gapItems -= 0.1;
        if (gapCat > 6)     gapCat   -= 0.4;
        if (padCat > 4)     padCat   -= 0.2;
        update();
        safety++;
    }

    // PASO 2: Expansión si sobra espacio (solo internamente, sin tocar flex de la sección)
    safety = 0;
    while (hasRoom() && fz < 11 && safety < 80) {
        fz       += 0.07;
        gapItems += 0.06;
        gapCat   += 0.3;
        padCat   += 0.15;
        update();
        if (isOver()) {
            fz       -= 0.07;
            gapItems -= 0.06;
            gapCat   -= 0.3;
            padCat   -= 0.15;
            update();
            break;
        }
        safety++;
    }
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
            requestAnimationFrame(() => { isRunning = false; });
        }
    };

    const schedule = () => {
        const now = Date.now();
        if (now - lastRunAt < 180) return;
        clearTimeout(timerId);
        timerId = setTimeout(run, 90);
    };

    window.addEventListener('resize', schedule);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(schedule);
        ro.observe(el);
        if (parentArea) ro.observe(parentArea);
    }

    el.__overflowController = { ro, onResize: schedule };
    schedule();
}

return { init, onOverflow };