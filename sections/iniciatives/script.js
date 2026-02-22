/**
 * Lógica de Autocorrección y Expansión para INICIATIVES
 * Escala las tarjetas para que encajen y RELLENEN el sidebar de forma equilibrada.
 */

function init(data, cfg, el) {
    // Inicialización básica
}

/**
 * onOverflow: Redimensiona las tarjetas para que no se corten y aprovechen el aire disponible.
 */
function onOverflow(el, cfg) {
    const list = el.querySelector('.iniciatives-grid');
    if (!list) return;

    console.group(`[Iniciatives] 🏅 Equilibrando badges de iniciativas...`);

    const parentArea = el.closest('.area-container');

    // Detectores: 
    // 1. ¿Me paso de mi caja?
    // 2. ¿He hecho que el sidebar entero desborde el folio?
    const isOver = () => {
        const selfOver = el.scrollHeight > (el.clientHeight + 4);
        const areaOver = parentArea && parentArea.scrollHeight > (parentArea.clientHeight + 4);
        return selfOver || areaOver;
    };

    // Sensor de espacio libre (mucho espacio disponible)
    const hasRoom = () => {
        const selfRoom = el.scrollHeight < (el.clientHeight - 8);
        const areaRoom = parentArea && parentArea.scrollHeight < (parentArea.clientHeight - 10);
        return selfRoom && areaRoom;
    };

    // Valores base para reset
    let roleFz = 10;
    let orgFz = 8.5;
    let padH = 10;
    let padV = 8;
    let gap = 8;
    let iconSize = 24;

    const update = () => {
        el.style.setProperty('--init-role-fz', `${roleFz}px`);
        el.style.setProperty('--init-org-fz', `${orgFz}px`);
        el.style.setProperty('--init-padding', `${padV}px ${padH}px`);
        el.style.setProperty('--init-gap', `${gap}px`);
        el.style.setProperty('--init-icon-size', `${iconSize}px`);
    };

    // Reset para medida limpia
    update();
    el.classList.remove('mode-ultra-compact-init');
    list.style.height = 'auto';

    // 1. FASE DE COMPRESIÓN (Si no cabe)
    let safety = 0;
    while (isOver() && safety < 50) {
        if (roleFz > 8.2) {
            roleFz -= 0.1;
            orgFz -= 0.1;
        }
        if (padH > 5) padH -= 0.5;
        if (padV > 3) padV -= 0.5;
        if (gap > 4) gap -= 0.5;
        if (iconSize > 18) iconSize -= 1;

        update();
        if (!isOver()) break;
        safety++;
    }

    if (isOver()) {
        el.classList.add('mode-ultra-compact-init');
        roleFz = 7.8;
        orgFz = 7;
        gap = 2;
        update();
    }

    // 2. FASE DE EXPANSIÓN (Si sobra espacio en el sidebar)
    // Queremos que las iniciativas no se queden todas apelotonadas arriba
    safety = 0;
    while (hasRoom() && gap < 25 && safety < 60) {
        gap += 0.8;
        padV += 0.2;
        if (roleFz < 12) roleFz += 0.05;
        update();
        if (isOver()) {
            gap -= 0.8;
            padV -= 0.2;
            roleFz -= 0.05;
            update();
            break;
        }
        safety++;
    }

    console.log(`[Iniciatives] Layout estabilizado. Gap: ${gap.toFixed(1)}px`);
    console.groupEnd();
}

return { init, onOverflow };