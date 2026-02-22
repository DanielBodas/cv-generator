/**
 * Lógica Quirúrgica para EXPERIENCE
 * Asegura que los puestos más recientes mantengan su descripción siempre que sea posible,
 * vigilando que no se rompa el folio A4 completo.
 */

function init(data, cfg, el) {
    const tagContainers = el.querySelectorAll('.exp-tags-container');
    tagContainers.forEach((container) => {
        const tagsString = container.getAttribute('data-tags');
        if (!tagsString || tagsString.trim() === "") {
            container.style.display = 'none';
            return;
        }
        container.innerHTML = '';
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t !== '');
        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'exp-tag-pill';
            pill.innerText = tag;
            container.appendChild(pill);
        });
    });
}

function onOverflow(el, cfg) {
    console.group(`[Experience] 🛡️ Ajuste Dinámico de Espacio`);

    const items = Array.from(el.querySelectorAll('.exp-item'));
    const parentArea = el.closest('.area-container');

    // Detectores de colisión:
    // 1. ¿He crecido más que mi caja asignada?
    // 2. ¿He hecho que todo el sidebar se salga del folio (A4 height)?
    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    // Resetear estados previos para un recálculo limpio
    items.forEach(item => item.classList.remove('is-minimized'));
    el.classList.remove('mode-compact');

    // PASO 1: Reducción de gaps generales
    if (isOver()) {
        el.classList.add('mode-compact');
    }

    // PASO 2: Minimizar puestos antiguos (Bottom-Up)
    for (let i = items.length - 1; i > 0; i--) {
        if (!isOver()) break;
        items[i].classList.add('is-minimized');
    }

    // PASO 3: Minimizar incluso el puesto actual (Último recurso)
    if (isOver() && items.length > 0) {
        items[0].classList.add('is-minimized');
    }

    console.groupEnd();
}

return { init, onOverflow };