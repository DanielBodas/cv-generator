/**
 * Education overflow: mismo enfoque que Experience.
 * Compacta desde abajo y mantiene aire entre items cuando sea posible.
 */

function init(data, cfg, el) {
    const tagContainers = el.querySelectorAll('.edu-tags-container');
    tagContainers.forEach(container => {
        const tagsString = container.getAttribute('data-tags');
        if (!tagsString || tagsString.trim() === '') return;

        container.innerHTML = '';
        const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'edu-tag-pill';
            pill.innerText = tag;
            container.appendChild(pill);
        });
    });

    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const items = Array.from(el.querySelectorAll('.edu-item'));
    const parentArea = el.closest('.area-container');

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

    let gap = 22;
    let degreeFz = 12.4;
    let schoolFz = 10.6;
    let yearFz = 8.6;
    let itemPadLeft = 10;

    const update = () => {
        el.style.setProperty('--edu-gap', `${gap}px`);
        el.style.setProperty('--edu-degree-fz', `${degreeFz}px`);
        el.style.setProperty('--edu-school-fz', `${schoolFz}px`);
        el.style.setProperty('--edu-year-fz', `${yearFz}px`);
        el.style.setProperty('--edu-item-pad-left', `${itemPadLeft}px`);
    };

    items.forEach(item => item.classList.remove('is-minimized', 'is-micro'));
    el.classList.remove('mode-compact', 'mode-tight');
    update();

    // 1) Compactacion por historico: de abajo hacia arriba
    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    // 2) Si aun no cabe, activar compacto y micro desde abajo
    if (isOver()) {
        el.classList.add('mode-compact');
        for (let i = items.length - 1; i > 0; i--) {
            if (!isOver()) break;
            items[i].classList.add('is-micro');
        }
    }

    // 3) Compresion suave de tipografia/gap (manteniendo aire razonable)
    let safety = 0;
    while (isOver() && safety < 35) {
        if (gap > 12) gap -= 0.5;
        if (degreeFz > 11.2) degreeFz -= 0.08;
        if (schoolFz > 9.6) schoolFz -= 0.07;
        if (yearFz > 8.0) yearFz -= 0.05;
        if (itemPadLeft > 8) itemPadLeft -= 0.2;
        update();
        safety++;
    }

    // 4) Ultimo recurso: compactar tambien el primero
    if (isOver() && items.length > 0) {
        items[0].classList.add('is-minimized');
    }

    // 5) Si sobra hueco, abrir de nuevo
    safety = 0;
    while (hasRoom() && gap < 26 && safety < 35) {
        gap += 0.4;
        degreeFz += 0.04;
        schoolFz += 0.04;
        yearFz += 0.02;
        update();

        if (isOver()) {
            gap -= 0.4;
            degreeFz -= 0.04;
            schoolFz -= 0.04;
            yearFz -= 0.02;
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