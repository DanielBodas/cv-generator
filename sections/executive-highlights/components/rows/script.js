/**
 * Executive Highlights - Horizontal rows component
 * With local overflow adjustment to dynamically fit content and prevent any overflow.
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

    // Base row design values
    let fzLabel = 9;
    let fzText = 8.5;
    let padY = 8;
    let padX = 10;
    let gap = 8;
    let labelWidth = 120;

    const update = () => {
        el.style.setProperty('--row-label-fz', `${fzLabel}px`);
        el.style.setProperty('--row-text-fz', `${fzText}px`);
        el.style.setProperty('--row-padding', `${padY}px ${padX}px`);
        el.style.setProperty('--row-gap', `${gap}px`);
        el.style.setProperty('--row-label-width', `${labelWidth}px`);
    };

    el.classList.remove('mode-ultra-compact');
    update();

    // Compression mechanism to perfectly fit within bounds
    let safety = 0;
    while (isOver() && safety < 50) {
        if (fzText > 7.0) {
            fzText -= 0.15;
            fzLabel -= 0.1;
        }
        if (padY > 3) padY -= 0.5;
        if (padX > 5) padX -= 0.5;
        if (gap > 4) gap -= 0.5;
        if (labelWidth > 90) labelWidth -= 2;
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