/**
 * CV Modular Engine - CONFIGURADOR INTERACTIVO (Lógica)
 * Gestiona el panel de control lateral, la generación dinámica de formularios,
 * el reordenamiento de secciones, la importación/exportación y la persistencia local.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el motor de CV cargue la configuración inicial
    document.addEventListener('cv-loaded', initConfigPanel);

    // Fallback por si el evento ya se disparó
    if (window.CVConfig) {
        initConfigPanel();
    }
});

function initConfigPanel() {
    if (window.ConfigPanelInitialized) return;
    window.ConfigPanelInitialized = true;

    console.log('⚙️ Inicializando Panel de Configuración...');

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

    // 2. NAVEGACIÓN POR PESTAÑAS
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Recargar datos específicos de pestaña si es necesario
            if (tabId === 'tab-sections') {
                renderSectionsTab();
            } else if (tabId === 'tab-content') {
                initContentTab();
            } else if (tabId === 'tab-actions') {
                renderActionsTab();
            }
        });
    });

    // 3. PESTAÑA 1: LOGICA DE ESTILO Y TEMA
    initThemeTab();

    // 4. ACCIONES DE PERSISTENCIA Y BACKUP
    initActionsTab();
}

/* ============================================================
   PESTAÑA 1: TEMA Y ESTILOS
   ============================================================ */
function initThemeTab() {
    const config = window.CVConfig;
    if (!config) return;

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
    }

    function updateLayoutField(key, value) {
        config.layout[key] = value;
        saveConfig();
        window.refreshCV();
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

        // Toggle Activo/Inactivo
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !sec.disabled;
        checkbox.title = sec.disabled ? 'Activar sección' : 'Desactivar sección';
        checkbox.addEventListener('change', () => {
            sec.disabled = !checkbox.checked;
            saveConfig();
            window.refreshCV();
            renderSectionsTab(); // Re-renderizar lista
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
            });

            body.appendChild(fieldArea);
            body.appendChild(fieldWeight);
            card.appendChild(body);
        }

        listContainer.appendChild(card);
    });
}

/* ============================================================
   PESTAÑA 3: EDITOR DE CONTENIDO DINÁMICO
   ============================================================ */
let activeSectionId = null;

function initContentTab() {
    const config = window.CVConfig;
    if (!config || !config.sections) return;

    const selector = document.getElementById('content-section-selector');
    selector.innerHTML = '';

    // Añadir opciones solo de las secciones que estén cargadas
    config.sections.forEach(sec => {
        const opt = document.createElement('option');
        opt.value = sec.id;
        opt.innerText = `${sec.id}${sec.disabled ? ' (Desactivada)' : ''}`;
        selector.appendChild(opt);
    });

    if (!activeSectionId && config.sections.length > 0) {
        activeSectionId = config.sections[0].id;
    }

    selector.value = activeSectionId;

    // Configurar cambios de selector
    selector.addEventListener('change', (e) => {
        activeSectionId = e.target.value;
        loadSectionDataEditor();
    });

    // Cambios de modo Visual / JSON
    const visualBtn = document.getElementById('mode-visual-btn');
    const jsonBtn = document.getElementById('mode-json-btn');
    const visualCont = document.getElementById('visual-editor-container');
    const jsonCont = document.getElementById('json-editor-container');

    visualBtn.addEventListener('click', () => {
        visualBtn.classList.add('active');
        jsonBtn.classList.remove('active');
        visualCont.classList.add('active');
        jsonCont.classList.remove('active');
        loadSectionDataEditor();
    });

    jsonBtn.addEventListener('click', () => {
        jsonBtn.classList.add('active');
        visualBtn.classList.remove('active');
        jsonCont.classList.add('active');
        visualCont.classList.remove('active');
        loadSectionDataEditor();
    });

    // Botón aplicar JSON Crudo
    const applyJsonBtn = document.getElementById('apply-json-btn');
    applyJsonBtn.addEventListener('click', () => {
        const text = document.getElementById('raw-json-textarea').value;
        try {
            const data = JSON.parse(text);
            window.CVSectionsData[activeSectionId] = data;
            localStorage.setItem(`cv_section_data_${activeSectionId}`, JSON.stringify(data));
            window.refreshCV();
            alert(`✅ JSON aplicado correctamente para ${activeSectionId}`);
        } catch (e) {
            alert(`❌ Error de Sintaxis JSON:\n${e.message}`);
        }
    });

    loadSectionDataEditor();
}

/**
 * Carga los datos de la sección activa en el editor seleccionado (Visual o JSON)
 */
function loadSectionDataEditor() {
    if (!activeSectionId) return;
    const data = window.CVSectionsData[activeSectionId] || {};

    const visualCont = document.getElementById('visual-editor-container');
    const jsonCont = document.getElementById('json-editor-container');

    // 1. Cargar JSON Crudo
    document.getElementById('raw-json-textarea').value = JSON.stringify(data, null, 4);

    // 2. Cargar Formulario Visual
    if (visualCont.classList.contains('active')) {
        renderVisualForm(data);
    }
}

/**
 * Generador Recursivo de Formularios Visuales para la data
 */
function renderVisualForm(data) {
    const container = document.getElementById('visual-editor-container');
    container.innerHTML = '';

    const form = document.createElement('div');
    form.className = 'dynamic-form';

    // Generar campos para cada clave del objeto de nivel superior
    generateFormFields(data, form, []);

    container.appendChild(form);
}

/**
 * Función auxiliar para generar inputs dinámicos en base a la estructura del objeto
 */
function generateFormFields(obj, parentElement, pathKeys) {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, val]) => {
        const currentPath = [...pathKeys, key];
        const labelText = key.toUpperCase();

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        if (typeof val === 'string') {
            const label = document.createElement('label');
            label.innerText = labelText;
            formGroup.appendChild(label);

            let input;
            // Si el texto es largo o el nombre indica descripción, usar un textarea
            if (val.length > 60 || key.toLowerCase().includes('desc') || key.toLowerCase().includes('about') || key.toLowerCase().includes('profile')) {
                input = document.createElement('textarea');
                input.rows = 4;
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
            input.value = val;
            input.addEventListener('change', (e) => {
                updateNestedValue(window.CVSectionsData[activeSectionId], currentPath, e.target.value);
                saveSectionData(activeSectionId);
                window.refreshCV();
            });
            formGroup.appendChild(input);
            parentElement.appendChild(formGroup);

        } else if (typeof val === 'number') {
            const label = document.createElement('label');
            label.innerText = labelText;
            formGroup.appendChild(label);

            const input = document.createElement('input');
            input.type = 'number';
            input.value = val;
            input.addEventListener('change', (e) => {
                updateNestedValue(window.CVSectionsData[activeSectionId], currentPath, parseFloat(e.target.value));
                saveSectionData(activeSectionId);
                window.refreshCV();
            });
            formGroup.appendChild(input);
            parentElement.appendChild(formGroup);

        } else if (Array.isArray(val)) {
            const label = document.createElement('label');
            label.innerHTML = `<strong>📁 ${labelText} (Lista de Elementos)</strong>`;
            formGroup.appendChild(label);

            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'dynamic-form-array';

            // Dibujar cada elemento del array
            val.forEach((item, idx) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'array-item-card';

                // Barra de control del item del array
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
                        saveSectionData(activeSectionId);
                        window.refreshCV();
                        loadSectionDataEditor();
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
                        saveSectionData(activeSectionId);
                        window.refreshCV();
                        loadSectionDataEditor();
                    }
                });

                const btnDelete = document.createElement('button');
                btnDelete.className = 'card-btn';
                btnDelete.style.background = 'var(--panel-danger)';
                btnDelete.innerText = '🗑️ Eliminar';
                btnDelete.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('¿Seguro que deseas eliminar este elemento?')) {
                        val.splice(idx, 1);
                        saveSectionData(activeSectionId);
                        window.refreshCV();
                        loadSectionDataEditor();
                    }
                });

                controls.appendChild(btnUp);
                controls.appendChild(btnDown);
                controls.appendChild(btnDelete);
                itemCard.appendChild(controls);

                // Si es un objeto, recursión para dibujar sus propiedades
                if (typeof item === 'object' && item !== null) {
                    generateFormFields(item, itemCard, [...currentPath, idx]);
                } else {
                    // Array de strings simple (como tags, items, etc.)
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = String(item);
                    input.addEventListener('change', (e) => {
                        updateNestedValue(window.CVSectionsData[activeSectionId], [...currentPath, idx], e.target.value);
                        saveSectionData(activeSectionId);
                        window.refreshCV();
                    });
                    itemCard.appendChild(input);
                }

                arrayContainer.appendChild(itemCard);
            });

            // Botón para añadir un nuevo elemento al array
            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn-add-item';
            btnAdd.innerText = `➕ Añadir nuevo item a ${labelText.toLowerCase()}`;
            btnAdd.addEventListener('click', (e) => {
                e.preventDefault();
                // Duplicar la estructura de plantilla en base al primer elemento o crear un objeto vacío
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
                    newItem = {}; // Objeto vacío por defecto
                }

                val.push(newItem);
                saveSectionData(activeSectionId);
                window.refreshCV();
                loadSectionDataEditor();
            });

            formGroup.appendChild(arrayContainer);
            formGroup.appendChild(btnAdd);
            parentElement.appendChild(formGroup);

        } else if (typeof val === 'object' && val !== null) {
            // Un subobjeto no nulo ni array (ej. "skills" o similares)
            const label = document.createElement('label');
            label.innerHTML = `<strong>📦 ${labelText}</strong>`;
            formGroup.appendChild(label);

            const subContainer = document.createElement('div');
            subContainer.style.borderLeft = '2px solid var(--panel-border)';
            subContainer.style.paddingLeft = '10px';
            subContainer.style.marginTop = '6px';
            subContainer.style.display = 'flex';
            subContainer.style.flexDirection = 'column';
            subContainer.style.gap = '12px';

            generateFormFields(val, subContainer, currentPath);

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
    resetBtn.addEventListener('click', () => {
        if (confirm('⚠️ ¿Estás seguro de que deseas restablecer el CV a los valores por defecto del repositorio?\nSe borrarán todos tus cambios en el navegador.')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Botón Exportar Consolidado
    const exportBtn = document.getElementById('btn-export-consolidated');
    exportBtn.addEventListener('click', () => {
        const fullBackup = {
            masterConfig: window.CVConfig,
            sectionsData: window.CVSectionsData
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 4));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "cv_completo_backup.json");
        dlAnchorElem.click();
    });

    // Importar configuración
    const importBtnTrigger = document.getElementById('btn-import-config-trigger');
    const importFileInput = document.getElementById('import-config-file');

    importBtnTrigger.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
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
    });

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