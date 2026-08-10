/**
 * Executive Highlights - Horizontal rows component
 * With local multi-stage overflow adjustment to dynamically fit content and prevent any overflow.
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

    // Design-parameters base
    let fzLabel = 9;
    let fzText = 8.5;
    let padY = 8;
    let padX = 12;
    let gap = 8;
    let labelWidth = 120;

    const update = () => {
        el.style.setProperty('--row-label-fz', `${fzLabel}px`);
        el.style.setProperty('--row-text-fz', `${fzText}px`);
        el.style.setProperty('--row-padding', `${padY}px ${padX}px`);
        el.style.setProperty('--row-gap', `${gap}px`);
        el.style.setProperty('--row-label-width', `${labelWidth}px`);
    };

    // Reset layout modes
    el.classList.remove('mode-tight', 'mode-very-tight', 'mode-ultra-compact');
    update();

    if (!isOver()) return;

    // Stage 1: Minor compression
    let safety = 0;
    while (isOver() && safety < 10) {
        if (fzText > 8.0) fzText -= 0.1;
        if (padY > 6) padY -= 0.5;
        if (gap > 6) gap -= 0.5;
        update();
        safety++;
    }

    if (!isOver()) return;

    // Stage 2: Tight clamping (allow max 2 lines)
    el.classList.add('mode-tight');
    if (!isOver()) return;

    // Stage 3: Medium compression
    safety = 0;
    while (isOver() && safety < 15) {
        if (fzText > 7.5) fzText -= 0.1;
        if (fzLabel > 8.0) fzLabel -= 0.1;
        if (padY > 4) padY -= 0.5;
        if (padX > 8) padX -= 0.5;
        if (labelWidth > 100) labelWidth -= 2;
        update();
        safety++;
    }

    if (!isOver()) return;

    // Stage 4: Very tight clamping (allow max 1 line)
    el.classList.remove('mode-tight');
    el.classList.add('mode-very-tight');
    if (!isOver()) return;

    // Stage 5: Ultra compact mode and maximum compression
    el.classList.remove('mode-very-tight');
    el.classList.add('mode-ultra-compact');

    safety = 0;
    while (isOver() && safety < 25) {
        if (fzText > 7.0) fzText -= 0.1;
        if (fzLabel > 7.5) fzLabel -= 0.1;
        if (padY > 2) padY -= 0.5;
        if (padX > 5) padX -= 0.5;
        if (gap > 3) gap -= 0.5;
        if (labelWidth > 80) labelWidth -= 2;
        update();
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