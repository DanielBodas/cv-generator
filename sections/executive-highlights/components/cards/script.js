/**
 * Executive Highlights - comportamiento visual original,
 * con ajuste local de overflow en la propia seccion.
 */

function init(data, cfg, el) {
    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const parentArea = el.closest('.area-container');

    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    // Base estilo original
    let fzLabel = 9;
    let fzText = 8.5;
    let pad = 10;
    let gap = 10;

    const update = () => {
        el.style.setProperty('--card-label-fz', `${fzLabel}px`);
        el.style.setProperty('--card-text-fz', `${fzText}px`);
        el.style.setProperty('--card-padding', `${pad}px 8px`);
        el.style.setProperty('--grid-gap', `${gap}px`);
    };

    el.classList.remove('mode-ultra-compact');
    update();

    // Compresion simple, como comportamiento previo
    let safety = 0;
    while (isOver() && safety < 50) {
        if (fzText > 7.5) {
            fzText -= 0.2;
            fzLabel -= 0.1;
        }
        if (pad > 4) pad -= 0.5;
        if (gap > 4) gap -= 0.5;
        update();
        if (!isOver()) break;
        safety++;
    }

    if (isOver()) {
        el.classList.add('mode-ultra-compact');
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