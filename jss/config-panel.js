/**
 * CV Modular Engine - CONFIGURADOR INTERACTIVO SaaS PREMIUM
 * Gestiona la interfaz del editor de alta fidelidad, la automatización de guardado,
 * la generación dinámica de acordeones colapsables, presets de temas y persistencia.
 */

document.addEventListener('cv-loaded', () => {
    initConfigPanel();
});

// Fallback por si el evento ya se disparó
if (window.CVConfig && !window.ConfigPanelInitialized) {
    initConfigPanel();
}

function initConfigPanel() {
    if (window.ConfigPanelInitialized) return;
    window.ConfigPanelInitialized = true;

    console.group('%c💎 CV Configurator Premium: Inicializando...', 'color: #6366f1; font-weight: bold;');

    // Crear el LED indicador de sincronización en tiempo real
    createLiveSavedBadge();

    // 1. GESTIÓN DEL PLEGADO DEL PANEL
    const configPanel = document.getElementById('config-panel');
    const togglePanelBtn = document.getElementById('toggle-panel-btn');
    const floatingSettingsBtn = document.getElementById('floating-settings-btn');

    function togglePanel(collapse) {
        if (collapse) {
            configPanel.classList.add('collapsed');
            floatingSettingsBtn.style.display = 'block';
        } else {
            configPanel.classList.remove('collapsed');
            floatingSettingsBtn.style.display = 'none';
        }
    }

    togglePanelBtn.addEventListener('click', () => togglePanel(true));
    floatingSettingsBtn.addEventListener('click', () => togglePanel(false));

    // 2. NAVEGACIÓN POR PESTAÑAS CON TRANSICIONES
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const activeContent = document.getElementById(tabId);
            activeContent.style.display = 'flex';
            // Pequeño timeout para activar animación de transición
            setTimeout(() => {
                activeContent.classList.add('active');
            }, 50);

            // Recargar datos específicos según la pestaña elegida
            if (tabId === 'tab-sections') {
                renderSectionsTab();
            } else if (tabId === 'tab-content') {
                renderPremiumContentTab();
            } else if (tabId === 'tab-ats') {
                runATSAudit();
            } else if (tabId === 'tab-actions') {
                renderActionsTab();
            }
        });
    });

    // Registrar actualización en tiempo real cuando el CV cambia
    document.addEventListener('cv-refreshed', () => {
        const atsTabButton = document.querySelector('.tab-btn[data-tab="tab-ats"]');
        if (atsTabButton && atsTabButton.classList.contains('active')) {
            runATSAudit();
        }
    });

    document.addEventListener('cv-loaded', () => {
        const atsTabButton = document.querySelector('.tab-btn[data-tab="tab-ats"]');
        if (atsTabButton && atsTabButton.classList.contains('active')) {
            runATSAudit();
        }
    });

    // 3. INICIALIZAR PESTAÑAS INDIVIDUALES
    initThemeTab();
    initActionsTab();

    console.groupEnd();
}

/**
 * Crea e inyecta la luz LED de guardado automático en tiempo real
 */
function createLiveSavedBadge() {
    if (document.getElementById('live-saved-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'live-saved-badge';
    badge.className = 'live-saved-badge hide-on-print';
    badge.innerHTML = '<span class="live-saved-dot"></span><span>Sincronizado</span>';
    document.body.appendChild(badge);
}

/**
 * Hace parpadear el badge de guardado para simular una operación en caliente
 */
function triggerSaveAnimation() {
    const badge = document.getElementById('live-saved-badge');
    if (!badge) return;
    badge.style.borderColor = 'var(--color-success)';
    badge.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.2)';

    const textSpan = badge.querySelector('span:not(.live-saved-dot)');
    if (textSpan) textSpan.innerText = 'Guardando…';

    setTimeout(() => {
        badge.style.borderColor = '#1e293b';
        badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        if (textSpan) textSpan.innerText = 'Sincronizado';
    }, 800);
}

/* ============================================================
   PESTAÑA 1: TEMA Y ESTILOS (Y PRESETS)
   ============================================================ */
function initThemeTab() {
    const config = window.CVConfig;
    if (!config) return;

    const themeContainer = document.getElementById('tab-theme');

    // Crear y añadir la sección de "Presets" al principio de la pestaña Estilos
    if (!document.getElementById('presets-section')) {
        const presetsSection = document.createElement('div');
        presetsSection.id = 'presets-section';
        presetsSection.innerHTML = `
            <h3>Temas Rápidos SaaS</h3>
            <p class="desc">Aplica combinaciones de colores premium prediseñadas al instante.</p>
            <div class="presets-grid">
                <button class="preset-btn" data-preset="navy">
                    <span>⚓ Classic Navy</span>
                    <div class="preset-colors">
                        <div class="preset-color-dot" style="background: #1d3557;"></div>
                        <div class="preset-color-dot" style="background: #457b9d;"></div>
                        <div class="preset-color-dot" style="background: #1d3557;"></div>
                    </div>
                </button>
                <button class="preset-btn" data-preset="midnight">
                    <span>🌌 Midnight Executive</span>
                    <div class="preset-colors">
                        <div class="preset-color-dot" style="background: #0f172a;"></div>
                        <div class="preset-color-dot" style="background: #3b82f6;"></div>
                        <div class="preset-color-dot" style="background: #0f172a;"></div>
                    </div>
                </button>
                <button class="preset-btn" data-preset="emerald">
                    <span>🌲 Minimal Forest</span>
                    <div class="preset-colors">
                        <div class="preset-color-dot" style="background: #064e3b;"></div>
                        <div class="preset-color-dot" style="background: #10b981;"></div>
                        <div class="preset-color-dot" style="background: #064e3b;"></div>
                    </div>
                </button>
                <button class="preset-btn" data-preset="charcoal">
                    <span>🎸 Slate Rose</span>
                    <div class="preset-colors">
                        <div class="preset-color-dot" style="background: #27272a;"></div>
                        <div class="preset-color-dot" style="background: #f43f5e;"></div>
                        <div class="preset-color-dot" style="background: #27272a;"></div>
                    </div>
                </button>
            </div>
        `;
        // Inyectar antes del primer elemento hijo de la pestaña
        themeContainer.prepend(presetsSection);

        // Asociar eventos a los presets
        const presets = {
            navy: { primary: '#1d3557', secondary: '#457b9d', sidebar: '#1d3557' },
            midnight: { primary: '#0f172a', secondary: '#3b82f6', sidebar: '#0f172a' },
            emerald: { primary: '#064e3b', secondary: '#10b981', sidebar: '#064e3b' },
            charcoal: { primary: '#27272a', secondary: '#f43f5e', sidebar: '#27272a' }
        };

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-preset');
                const colors = presets[id];
                if (colors) {
                    config.theme.primaryColor = colors.primary;
                    config.theme.secondaryColor = colors.secondary;
                    config.theme.sidebarColor = colors.sidebar;

                    // Sincronizar inputs
                    document.getElementById('theme-primary').value = colors.primary;
                    document.getElementById('theme-secondary').value = colors.secondary;
                    document.getElementById('theme-sidebar').value = colors.sidebar;

                    saveConfig();
                    window.refreshCV();
                    triggerSaveAnimation();
                }
            });
        });
    }

    // Obtener campos de entrada
    const primaryInput = document.getElementById('theme-primary');
    const secondaryInput = document.getElementById('theme-secondary');
    const sidebarInput = document.getElementById('theme-sidebar');
    const textInput = document.getElementById('theme-text');
    const bgInput = document.getElementById('theme-bg');

    const fontSelect = document.getElementById('theme-font');
    const sectionGapInput = document.getElementById('layout-section-gap');
    const sidebarWidthInput = document.getElementById('layout-sidebar-width');
    const debugSelect = document.getElementById('layout-debug');

    // Cargar valores iniciales del tema
    if (config.theme) {
        primaryInput.value = rgbToHex(getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()) || config.theme.primaryColor || '#1d3557';
        secondaryInput.value = rgbToHex(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()) || config.theme.secondaryColor || '#457b9d';
        sidebarInput.value = rgbToHex(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg').trim()) || config.theme.sidebarColor || '#1d3557';
        textInput.value = rgbToHex(getComputedStyle(document.documentElement).getPropertyValue('--text').trim()) || config.theme.textColor || '#1e293b';
        bgInput.value = rgbToHex(getComputedStyle(document.documentElement).getPropertyValue('--main-bg').trim()) || config.theme.backgroundColor || '#ffffff';

        if (config.theme.fontFamily) {
            fontSelect.value = config.theme.fontFamily;
        }
    }

    // Cargar valores iniciales de layout
    if (config.layout) {
        sectionGapInput.value = config.layout.sectionGap || '12px';
        sidebarWidthInput.value = config.layout.columns ? config.layout.columns.split(' ')[0] : '200px';
        debugSelect.value = config.layout.debugLayout || '0';
    }

    // Funciones auxiliares para actualizar y refrescar
    function updateThemeField(key, value) {
        config.theme[key] = value;
        saveConfig();
        window.refreshCV();
        triggerSaveAnimation();
    }

    function updateLayoutField(key, value) {
        config.layout[key] = value;
        saveConfig();
        window.refreshCV();
        triggerSaveAnimation();
    }

    // Asociar escuchadores de eventos
    primaryInput.addEventListener('input', (e) => updateThemeField('primaryColor', e.target.value));
    secondaryInput.addEventListener('input', (e) => updateThemeField('secondaryColor', e.target.value));
    sidebarInput.addEventListener('input', (e) => updateThemeField('sidebarColor', e.target.value));
    textInput.addEventListener('input', (e) => updateThemeField('textColor', e.target.value));
    bgInput.addEventListener('input', (e) => updateThemeField('backgroundColor', e.target.value));

    fontSelect.addEventListener('change', (e) => updateThemeField('fontFamily', e.target.value));

    sectionGapInput.addEventListener('change', (e) => {
        updateLayoutField('sectionGap', e.target.value);
    });

    sidebarWidthInput.addEventListener('change', (e) => {
        const val = e.target.value || '200px';
        config.layout.columns = `${val} 1fr`;
        saveConfig();
        window.refreshCV();
        triggerSaveAnimation();
    });

    debugSelect.addEventListener('change', (e) => {
        updateLayoutField('debugLayout', parseInt(e.target.value, 10));
    });
}

function rgbToHex(rgb) {
    if (!rgb) return null;
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) return null;
    return "#" + ("0" + parseInt(match[1],10).toString(16)).slice(-2) +
                 ("0" + parseInt(match[2],10).toString(16)).slice(-2) +
                 ("0" + parseInt(match[3],10).toString(16)).slice(-2);
}

/* ============================================================
   PESTAÑA 2: SECCIONES Y ESTRUCTURA (ORDENAMIENTO)
   ============================================================ */
function renderSectionsTab() {
    const listContainer = document.getElementById('sections-list');
    listContainer.innerHTML = '';

    const config = window.CVConfig;
    if (!config || !config.sections) return;

    config.sections.forEach((sec, index) => {
        const card = document.createElement('div');
        card.className = `section-item-card ${sec.disabled ? 'disabled' : ''}`;

        // Cabecera del item
        const header = document.createElement('div');
        header.className = 'section-card-header';

        const title = document.createElement('div');
        title.className = 'section-card-title';
        title.innerHTML = `<span>📂</span> <strong>${sec.id}</strong>`;

        const controls = document.createElement('div');
        controls.className = 'section-card-controls';

        // Toggle Activo/Inactivo de alta calidad
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !sec.disabled;
        checkbox.title = sec.disabled ? 'Activar sección' : 'Desactivar sección';
        checkbox.addEventListener('change', () => {
            sec.disabled = !checkbox.checked;
            saveConfig();
            window.refreshCV();
            renderSectionsTab();
            triggerSaveAnimation();
        });

        // Botón Subir
        const btnUp = document.createElement('button');
        btnUp.className = 'card-btn move-up';
        btnUp.innerHTML = '▲';
        btnUp.disabled = index === 0;
        btnUp.addEventListener('click', () => {
            if (index > 0) {
                config.sections.splice(index - 1, 0, config.sections.splice(index, 1)[0]);
                saveConfig();
                window.refreshCV();
                renderSectionsTab();
                triggerSaveAnimation();
            }
        });

        // Botón Bajar
        const btnDown = document.createElement('button');
        btnDown.className = 'card-btn move-down';
        btnDown.innerHTML = '▼';
        btnDown.disabled = index === config.sections.length - 1;
        btnDown.addEventListener('click', () => {
            if (index < config.sections.length - 1) {
                config.sections.splice(index + 1, 0, config.sections.splice(index, 1)[0]);
                saveConfig();
                window.refreshCV();
                renderSectionsTab();
                triggerSaveAnimation();
            }
        });

        controls.appendChild(checkbox);
        controls.appendChild(btnUp);
        controls.appendChild(btnDown);
        header.appendChild(title);
        header.appendChild(controls);
        card.appendChild(header);

        // Si está activa, mostrar configuraciones rápidas de la sección
        if (!sec.disabled) {
            const body = document.createElement('div');
            body.className = 'section-card-body';

            // Campo de Área
            const fieldArea = document.createElement('div');
            fieldArea.className = 'card-field';
            fieldArea.innerHTML = `
                <label>Área</label>
                <select class="sec-area-select">
                    <option value="sidebar" ${sec.area === 'sidebar' ? 'selected' : ''}>Sidebar</option>
                    <option value="main" ${sec.area === 'main' ? 'selected' : ''}>Main</option>
                </select>
            `;
            fieldArea.querySelector('select').addEventListener('change', (e) => {
                sec.area = e.target.value;
                saveConfig();
                window.refreshCV();
                triggerSaveAnimation();
            });

            // Campo de Peso (Weight)
            const fieldWeight = document.createElement('div');
            fieldWeight.className = 'card-field';
            const weightVal = (sec.weight === true) ? 'true' : (sec.weight || 0);
            fieldWeight.innerHTML = `
                <label>Peso (Flex)</label>
                <input type="text" class="sec-weight-input" value="${weightVal}" placeholder="ej. 1, 3, true">
            `;
            fieldWeight.querySelector('input').addEventListener('change', (e) => {
                const val = e.target.value.trim();
                if (val === 'true') {
                    sec.weight = true;
                } else if (val === 'false' || val === '0' || !val) {
                    sec.weight = 0;
                } else {
                    const num = parseInt(val, 10);
                    sec.weight = isNaN(num) ? 0 : num;
                }
                saveConfig();
                window.refreshCV();
                triggerSaveAnimation();
            });

            body.appendChild(fieldArea);
            body.appendChild(fieldWeight);
            card.appendChild(body);
        }

        listContainer.appendChild(card);
    });
}

/* ============================================================
   PESTAÑA 3: EDITOR DE ACORDEONES PREMIUM
   ============================================================ */
let activeAccordionSectionId = null;

function renderPremiumContentTab() {
    const config = window.CVConfig;
    if (!config || !config.sections) return;

    // Obtener contenedores
    const selector = document.getElementById('content-section-selector');
    // Para no romper la maquetación del index, ocultamos el selector viejo aburrido de forma estética
    selector.parentElement.style.display = 'none';

    const visualBtn = document.getElementById('mode-visual-btn');
    const jsonBtn = document.getElementById('mode-json-btn');
    const visualCont = document.getElementById('visual-editor-container');
    const jsonCont = document.getElementById('json-editor-container');

    // Inicializar evento para alternar modo Visual / JSON
    visualBtn.onclick = () => {
        visualBtn.classList.add('active');
        jsonBtn.classList.remove('active');
        visualCont.classList.add('active');
        jsonCont.classList.remove('active');
        renderPremiumContentTab();
    };

    jsonBtn.onclick = () => {
        jsonBtn.classList.add('active');
        visualBtn.classList.remove('active');
        jsonCont.classList.add('active');
        visualCont.classList.remove('active');
        renderPremiumContentTab();
    };

    if (jsonCont.classList.contains('active')) {
        // En modo JSON usamos un acordeón simplificado o un selector para editar el crudo
        selector.parentElement.style.display = 'flex';
        if (!activeAccordionSectionId) activeAccordionSectionId = config.sections[0].id;
        document.getElementById('raw-json-textarea').value = JSON.stringify(window.CVSectionsData[activeAccordionSectionId] || {}, null, 4);

        // Botón aplicar JSON Crudo
        const applyJsonBtn = document.getElementById('apply-json-btn');
        applyJsonBtn.onclick = () => {
            const text = document.getElementById('raw-json-textarea').value;
            try {
                const data = JSON.parse(text);
                window.CVSectionsData[activeAccordionSectionId] = data;
                localStorage.setItem(`cv_section_data_${activeAccordionSectionId}`, JSON.stringify(data));
                window.refreshCV();
                triggerSaveAnimation();
                alert(`✅ JSON aplicado correctamente para ${activeAccordionSectionId}`);
            } catch (e) {
                alert(`❌ Error de Sintaxis JSON:\n${e.message}`);
            }
        };
        return;
    }

    // MODO VISUAL - ACORDEONES DINÁMICOS PREMIUM
    visualCont.innerHTML = '';

    config.sections.forEach(sec => {
        const data = window.CVSectionsData[sec.id] || {};

        const accordion = document.createElement('div');
        accordion.className = `accordion-item ${activeAccordionSectionId === sec.id ? 'expanded' : ''}`;
        accordion.dataset.id = sec.id;

        // Cabecera del acordeón
        const header = document.createElement('div');
        header.className = 'accordion-header';

        const textContainer = document.createElement('div');
        textContainer.className = 'accordion-title';
        textContainer.innerHTML = `<span>📝</span> <strong>${sec.id.toUpperCase()}</strong> ${sec.disabled ? '<span style="font-size:10px; opacity:0.5;">(Oculta)</span>' : ''}`;

        const arrow = document.createElement('span');
        arrow.className = 'accordion-arrow';
        arrow.innerText = '▼';

        header.appendChild(textContainer);
        header.appendChild(arrow);
        accordion.appendChild(header);

        // Cuerpo del acordeón
        const body = document.createElement('div');
        body.className = 'accordion-body';

        // Generar campos de formulario del acordeón
        const form = document.createElement('div');
        form.className = 'dynamic-form';
        generatePremiumFormFields(data, form, [], sec.id);
        body.appendChild(form);
        accordion.appendChild(body);

        // Evento de click para colapsar/desplegar acordeón
        header.addEventListener('click', () => {
            const wasExpanded = accordion.classList.contains('expanded');
            // Colapsar todos
            document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('expanded'));

            if (!wasExpanded) {
                accordion.classList.add('expanded');
                activeAccordionSectionId = sec.id;
            } else {
                activeAccordionSectionId = null;
            }
        });

        visualCont.appendChild(accordion);
    });
}

/**
 * Generador Recursivo de Campos de Formulario Premium optimizado para Grids
 */
function generatePremiumFormFields(obj, parentElement, pathKeys, sectionId) {
    if (typeof obj !== 'object' || obj === null) return;

    // Crear un contenedor de grid para campos simples consecutivos
    let gridContainer = null;

    Object.entries(obj).forEach(([key, val]) => {
        const currentPath = [...pathKeys, key];
        const labelText = key.replace(/_/g, ' ').toUpperCase();

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        if (typeof val === 'string') {
            const label = document.createElement('label');
            label.innerText = labelText;
            formGroup.appendChild(label);

            let input;
            // Si el texto es largo, usar un textarea de alta gama
            if (val.length > 60 || key.toLowerCase().includes('desc') || key.toLowerCase().includes('about') || key.toLowerCase().includes('profile')) {
                input = document.createElement('textarea');
                input.rows = 4;
                formGroup.appendChild(input);

                // Textareas van fuera de rejilla para ocupar el 100% del ancho
                parentElement.appendChild(formGroup);
                gridContainer = null; // Reiniciar rejilla
            } else {
                input = document.createElement('input');
                input.type = 'text';
                formGroup.appendChild(input);

                // Campos de texto cortos se agrupan en rejilla de 2 columnas
                if (!gridContainer) {
                    gridContainer = document.createElement('div');
                    gridContainer.style.display = 'grid';
                    gridContainer.style.gridTemplateColumns = '1fr 1fr';
                    gridContainer.style.gap = '12px';
                    parentElement.appendChild(gridContainer);
                }
                gridContainer.appendChild(formGroup);
            }

            input.value = val;
            input.addEventListener('change', (e) => {
                updateNestedValue(window.CVSectionsData[sectionId], currentPath, e.target.value);
                saveSectionData(sectionId);
                window.refreshCV();
                triggerSaveAnimation();
            });

        } else if (typeof val === 'number') {
            const label = document.createElement('label');
            label.innerText = labelText;
            formGroup.appendChild(label);

            const input = document.createElement('input');
            input.type = 'number';
            input.value = val;
            input.addEventListener('change', (e) => {
                updateNestedValue(window.CVSectionsData[sectionId], currentPath, parseFloat(e.target.value));
                saveSectionData(sectionId);
                window.refreshCV();
                triggerSaveAnimation();
            });
            formGroup.appendChild(input);

            // Números se agrupan en la rejilla activa
            if (!gridContainer) {
                gridContainer = document.createElement('div');
                gridContainer.style.display = 'grid';
                gridContainer.style.gridTemplateColumns = '1fr 1fr';
                gridContainer.style.gap = '12px';
                parentElement.appendChild(gridContainer);
            }
            gridContainer.appendChild(formGroup);

        } else if (Array.isArray(val)) {
            gridContainer = null; // Reiniciar rejilla para dar paso a la lista

            const label = document.createElement('label');
            label.innerHTML = `<strong style="color: #818cf8;">📁 ${labelText} (Colección)</strong>`;
            formGroup.appendChild(label);

            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'dynamic-form-array';

            // Dibujar cada tarjeta de elemento del array
            val.forEach((item, idx) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'array-item-card';

                // Barra de control del elemento con micro-botones
                const controls = document.createElement('div');
                controls.className = 'array-item-controls';

                const btnUp = document.createElement('button');
                btnUp.className = 'card-btn';
                btnUp.innerText = '▲';
                btnUp.disabled = idx === 0;
                btnUp.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (idx > 0) {
                        val.splice(idx - 1, 0, val.splice(idx, 1)[0]);
                        saveSectionData(sectionId);
                        window.refreshCV();
                        renderPremiumContentTab();
                        triggerSaveAnimation();
                    }
                });

                const btnDown = document.createElement('button');
                btnDown.className = 'card-btn';
                btnDown.innerText = '▼';
                btnDown.disabled = idx === val.length - 1;
                btnDown.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (idx < val.length - 1) {
                        val.splice(idx + 1, 0, val.splice(idx, 1)[0]);
                        saveSectionData(sectionId);
                        window.refreshCV();
                        renderPremiumContentTab();
                        triggerSaveAnimation();
                    }
                });

                const btnDelete = document.createElement('button');
                btnDelete.className = 'card-btn';
                btnDelete.style.background = 'rgba(239, 68, 68, 0.15)';
                btnDelete.style.color = '#f87171';
                btnDelete.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                btnDelete.innerText = '🗑️';
                btnDelete.title = 'Eliminar elemento';
                btnDelete.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('¿Seguro que deseas eliminar este elemento de la lista?')) {
                        val.splice(idx, 1);
                        saveSectionData(sectionId);
                        window.refreshCV();
                        renderPremiumContentTab();
                        triggerSaveAnimation();
                    }
                });

                controls.appendChild(btnUp);
                controls.appendChild(btnDown);
                controls.appendChild(btnDelete);
                itemCard.appendChild(controls);

                // Si es un objeto, recursión para dibujar sus propiedades internas
                if (typeof item === 'object' && item !== null) {
                    generatePremiumFormFields(item, itemCard, [...currentPath, idx], sectionId);
                } else {
                    // Array de strings simple
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = String(item);
                    input.addEventListener('change', (e) => {
                        updateNestedValue(window.CVSectionsData[sectionId], [...currentPath, idx], e.target.value);
                        saveSectionData(sectionId);
                        window.refreshCV();
                        triggerSaveAnimation();
                    });
                    itemCard.appendChild(input);
                }

                arrayContainer.appendChild(itemCard);
            });

            // Botón para añadir un nuevo elemento de estilo premium
            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn-add-item';
            btnAdd.innerText = `➕ Añadir nuevo elemento a ${labelText.toLowerCase()}`;
            btnAdd.addEventListener('click', (e) => {
                e.preventDefault();
                let newItem = "";
                if (val.length > 0) {
                    const templateItem = val[0];
                    if (typeof templateItem === 'object' && templateItem !== null) {
                        newItem = {};
                        Object.keys(templateItem).forEach(k => {
                            newItem[k] = typeof templateItem[k] === 'number' ? 0 : "";
                        });
                    }
                } else {
                    newItem = {};
                }

                val.push(newItem);
                saveSectionData(sectionId);
                window.refreshCV();
                renderPremiumContentTab();
                triggerSaveAnimation();
            });

            formGroup.appendChild(arrayContainer);
            formGroup.appendChild(btnAdd);
            parentElement.appendChild(formGroup);

        } else if (typeof val === 'object' && val !== null) {
            gridContainer = null; // Reiniciar rejilla

            const label = document.createElement('label');
            label.innerHTML = `<strong>📦 ${labelText}</strong>`;
            formGroup.appendChild(label);

            const subContainer = document.createElement('div');
            subContainer.style.borderLeft = '2px solid var(--panel-border)';
            subContainer.style.paddingLeft = '12px';
            subContainer.style.marginTop = '6px';
            subContainer.style.display = 'flex';
            subContainer.style.flexDirection = 'column';
            subContainer.style.gap = '12px';

            generatePremiumFormFields(val, subContainer, currentPath, sectionId);

            formGroup.appendChild(subContainer);
            parentElement.appendChild(formGroup);
        }
    });
}

/**
 * Función utilitaria para actualizar propiedades en rutas anidadas dinámicamente
 */
function updateNestedValue(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
}

/* ============================================================
   PESTAÑA 4: EXPORTAR, GUARDAR Y ACCIONES GLOBALES
   ============================================================ */
function initActionsTab() {
    // Botón de restablecer
    const resetBtn = document.getElementById('btn-reset-default');
    resetBtn.onclick = () => {
        if (confirm('⚠️ ¿Estás seguro de que deseas restablecer el CV a los valores por defecto del repositorio?\nSe borrarán todos tus cambios en el navegador.')) {
            localStorage.clear();
            location.reload();
        }
    };

    // Botón Exportar Consolidado
    const exportBtn = document.getElementById('btn-export-consolidated');
    exportBtn.onclick = () => {
        const fullBackup = {
            masterConfig: window.CVConfig,
            sectionsData: window.CVSectionsData
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 4));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "cv_completo_backup.json");
        dlAnchorElem.click();
    };

    // Importar configuración
    const importBtnTrigger = document.getElementById('btn-import-config-trigger');
    const importFileInput = document.getElementById('import-config-file');

    importBtnTrigger.onclick = () => {
        importFileInput.click();
    };

    importFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.masterConfig && data.sectionsData) {
                    window.CVConfig = data.masterConfig;
                    window.CVSectionsData = data.sectionsData;

                    // Guardar todo en localStorage
                    localStorage.setItem('cv_master_config', JSON.stringify(window.CVConfig));
                    Object.entries(window.CVSectionsData).forEach(([secId, secVal]) => {
                        localStorage.setItem(`cv_section_data_${secId}`, JSON.stringify(secVal));
                    });

                    // Refrescar y avisar
                    window.refreshCV();
                    triggerSaveAnimation();
                    alert('✅ Configuración del CV importada y aplicada correctamente.');
                    location.reload();
                } else {
                    alert('❌ Archivo de copia de seguridad inválido. Falta masterConfig o sectionsData.');
                }
            } catch (err) {
                alert('❌ Error al analizar el archivo de configuración: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    renderActionsTab();
}

/**
 * Renderiza los enlaces para descargas individuales de archivos de código fuente
 */
function renderActionsTab() {
    const container = document.getElementById('individual-downloads');
    if (!container) return;
    container.innerHTML = '';

    const config = window.CVConfig;
    if (!config) return;

    // Enlace de descarga para master.json
    const masterItem = document.createElement('div');
    masterItem.className = 'download-link-item';
    masterItem.innerHTML = `
        <span>📄 config/master.json</span>
        <a href="#" class="download-link" data-type="master">Descargar</a>
    `;
    masterItem.querySelector('.download-link').addEventListener('click', (e) => {
        e.preventDefault();
        triggerIndividualDownload('master.json', window.CVConfig);
    });
    container.appendChild(masterItem);

    // Enlace para el data.json de cada sección activa
    config.sections.forEach(sec => {
        const secItem = document.createElement('div');
        secItem.className = 'download-link-item';
        secItem.innerHTML = `
            <span>📄 sections/${sec.id}/data.json</span>
            <a href="#" class="download-link" data-type="section" data-id="${sec.id}">Descargar</a>
        `;
        secItem.querySelector('.download-link').addEventListener('click', (e) => {
            e.preventDefault();
            const data = window.CVSectionsData[sec.id] || {};
            triggerIndividualDownload(`${sec.id}_data.json`, data);
        });
        container.appendChild(secItem);
    });
}

function triggerIndividualDownload(filename, dataObj) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 4));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", filename);
    dlAnchorElem.click();
}

/* ============================================================
   PERSISTENCIA AUTOMÁTICA
   ============================================================ */
function saveConfig() {
    if (window.CVConfig) {
        localStorage.setItem('cv_master_config', JSON.stringify(window.CVConfig));
    }
}

function saveSectionData(id) {
    if (window.CVSectionsData && window.CVSectionsData[id]) {
        localStorage.setItem(`cv_section_data_${id}`, JSON.stringify(window.CVSectionsData[id]));
    }
}

/* ============================================================
   LÓGICA AUTOMATIZADA DEL EVALUADOR Y AUDITORÍA ATS
   ============================================================ */

window.runATSAudit = function() {
    const config = window.CVConfig;
    const sectionsData = window.CVSectionsData;
    if (!config || !sectionsData) return;

    let totalScore = 0;
    const recommendations = [];

    // --- 1. EVALUACIÓN DE ESTRUCTURA (Max 30 pts) ---
    // Secciones críticas requeridas por un ATS para catalogar adecuadamente el CV
    const coreSections = [
        { id: 'profile', name: 'Perfil / Encabezado', weight: 6 },
        { id: 'about', name: 'Sobre Mí / Resumen Profesional', weight: 6 },
        { id: 'experience', name: 'Experiencia Profesional', weight: 6 },
        { id: 'education', name: 'Educación y Formación', weight: 6 },
        { id: 'methods-tools', name: 'Métodos y Herramientas (Skills)', weight: 6 }
    ];

    let structureScore = 0;
    const structureChecklistEl = document.getElementById('ats-structure-checklist');
    if (structureChecklistEl) structureChecklistEl.innerHTML = '';

    coreSections.forEach(sec => {
        const configSec = config.sections.find(s => s.id === sec.id);
        const isActive = configSec && !configSec.disabled;

        let itemScore = 0;
        let itemClass = 'fail';
        let bullet = '❌';
        let text = `Falta la sección crítica: ${sec.name}`;

        if (isActive) {
            itemScore = sec.weight;
            structureScore += itemScore;
            itemClass = 'pass';
            bullet = '✅';
            text = `Sección de ${sec.name} activa.`;
        } else {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                text: `Activa la sección <strong>${sec.name}</strong> para que los sistemas ATS puedan clasificar tu perfil correctamente.`
            });
        }

        if (structureChecklistEl) {
            const li = document.createElement('li');
            li.className = `ats-checklist-item ${itemClass}`;
            li.innerHTML = `<span class="item-bullet">${bullet}</span><span>${text}</span>`;
            structureChecklistEl.appendChild(li);
        }
    });
    totalScore += structureScore;
    const structureScoreEl = document.getElementById('ats-structure-score');
    if (structureScoreEl) structureScoreEl.innerText = `${structureScore}/30 pts`;


    // --- 2. INFORMACIÓN DE CONTACTO (Max 20 pts) ---
    // Un ATS necesita extraer formas de contacto de forma inequívoca
    const profileData = sectionsData.profile || {};
    const contactFields = [
        { key: 'name', label: 'Nombre Completo', weight: 4 },
        { key: 'email', label: 'Dirección de Correo', weight: 4 },
        { key: 'phone', label: 'Número de Teléfono', weight: 4 },
        { key: 'location', label: 'Ubicación / Ciudad', weight: 4 },
        { key: 'linkedin', label: 'Enlace a LinkedIn', weight: 4 }
    ];

    let contactScore = 0;
    const contactChecklistEl = document.getElementById('ats-contact-checklist');
    if (contactChecklistEl) contactChecklistEl.innerHTML = '';

    contactFields.forEach(field => {
        const hasVal = profileData[field.key] && String(profileData[field.key]).trim().length > 0;
        let itemScore = 0;
        let itemClass = 'fail';
        let bullet = '❌';
        let text = `Falta información: ${field.label}`;

        if (hasVal) {
            itemScore = field.weight;
            contactScore += itemScore;
            itemClass = 'pass';
            bullet = '✅';
            text = `${field.label} presente en cabecera.`;
        } else {
            recommendations.push({
                type: 'danger',
                icon: '🚨',
                text: `Completa el campo <strong>${field.label}</strong> en tu Perfil. Sin esto, las cribas automáticas de RRHH podrían descartarte.`
            });
        }

        if (contactChecklistEl) {
            const li = document.createElement('li');
            li.className = `ats-checklist-item ${itemClass}`;
            li.innerHTML = `<span class="item-bullet">${bullet}</span><span>${text}</span>`;
            contactChecklistEl.appendChild(li);
        }
    });
    totalScore += contactScore;
    const contactScoreEl = document.getElementById('ats-contact-score');
    if (contactScoreEl) contactScoreEl.innerText = `${contactScore}/20 pts`;


    // --- 3. PALABRAS CLAVE / KEYWORDS (Max 30 pts) ---
    // Análisis de densidad de palabras clave del sector de ingeniería y gestión Agile
    const keywordsToAudit = [
        { term: 'agile', display: 'Agile', category: 'Metodología' },
        { term: 'scrum', display: 'Scrum', category: 'Metodología' },
        { term: 'python', display: 'Python', category: 'Tecnología' },
        { term: 'sql', display: 'SQL / Databases', category: 'Tecnología' },
        { term: 'product owner', display: 'Product Owner', category: 'Rol' },
        { term: 'git', display: 'Git / GitHub', category: 'Tecnología' },
        { term: 'jira', display: 'Jira / Confluence', category: 'Herramientas' },
        { term: 'kanban', display: 'Kanban', category: 'Metodología' },
        { term: 'aerospace', display: 'Aerospace / Aeronáutica', category: 'Sector' },
        { term: 'analytics', display: 'Analytics / Spotfire', category: 'Herramientas' }
    ];

    // Serializar todo el contenido visible para la búsqueda de keywords
    let fullCvText = '';
    config.sections.forEach(sec => {
        if (sec.disabled) return;
        const data = sectionsData[sec.id];
        if (data) {
            fullCvText += ' ' + JSON.stringify(data);
        }
    });
    fullCvText = fullCvText.toLowerCase();

    let keywordsScore = 0;
    const keywordsListEl = document.getElementById('ats-keywords-list');
    if (keywordsListEl) keywordsListEl.innerHTML = '';

    const missingKeywords = [];

    keywordsToAudit.forEach(kw => {
        // Expresión regular sutil para encontrar la palabra completa o subpalabras habituales
        const found = fullCvText.includes(kw.term);
        const pill = document.createElement('span');

        if (found) {
            keywordsScore += 3; // 3 pts por keyword encontrada (máx 10 keywords = 30 pts)
            pill.className = 'ats-keyword-pill found';
            pill.innerHTML = `✓ ${kw.display}`;
        } else {
            missingKeywords.push(kw.display);
            pill.className = 'ats-keyword-pill missing';
            pill.innerHTML = `✗ ${kw.display}`;
        }

        if (keywordsListEl) keywordsListEl.appendChild(pill);
    });

    if (missingKeywords.length > 0) {
        // Sugerir las primeras keywords que faltan
        const suggestText = missingKeywords.slice(0, 3).join(', ');
        recommendations.push({
            type: 'warning',
            icon: '💡',
            text: `Incorpora términos clave que faltan en tu sector (ej. <strong>${suggestText}</strong>) para optimizar la indexación de tu currículum.`
        });
    }

    totalScore += keywordsScore;
    const keywordsScoreEl = document.getElementById('ats-keywords-score');
    if (keywordsScoreEl) keywordsScoreEl.innerText = `${keywordsScore}/30 pts`;


    // --- 4. DENSIDAD DE TEXTO Y LONGITUD (Max 20 pts) ---
    // Los ATS penalizan documentos extremadamente cortos o gigantescos
    // Limpiamos los caracteres de formato JSON para contar palabras reales aproximadas
    const cleanText = fullCvText.replace(/[\{\}\[\]\:\",_]/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = cleanText.split(" ").filter(w => w.length > 2).length;

    let densityScore = 0;
    let densityClass = 'fail';
    let densityBullet = '❌';
    let densityText = '';

    if (wordCount >= 300 && wordCount <= 700) {
        densityScore = 20;
        densityClass = 'pass';
        densityBullet = '✅';
        densityText = `Longitud óptima: ${wordCount} palabras.`;
    } else if (wordCount >= 180 && wordCount < 300) {
        densityScore = 12;
        densityClass = 'warning';
        densityBullet = '⚠️';
        densityText = `CV algo breve (${wordCount} palabras). Agrega descripciones más ricas.`;
        recommendations.push({
            type: 'warning',
            icon: '📝',
            text: `Tu CV tiene pocas palabras (${wordCount}). Intenta redactar con mayor detalle tus logros de negocio y contribuciones técnicas.`
        });
    } else if (wordCount > 700 && wordCount <= 1000) {
        densityScore = 12;
        densityClass = 'warning';
        densityBullet = '⚠️';
        densityText = `CV extenso (${wordCount} palabras). Intenta sintetizar.`;
        recommendations.push({
            type: 'warning',
            icon: '📝',
            text: `Tu currículum tiene una extensión de palabras alta (${wordCount}). Recorta y resume para asegurar que quepa perfectamente y de forma limpia en el diseño A4.`
        });
    } else if (wordCount < 180) {
        densityScore = 5;
        densityClass = 'fail';
        densityBullet = '❌';
        densityText = `CV extremadamente corto (${wordCount} palabras).`;
        recommendations.push({
            type: 'danger',
            icon: '🚨',
            text: `La densidad de palabras es críticamente baja (${wordCount}). Un ATS podría considerarlo vacío. Describe con verbos de acción tus puestos.`
        });
    } else {
        densityScore = 5;
        densityClass = 'fail';
        densityBullet = '❌';
        densityText = `CV sobrecargado (${wordCount} palabras).`;
        recommendations.push({
            type: 'danger',
            icon: '🚨',
            text: `Extensión excesiva de palabras (${wordCount}). Los ATS y reclutadores humanos prefieren brevedad. Reduce textos superfluos.`
        });
    }

    const densityChecklistEl = document.getElementById('ats-density-checklist');
    if (densityChecklistEl) {
        densityChecklistEl.innerHTML = '';
        const li = document.createElement('li');
        li.className = `ats-checklist-item ${densityClass}`;
        li.innerHTML = `<span class="item-bullet">${densityBullet}</span><span>${densityText}</span>`;
        densityChecklistEl.appendChild(li);

        // Añadir segundo check sobre legibilidad estructural de fuentes
        const isStandardFont = config.theme.fontFamily && !config.theme.fontFamily.includes('Georgia');
        let fontBullet = '✅';
        let fontText = 'Tipografía sans-serif de alta legibilidad para OCR.';
        if (!isStandardFont) {
            fontBullet = '⚠️';
            fontText = 'Tipografía Serif elegida. Las fuentes Sans-serif (ej. Inter, Roboto) se leen mejor por máquinas.';
            recommendations.push({
                type: 'warning',
                icon: '🎨',
                text: 'Considera usar una tipografía Sans-serif (ej. Inter o Roboto) en la pestaña de Estilo para asegurar un escaneo perfecto por parte del software OCR.'
            });
        }
        const liFont = document.createElement('li');
        liFont.className = `ats-checklist-item ${isStandardFont ? 'pass' : 'warning'}`;
        liFont.innerHTML = `<span class="item-bullet">${fontBullet}</span><span>${fontText}</span>`;
        densityChecklistEl.appendChild(liFont);
    }

    totalScore += densityScore;
    const densityScoreEl = document.getElementById('ats-density-score');
    if (densityScoreEl) densityScoreEl.innerText = `${densityScore}/20 pts`;


    // --- 5. RENDERIZADO FINAL DEL SCORE Y BADGES ---
    const scoreValEl = document.getElementById('ats-score-value');
    if (scoreValEl) scoreValEl.innerText = `${totalScore}%`;

    const gaugeProgressEl = document.querySelector('.gauge-progress');
    if (gaugeProgressEl) {
        // Circunferencia = 2 * Math.PI * 40 = 251.2
        const circumference = 251.2;
        const offset = circumference - (circumference * totalScore) / 100;
        gaugeProgressEl.style.strokeDashoffset = offset;

        // Cambiar el color de la barra del gauge dinámicamente
        if (totalScore >= 80) {
            gaugeProgressEl.style.stroke = 'var(--color-success)';
        } else if (totalScore >= 60) {
            gaugeProgressEl.style.stroke = '#fbbf24'; // Amarillo/Ambar
        } else {
            gaugeProgressEl.style.stroke = 'var(--color-danger)';
        }
    }

    const statusBadgeEl = document.getElementById('ats-status-text');
    if (statusBadgeEl) {
        statusBadgeEl.className = 'ats-status-badge';
        if (totalScore >= 80) {
            statusBadgeEl.innerText = 'Excelente';
            statusBadgeEl.classList.add('optimal');
        } else if (totalScore >= 60) {
            statusBadgeEl.innerText = 'Mejorable';
            statusBadgeEl.classList.add('warning');
        } else {
            statusBadgeEl.innerText = 'Crítico';
            statusBadgeEl.classList.add('danger');
        }
    }


    // --- 6. RENDERIZADO DE RECOMENDACIONES CLAVE ---
    const recommendationsEl = document.getElementById('ats-recommendations');
    if (recommendationsEl) {
        recommendationsEl.innerHTML = '';
        if (recommendations.length === 0) {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'ats-tip-card success-tip';
            emptyCard.innerHTML = `<span class="tip-icon">🏆</span><span>¡Enhorabuena! Tu CV no requiere mejoras críticas. Sigue así.</span>`;
            recommendationsEl.appendChild(emptyCard);
        } else {
            // Mostrar hasta un máximo de 5 recomendaciones prioritarias
            recommendations.slice(0, 5).forEach(rec => {
                const tipCard = document.createElement('div');
                tipCard.className = `ats-tip-card ${rec.type === 'danger' ? 'danger-tip' : ''} ${rec.type === 'success' ? 'success-tip' : ''}`;
                if (rec.type === 'danger') {
                    tipCard.style.borderLeftColor = 'var(--color-danger)';
                    tipCard.style.background = 'rgba(239, 68, 68, 0.05)';
                }
                tipCard.innerHTML = `<span class="tip-icon">${rec.icon}</span><span>${rec.text}</span>`;
                recommendationsEl.appendChild(tipCard);
            });
        }
    }
};