/**
 * Lógica Quirúrgica para EDUCATION
 */

function init(data, cfg, el) {
    const tagContainers = el.querySelectorAll('.edu-tags-container');
    tagContainers.forEach(container => {
        const tagsString = container.getAttribute('data-tags');
        if (!tagsString || tagsString.trim() === "") return;
        container.innerHTML = '';
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t !== '');
        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'edu-tag-pill';
            pill.innerText = tag;
            container.appendChild(pill);
        });
    });
}

function onOverflow(el, cfg) {
    console.group(`[Education] 🎓 Ajuste Dinámico de Espacio`);

    const items = Array.from(el.querySelectorAll('.edu-item'));
    const parentArea = el.closest('.area-container');

    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    // Resetear
    items.forEach(item => item.classList.remove('is-minimized'));
    el.classList.remove('mode-compact');

    // PASO 1: Empezamos minimizando lo antiguo (tags) de uno en uno
    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    // PASO 2: Reducción de gaps
    if (isOver()) {
        el.classList.add('mode-compact');
    }

    // PASO 3: Formación reciente a compacto
    if (isOver() && items.length > 0) {
        items[0].classList.add('is-minimized');
    }

    console.groupEnd();
}

return { init, onOverflow };