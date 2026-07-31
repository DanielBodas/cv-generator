/**
 * CV Modular Engine - PROACTIVE LAYOUT EDITION
 * Adaptado para soportar configuración en tiempo real y persistencia local.
 */

// Inicialización global del estado del CV
window.CVConfig = null;
window.CVSectionsData = {};

document.addEventListener('DOMContentLoaded', initCVStart);

async function initCVStart() {
    console.group('%c🚀 CV Engine: Iniciando carga inteligente...', 'color: #1d3557; font-weight: bold; font-size: 14px;');
    try {
        // 1. Cargar Configuración Maestra (de localStorage o /config/master.json de la raíz pública)
        const savedConfig = localStorage.getItem('cv_master_config');
        if (savedConfig) {
            window.CVConfig = JSON.parse(savedConfig);
            console.log('📦 Configuración cargada de localStorage');
        } else {
            const configRes = await fetch('/config/master.json');
            if (!configRes.ok) throw new Error('No se pudo cargar /config/master.json');
            window.CVConfig = await configRes.json();
            localStorage.setItem('cv_master_config', JSON.stringify(window.CVConfig));
            console.log('📡 Configuración cargada del servidor por defecto');
        }

        // 2. Ejecutar renderizado
        await renderAllCV();

        // Notificar que el CV se ha cargado e inicializado
        document.dispatchEvent(new CustomEvent('cv-loaded'));

    } catch (err) {
        console.error('❌ Error crítico en inicio:', err);
    } finally {
        console.groupEnd();
    }
}

/**
 * Renderiza todo el CV a partir de window.CVConfig y window.CVSectionsData
 */
async function renderAllCV() {
    const config = window.CVConfig;
    if (!config) return;

    applyTheme(config.theme, config.layout);
    setupGrid(config.layout);

    const page = document.getElementById('cv-page');
    // Guardar pantalla de carga si existe, si no, limpiar todo
    const loadingScreen = document.getElementById('loading-screen');
    page.innerHTML = '';
    if (loadingScreen) {
        page.appendChild(loadingScreen);
    }

    const debugLvl = config.layout.debugLayout || 0;
    if (debugLvl > 0) {
        page.className = 'page-a4';
        page.classList.add(`debug-level-${debugLvl}`);
    } else {
        page.className = 'page-a4';
    }

    // Identificar áreas de grid activas según la configuración
    const areas = [...new Set(config.layout.gridAreas.flatMap(r => r.split(' ')))];
    const areaEls = {};
    const areaWeights = {};

    areas.forEach(name => {
        const div = document.createElement('div');
        div.className = `area-container area-${name}`;
        div.style.gridArea = name;
        div.dataset.area = name;
        page.appendChild(div);
        areaEls[name] = div;
        areaWeights[name] = 0;
    });

    // Calcular pesos de secciones por área
    config.sections.forEach(sec => {
        if (sec.disabled) return; // Omitir secciones deshabilitadas por el usuario
        const w = sec.weight;
        if (typeof w === 'number' && w > 0 && areaWeights[sec.area] !== undefined) {
            areaWeights[sec.area] += w;
        }
    });

    // Renderizar secciones activas en el orden de la configuración
    for (const sec of config.sections) {
        if (sec.disabled) continue; // Omitir secciones deshabilitadas
        const target = areaEls[sec.area];
        if (target) {
            const el = await renderSection(sec, target);
            if (debugLvl > 0 && el) {
                const tag = document.createElement('div');
                tag.className = 'debug-section-tag';
                const w = sec.weight;
                if (w === true || w === 0 || !w) {
                    tag.innerText = `ID: ${sec.id} | W: AUTO`;
                } else if (typeof w === 'number') {
                    const totalW = areaWeights[sec.area];
                    const pct = totalW > 0 ? Math.round((w / totalW) * 100) : 0;
                    tag.innerText = `ID: ${sec.id} | W: ${w}/${totalW} (${pct}%)`;
                }
                el.prepend(tag);
            }
        }
    }

    if (document.getElementById('loading-screen')) {
        document.getElementById('loading-screen').remove();
    }
}

/**
 * Función global expuesta para volver a renderizar el CV en tiempo real al editar.
 */
window.refreshCV = async function() {
    console.log('🔄 Re-renderizando CV en tiempo real...');
    await renderAllCV();
    // Emitir evento para indicar que el CV se redibujó
    document.dispatchEvent(new CustomEvent('cv-refreshed'));
};

function applyTheme(theme, layout) {
    const r = document.documentElement;
    if (theme.primaryColor) r.style.setProperty('--primary', theme.primaryColor);
    if (theme.secondaryColor) r.style.setProperty('--accent', theme.secondaryColor);
    if (theme.sidebarColor) r.style.setProperty('--sidebar-bg', theme.sidebarColor);
    if (theme.textColor) r.style.setProperty('--text', theme.textColor);
    if (theme.backgroundColor) r.style.setProperty('--main-bg', theme.backgroundColor);
    if (theme.fontFamily) r.style.setProperty('--font', theme.fontFamily);
    if (layout && layout.sectionGap) r.style.setProperty('--section-gap', layout.sectionGap);
}

function setupGrid(layout) {
    const page = document.getElementById('cv-page');
    page.style.gridTemplateColumns = layout.columns || '200px 1fr';
    page.style.gridTemplateAreas = layout.gridAreas.map(r => `"${r}"`).join(' ');
}

async function renderSection(cfg, container) {
    const path = `/sections/${cfg.id}`;
    try {
        const htmlRes = await fetch(`${path}/template.html`);
        if (!htmlRes.ok) throw new Error(`Error al cargar plantilla de ${cfg.id}`);
        let tpl = await htmlRes.text();

        // Cargar Datos de la Sección (de Memoria, localStorage o Red)
        let data = window.CVSectionsData[cfg.id];
        if (!data) {
            const savedData = localStorage.getItem(`cv_section_data_${cfg.id}`);
            if (savedData) {
                data = JSON.parse(savedData);
                window.CVSectionsData[cfg.id] = data;
            } else {
                const dataRes = await fetch(`${path}/data.json`);
                data = dataRes.ok ? await dataRes.json() : {};
                window.CVSectionsData[cfg.id] = data;
                localStorage.setItem(`cv_section_data_${cfg.id}`, JSON.stringify(data));
            }
        }

        injectStyles(cfg.id, path);

        // Soporte básico para condicionales {{#if key}} ... {{/if}}
        tpl = tpl.replace(/{{\s*#if\s+(\w+)\s*}}([\s\S]*?){{\s*\/if\s*}}/g, (_, key, sub) => {
            return data[key] ? sub : '';
        });

        // Procesar bucles y variables
        tpl = tpl.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (_, key, sub) => {
            const list = data[key];
            if (!Array.isArray(list)) return '';
            let items = cfg.maxItems ? list.slice(0, cfg.maxItems) : list;
            const rendered = items.map(item => {
                let t = sub;
                // Soporte para arrays simples de strings con {{.}}
                if (typeof item !== 'object' || item === null) {
                    return t.replaceAll('{{.}}', String(item));
                }
                Object.entries(item).forEach(([k, v]) => {
                    t = t.replaceAll(`{{${k}}}`, String(v));
                });
                return t;
            }).join('');
            if (cfg.maxItems && list.length > cfg.maxItems && cfg.overflowStrategy === 'indicator') {
                const diff = list.length - cfg.maxItems;
                let unit = 'additional elements';
                if (cfg.id === 'experience') unit = diff === 1 ? 'additional role' : 'additional professional roles';
                if (cfg.id === 'education') unit = diff === 1 ? 'additional course/degree' : 'additional courses & degrees';

                return rendered + `
                    <div class="overflow-indicator">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        <span>+${diff} ${unit}</span>
                    </div>`;
            }
            return rendered;
        });

        Object.entries(data).forEach(([k, v]) => {
            if (typeof v !== 'object') tpl = tpl.replaceAll(`{{${k}}}`, String(v));
        });

        const el = document.createElement('section');
        el.className = `cv-section section-${cfg.id} mode-${cfg.mode || 'detailed'}`;

        const w = cfg.weight;
        if (typeof w === 'number' && w > 0) {
            el.style.flex = `${w} 1 0%`;
        } else if (w === true) {
            el.style.flex = '0 1 auto'; // Flexible pero puede encoger
        } else {
            el.style.flex = '0 0 auto'; // Fijo
        }

        el.innerHTML = tpl;
        container.appendChild(el);

        // Solo intentar cargar script.js si está marcado explícitamente
        if (cfg.hasScript === true) {
            await loadSectionScript(cfg.id, path, data, cfg, el);
        }
        return el;
    } catch (e) {
        console.warn(`[CV] ${cfg.id} omitido o error de renderizado:`, e.message);
    }
}

function injectStyles(id, path) {
    if (document.getElementById(`style-${id}`)) return;
    const l = document.createElement('link');
    l.id = `style-${id}`; l.rel = 'stylesheet'; l.href = `${path}/style.css`;
    document.head.appendChild(l);
}

async function loadSectionScript(id, path, data, cfg, el) {
    try {
        const res = await fetch(`${path}/script.js`);
        if (!res.ok) return;
        const code = await res.text();
        const scriptName = `section_${id.replace(/-/g, '_')}_script`;
        const fn = new Function('data', 'cfg', 'el', `${code}`);
        const result = fn(data, cfg, el);
        window[scriptName] = result;
        if (result && typeof result.init === 'function') result.init(data, cfg, el);
    } catch (e) {
        console.error(`[Script] Error en ${id}:`, e);
    }
}