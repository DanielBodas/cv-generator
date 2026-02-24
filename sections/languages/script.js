/**
 * Languages: nombre + badge código + barra. Colapsa de abajo hacia arriba.
 */

function init(data, cfg, el) {
    el.querySelectorAll('.skill-fill').forEach(bar => {
        const pct = bar.getAttribute('data-pct');
        if (pct) bar.style.width = `${pct}%`;
    });
    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const items = Array.from(el.querySelectorAll('.lang-item'));
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

    items.forEach(item => item.classList.remove('is-minimized'));
    el.classList.remove('mode-compact');

    let gap = 10, nameFz = 10;
    const update = () => {
        el.style.setProperty('--lang-gap', `${gap}px`);
        el.style.setProperty('--lang-name-fz', `${nameFz}px`);
    };
    update();

    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    let safety = 0;
    while (isOver() && safety < 30) {
        if (gap > 6)      gap    -= 0.5;
        if (nameFz > 9.0) nameFz -= 0.08;
        update(); safety++;
    }

    if (isOver()) {
        el.classList.add('mode-compact');
        items[0].classList.add('is-minimized');
    }

    safety = 0;
    while (hasRoom() && gap < 16 && safety < 40) {
        gap += 0.5; update();
        if (isOver()) { gap -= 0.5; update(); break; }
        safety++;
    }
}

function setupOverflowController(el, cfg) {
    const parentArea = el.closest('.area-container');
    if (el.__overflowController) {
        if (el.__overflowController.ro) el.__overflowController.ro.disconnect();
        window.removeEventListener('resize', el.__overflowController.onResize);
    }
    let timerId = null, isRunning = false, lastRunAt = 0;
    const run = () => {
        if (isRunning) return;
        isRunning = true;
        try { onOverflow(el, cfg); lastRunAt = Date.now(); }
        finally { requestAnimationFrame(() => { isRunning = false; }); }
    };
    const schedule = () => {
        if (Date.now() - lastRunAt < 180) return;
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