/**
 * Education Cards: Highly visual 2-column grid layout with fluid space-fitting logic.
 */

function init(data, cfg, el) {
    const tagContainers = el.querySelectorAll('.edu-tags-container');
    tagContainers.forEach(container => {
        const tagsString = container.getAttribute('data-tags');
        if (!tagsString || tagsString.trim() === '') return;

        container.innerHTML = '';
        const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
        tags.forEach(tag => {
            const pill = document.createElement('li');
            pill.className = 'edu-tag-pill';
            pill.innerText = tag;
            container.appendChild(pill);
        });
    });

    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const cards = Array.from(el.querySelectorAll('.edu-card'));
    const parentArea = el.closest('.area-container');

    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    const hasRoom = () => {
        const selfRoom = el.scrollHeight < (el.clientHeight - 8);
        const areaRoom = parentArea && parentArea.scrollHeight < (parentArea.clientHeight - 10);
        return selfRoom && areaRoom;
    };

    // Reset layout
    cards.forEach(card => card.classList.remove('is-minimized'));
    el.classList.remove('mode-compact');

    let gap = 12;
    let padV = 10;
    let padH = 12;
    let degreeFz = 10.4;
    let schoolFz = 9;

    const update = () => {
        el.style.setProperty('--edu-card-gap', `${gap}px`);
        el.style.setProperty('--edu-card-padding', `${padV}px ${padH}px`);
        el.style.setProperty('--edu-card-degree-fz', `${degreeFz}px`);
        el.style.setProperty('--edu-card-school-fz', `${schoolFz}px`);
    };

    update();

    // PASO 1: Compactar (esconde las tags) si hay desborde
    if (isOver()) {
        el.classList.add('mode-compact');
    }

    // PASO 2: Compresión progresiva de espacios y tipografía
    let safety = 0;
    while (isOver() && safety < 40) {
        if (gap > 6) gap -= 0.5;
        if (padV > 4) padV -= 0.4;
        if (padH > 6) padH -= 0.4;
        if (degreeFz > 8.8) degreeFz -= 0.1;
        if (schoolFz > 7.6) schoolFz -= 0.08;
        update();
        safety++;
    }

    // PASO 3: Si sigue desbordando, colapsar de abajo a arriba los elementos en su estado mínimo
    for (let i = cards.length - 1; i >= 0; i--) {
        if (!isOver()) break;
        cards[i].classList.add('is-minimized');
    }

    // PASO 4: Si sobra espacio, ampliar sutilmente el aire
    safety = 0;
    while (hasRoom() && gap < 16 && safety < 40) {
        gap += 0.4;
        padV += 0.2;
        update();
        if (isOver()) {
            gap -= 0.4;
            padV -= 0.2;
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
