/**
 * Executive Highlights - Horizontal continuous flow (inline-paragraph) component
 * With local multi-stage overflow adjustment to dynamically fit content and prevent any overflow.
 */

function init(data, cfg, el) {
    setupOverflowController(el, cfg);
}

function onOverflow(el, cfg) {
    const parentArea = el.closest('.area-container');

    const isOver = () => {
        // Precise overflow check including sub-pixel rendering.
        const selfOver = el.scrollHeight > (el.clientHeight + 2);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 2);
        return selfOver || areaOver;
    };

    // Design-parameters base
    let fzLabel = 8;
    let fzText = 8.5;
    let padY = 2;
    let gapX = 12;
    let gapY = 6;
    let labelPadY = 2;
    let labelPadX = 5;

    const update = () => {
        el.style.setProperty('--flow-label-fz', `${fzLabel}px`);
        el.style.setProperty('--flow-font-size', `${fzText}px`);
        el.style.setProperty('--flow-padding', `${padY}px 0px`);
        el.style.setProperty('--flow-gap-x', `${gapX}px`);
        el.style.setProperty('--flow-gap-y', `${gapY}px`);
        el.style.setProperty('--flow-label-pad', `${labelPadY}px ${labelPadX}px`);
    };

    // Reset layout modes
    el.classList.remove('mode-tight', 'mode-very-tight', 'mode-ultra-compact');
    update();

    if (!isOver()) return;

    // Stage 1: Minor compression
    let safety = 0;
    while (isOver() && safety < 15) {
        if (fzText > 7.8) fzText -= 0.1;
        if (gapX > 8) gapX -= 1;
        if (gapY > 4) gapY -= 0.5;
        update();
        safety++;
    }

    if (!isOver()) return;

    // Stage 2: Tight clamping (allow max 2 lines for texts if wrapping is too wide)
    el.classList.add('mode-tight');
    if (!isOver()) return;

    // Stage 3: Medium compression
    safety = 0;
    while (isOver() && safety < 20) {
        if (fzText > 7.4) fzText -= 0.1;
        if (fzLabel > 7.4) fzLabel -= 0.1;
        if (gapX > 6) gapX -= 1;
        if (gapY > 3) gapY -= 0.5;
        if (labelPadX > 3) labelPadX -= 0.5;
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
    while (isOver() && safety < 30) {
        if (fzText > 7.0) fzText -= 0.1;
        if (fzLabel > 7.0) fzLabel -= 0.1;
        if (gapX > 4) gapX -= 0.5;
        if (gapY > 2) gapY -= 0.5;
        if (labelPadY > 1) labelPadY -= 0.5;
        if (labelPadX > 2) labelPadX -= 0.5;
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