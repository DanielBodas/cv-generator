/**
 * Experience overflow: prioriza aire entre puestos y compacta desde abajo.
 */

function init(data, cfg, el) {
    const journeyContainer = el.querySelector('#journey-timeline');
    if (journeyContainer) {
        if (cfg.showJourney !== false && data.experience) {
            renderJourneyTimeline(data.experience, journeyContainer);
            journeyContainer.style.display = 'flex';
        } else {
            journeyContainer.style.display = 'none';
        }
    }

    const tagContainers = el.querySelectorAll('.exp-tags-container');
    tagContainers.forEach((container) => {
        const tagsString = container.getAttribute('data-tags');
        if (!tagsString || tagsString.trim() === '') {
            container.style.display = 'none';
            return;
        }
        container.innerHTML = '';
        const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'exp-tag-pill';
            pill.innerText = tag;
            container.appendChild(pill);
        });
    });

    setupOverflowController(el, cfg);
}

function renderJourneyTimeline(items, container) {
    container.innerHTML = '';
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
    const items = Array.from(el.querySelectorAll('.exp-item'));
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

    items.forEach(item => item.classList.remove('is-minimized'));
    el.classList.remove('mode-compact');

    let gap = 24;
    let roleFz = 12.2;
    let descLh = 1.56;
    let itemPad = 2;

    const update = () => {
        el.style.setProperty('--exp-gap', `${gap}px`);
        el.style.setProperty('--exp-role-fz', `${roleFz}px`);
        el.style.setProperty('--exp-desc-line-height', `${descLh}`);
        el.style.setProperty('--exp-item-pad-bottom', `${itemPad}px`);
    };

    update();

    // Primero compactamos de abajo antes de tirar el gap.
    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    if (isOver()) {
        el.classList.add('mode-compact');
    }

    // Compactacion secundaria suave
    let safety = 0;
    while (isOver() && safety < 35) {
        if (gap > 12) gap -= 0.5;
        if (roleFz > 11.2) roleFz -= 0.05;
        if (descLh > 1.34) descLh -= 0.01;
        update();
        safety++;
    }

    if (isOver() && items.length > 0) {
        items[0].classList.add('is-minimized');
    }

    // Si sobra, abrir aire
    safety = 0;
    while (hasRoom() && gap < 28 && safety < 40) {
        gap += 0.4;
        roleFz += 0.03;
        descLh += 0.005;
        update();
        if (isOver()) {
            gap -= 0.4;
            roleFz -= 0.03;
            descLh -= 0.005;
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