/**
 * CV Modular Engine - PROACTIVE LAYOUT EDITION
 * No solo detecta el overflow, sino que intenta corregirlo dinámicamente.
 */

document.addEventListener('DOMContentLoaded', initCV);

async function initCV() {
    console.group('%c🚀 CV Engine: Iniciando carga inteligente...', 'color: #1d3557; font-weight: bold; font-size: 14px;');
    try {
        const configRes = await fetch('./config/master.json');
        if (!configRes.ok) throw new Error('No se pudo cargar config/master.json');
        const config = await configRes.json();

        applyTheme(config.theme, config.layout);
        setupGrid(config.layout);

        const page = document.getElementById('cv-page');
        page.innerHTML = '';

        const debugLvl = config.layout.debugLayout || 0;
        if (debugLvl > 0) page.classList.add(`debug-level-${debugLvl}`);

        // Áreas
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

        config.sections.forEach(sec => {
            const w = sec.weight;
            if (typeof w === 'number' && w > 0 && areaWeights[sec.area] !== undefined) {
                areaWeights[sec.area] += w;
            }
        });

        for (const sec of config.sections) {
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

        if (document.getElementById('loading-screen')) document.getElementById('loading-screen').remove();

        // ── AJUSTE DINÁMICO DE OVERFLOW ──

    } catch (err) {
        console.error('❌ Error crítico:', err);
        console.groupEnd();
    }
}

/**
 * Revisa y corrige el layout si detecta que las piezas no encajan.
 */
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
    page.style.gridTemplateColumns = layout.columns || '210px 1fr';
    page.style.gridTemplateAreas = layout.gridAreas.map(r => `"${r}"`).join(' ');
}

async function renderSection(cfg, container) {
    const path = `./sections/${cfg.id}`;
    try {
        const [htmlRes, dataRes] = await Promise.all([
            fetch(`${path}/template.html`),
            fetch(`${path}/data.json`)
        ]);
        if (!htmlRes.ok || !dataRes.ok) throw new Error(`Error carga ${cfg.id}`);
        let tpl = await htmlRes.text();
        const data = await dataRes.json();
        injectStyles(cfg.id, path);

        // Soporte básico para condicionales {{#if key}} ... {{/if}}
        tpl = tpl.replace(/{{\s*#if\s+(\w+)\s*}}([\s\S]*?){{\s*\/if\s*}}/g, (_, key, sub) => {
            return data[key] ? sub : '';
        });

        // Procesar bucles y variables (Misma lógica anterior)
        tpl = tpl.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (_, key, sub) => {
            const list = data[key];
            if (!Array.isArray(list)) return '';
            let items = cfg.maxItems ? list.slice(0, cfg.maxItems) : list;
            const rendered = items.map(item => {
                let t = sub;
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
        console.warn(`[CV] ${cfg.id} omitido:`, e.message);
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
