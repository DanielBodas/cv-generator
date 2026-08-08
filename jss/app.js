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
        // 1. Cargar Configuración Maestra
        const savedConfig = localStorage.getItem('cv_master_config');

        // Siempre cargamos el master.json como referencia de defectos
        const configRes = await fetch('./config/master.json');
        if (!configRes.ok) throw new Error('No se pudo cargar config/master.json');
        const defaultConfig = await configRes.json();

        if (savedConfig) {
            window.CVConfig = JSON.parse(savedConfig);
            // Sanear valores problemáticos que no deben persistir entre sesiones
            sanitizeConfig(window.CVConfig, defaultConfig);
            console.log('📦 Configuración cargada de localStorage (saneada)');
        } else {
            window.CVConfig = defaultConfig;
            localStorage.setItem('cv_master_config', JSON.stringify(window.CVConfig));
            console.log('📡 Configuración cargada del servidor por defecto');
        }

        // 2. Ejecutar renderizado
        await renderAllCV();

        // Notificar que el CV se ha cargado inicializado (por si el panel de control está escuchando)
        document.dispatchEvent(new CustomEvent('cv-loaded'));

    } catch (err) {
        console.error('❌ Error crítico en inicio:', err);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="color: #ef4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 30px 20px; max-width: 600px; margin: 40px auto; border: 1px solid #fee2e2; background-color: #fef2f2; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">❌ Error crítico de inicialización</h3>
                    <p style="font-size: 14px; margin: 0 0 15px 0; color: #991b1b; line-height: 1.5;">Ocurrió un error inesperado al intentar construir o cargar tu CV:</p>
                    <pre style="background: #ffffff; color: #b91c1c; padding: 12px; border: 1px solid #fca5a5; border-radius: 6px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; text-align: left; overflow-x: auto; max-height: 250px; margin-bottom: 15px;">${err.stack || err.message || err}</pre>
                    <p style="font-size: 12px; color: #7f1d1d; margin: 0; line-height: 1.5; opacity: 0.85;">Revisa la consola del navegador o el formato del archivo <strong>config/master.json</strong> y de los datos JSON de las secciones.</p>
                </div>
            `;
        }
    } finally {
        console.groupEnd();
    }
}

/**
 * Sanea la configuración cargada de localStorage para corregir valores
 * problemáticos o desactualizados vs el master.json de referencia.
 */
function sanitizeConfig(config, defaultConfig) {
    // debugLayout nunca debe persistir entre sesiones
    if (config.layout) {
        config.layout.debugLayout = 0;
    }

    // Asegurar que todas las secciones del default existen en el config guardado
    // y tienen los campos de estructura correctos (mode, area, weight)
    if (config.sections && defaultConfig.sections) {
        defaultConfig.sections.forEach(defSec => {
            const saved = config.sections.find(s => s.id === defSec.id);
            if (saved) {
                // Restaurar campos estructurales si han quedado en un estado no válido
                if (!saved.area) saved.area = defSec.area;
                if (!saved.mode) saved.mode = defSec.mode;
                if (saved.weight === undefined) saved.weight = defSec.weight;
            }
        });
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

    // 1. Crear de forma síncrona los "caparazones" (shells) de las secciones para renderizar el layout primero.
    const activeShells = [];
    config.sections.forEach(sec => {
        if (sec.disabled) return;
        const target = areaEls[sec.area];
        if (target) {
            const el = createSectionShell(sec, target);
            activeShells.push({ cfg: sec, el });
        }
    });

    // 2. Cargar y renderizar cada sección individualmente y en paralelo.
    const renderPromises = activeShells.map(({ cfg, el }) => populateSection(cfg, el, areaWeights));
    await Promise.all(renderPromises);

    if (document.getElementById('loading-screen')) {
        document.getElementById('loading-screen').remove();
    }
}

/**
 * Crea el caparazón HTML de una sección en el área de layout correspondiente de forma síncrona.
 */
function createSectionShell(cfg, container) {
    const el = document.createElement('section');
    el.id = `section-${cfg.id}`;
    el.className = `cv-section section-${cfg.id} mode-${cfg.mode || 'detailed'}`;
    el.style.position = 'relative';

    const w = cfg.weight;
    if (typeof w === 'number' && w > 0) {
        el.style.flex = `${w} 1 0%`;
    } else if (w === true) {
        el.style.flex = '0 1 auto'; // Flexible pero puede encoger
    } else {
        el.style.flex = '0 0 auto'; // Fijo
    }

    container.appendChild(el);
    return el;
}

/**
 * Carga de forma asíncrona la plantilla, datos, estilos y scripts de una sección concreta y la renderiza.
 */
async function populateSection(cfg, el, areaWeights = null) {
    if (!el) return;
    const sectionId = cfg.id;
    const sectionRootPath = `./sections/${sectionId}`;
    let templatePath = sectionRootPath;
    if (cfg.component) {
        templatePath = `${sectionRootPath}/components/${cfg.component}`;
    }
    // Para retrocompatibilidad o por si languages no tiene componente en config inicial
    if (sectionId === 'languages' && !cfg.component) {
        templatePath = `${sectionRootPath}/components/bars`;
        cfg.component = 'bars';
    }

    try {
        const htmlRes = await fetch(`${templatePath}/template.html`);
        if (!htmlRes.ok) throw new Error(`Error al cargar plantilla de ${sectionId}`);
        let tpl = await htmlRes.text();

        // Cargar Datos de la Sección (de Memoria, localStorage o Red)
        let data = window.CVSectionsData[sectionId];
        if (!data) {
            const savedData = localStorage.getItem(`cv_section_data_${sectionId}`);
            if (savedData) {
                data = JSON.parse(savedData);
                window.CVSectionsData[sectionId] = data;
            } else {
                const dataRes = await fetch(`${sectionRootPath}/data.json`);
                data = dataRes.ok ? await dataRes.json() : {};
                window.CVSectionsData[sectionId] = data;
                localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(data));
            }
        }

        await injectStyles(sectionId, templatePath);

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

        // Asegurar clases del caparazón
        el.className = `cv-section section-${cfg.id} mode-${cfg.mode || 'detailed'}`;
        const w = cfg.weight;
        if (typeof w === 'number' && w > 0) {
            el.style.flex = `${w} 1 0%`;
        } else if (w === true) {
            el.style.flex = '0 1 auto';
        } else {
            el.style.flex = '0 0 auto';
        }

        const toolbarHtml = `
            <div class="inline-toolbar hide-on-print">
                <button class="toolbar-btn btn-edit-data" data-section="${cfg.id}" title="Editar Datos">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <div class="toolbar-divider"></div>
                <button class="toolbar-btn btn-change-layout" data-section="${cfg.id}" title="Cambiar Componente">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </button>
            </div>
        `;

        el.innerHTML = toolbarHtml + tpl;

        // Solo intentar cargar script.js si está marcado explícitamente
        if (cfg.hasScript === true) {
            await loadSectionScript(cfg.id, templatePath, data, cfg, el);
        }

        const debugLvl = window.CVConfig.layout.debugLayout || 0;
        if (debugLvl > 0) {
            // Eliminar debug previa si existía
            const oldTag = el.querySelector('.debug-section-tag');
            if (oldTag) oldTag.remove();

            const tag = document.createElement('div');
            tag.className = 'debug-section-tag';
            const w = cfg.weight;

            let totalW = 0;
            if (areaWeights && areaWeights[cfg.area] !== undefined) {
                totalW = areaWeights[cfg.area];
            } else {
                window.CVConfig.sections.forEach(sec => {
                    if (sec.disabled) return;
                    const sw = sec.weight;
                    if (sec.area === cfg.area && typeof sw === 'number' && sw > 0) {
                        totalW += sw;
                    }
                });
            }

            if (w === true || w === 0 || !w) {
                tag.innerText = `ID: ${cfg.id} | W: AUTO`;
            } else if (typeof w === 'number') {
                const pct = totalW > 0 ? Math.round((w / totalW) * 100) : 0;
                tag.innerText = `ID: ${cfg.id} | W: ${w}/${totalW} (${pct}%)`;
            }
            el.prepend(tag);
        }

        return el;
    } catch (e) {
        console.warn(`[CV] ${cfg.id} omitido o error de renderizado:`, e.message);
    }
}

/**
 * Función global expuesta para volver a renderizar el CV completo.
 */
window.refreshCV = async function() {
    console.log('🔄 Re-renderizando CV completo en tiempo real...');
    await renderAllCV();
    // Emitir evento para indicar que el CV se redibujó
    document.dispatchEvent(new CustomEvent('cv-refreshed'));
};

/**
 * Función global expuesta para volver a renderizar únicamente una sección.
 */
window.refreshSection = async function(sectionId) {
    console.log(`🔄 Re-renderizando sección individual: ${sectionId}...`);
    const config = window.CVConfig;
    if (!config) return;
    const sec = config.sections.find(s => s.id === sectionId);
    if (!sec || sec.disabled) return;
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
        await populateSection(sec, el);
    }
    // Emitir evento para indicar que el CV se redibujó de alguna forma
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

function injectStyles(sectionId, path) {
    return new Promise((resolve) => {
        // Usar la ruta completa como id para distinguir componentes distintos
        const styleId = `style-${path.replace(/[^a-z0-9]/gi, '-')}`;

        // Si ya existe este estilo concreto, no hace falta recargarlo
        if (document.getElementById(styleId)) {
            return resolve();
        }

        // Eliminar el estilo previo de esta sección si existía con otra ruta (cambio de componente)
        const oldStyle = document.querySelector(`link[id^="style-"][id*="${sectionId}"]`);
        if (oldStyle && oldStyle.id !== styleId) {
            oldStyle.remove();
        }

        const l = document.createElement('link');
        l.id = styleId;
        l.rel = 'stylesheet'; 
        l.href = `${path}/style.css`;
        l.onload = () => resolve();
        l.onerror = () => resolve();
        document.head.appendChild(l);
    });
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