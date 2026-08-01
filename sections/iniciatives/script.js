/**
 * Iniciatives overflow: colapsa de abajo hacia arriba (igual que experience).
 * Las cards normales muestran role + org completos con word-wrap.
 * Las minimizadas muestran solo el role en altura mínima.
 */

function init(data, cfg, el) {
    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const items = Array.from(el.querySelectorAll('.iniciatives-card'));
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

    // Reset
    items.forEach(item => item.classList.remove('is-minimized'));
    el.classList.remove('mode-ultra-compact-init');

    let roleFz   = 9.8;
    let orgFz    = 8.3;
    let padH     = 10;
    let padV     = 8;
    let gap      = 9;
    let iconSize = 24;

    const update = () => {
        el.style.setProperty('--init-role-fz',   `${roleFz}px`);
        el.style.setProperty('--init-org-fz',    `${orgFz}px`);
        el.style.setProperty('--init-padding',   `${padV}px ${padH}px`);
        el.style.setProperty('--init-gap',       `${gap}px`);
        el.style.setProperty('--init-icon-size', `${iconSize}px`);
    };

    update();

    // PASO 1: Colapsar de abajo hacia arriba
    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    // PASO 2: Compresión suave si aún desborda
    let safety = 0;
    while (isOver() && safety < 40) {
        if (roleFz > 8.2) { roleFz -= 0.1; orgFz -= 0.08; }
        if (padH > 5)       padH   -= 0.3;
        if (padV > 3)       padV   -= 0.3;
        if (gap > 4)        gap    -= 0.3;
        if (iconSize > 18)  iconSize -= 0.5;
        update();
        safety++;
    }

    // PASO 3: Último recurso — colapsar el primero también
    if (isOver()) {
        el.classList.add('mode-ultra-compact-init');
        items[0].classList.add('is-minimized');
    }

    // PASO 4: Expansión si sobra espacio
    safety = 0;
    while (hasRoom() && gap < 14 && safety < 60) {
        gap  += 0.5;
        padV += 0.12;
        if (roleFz < 10.5) roleFz += 0.04;
        update();
        if (isOver()) {
            gap  -= 0.5;
            padV -= 0.12;
            roleFz -= 0.04;
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