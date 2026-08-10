document.addEventListener('DOMContentLoaded', () => {
    // Bindear botones del Dock (estáticos en el HTML, se bindean una sola vez)
    document.getElementById('btn-general-settings')?.addEventListener('click', openGeneralSettingsModal);
    document.getElementById('btn-structure')?.addEventListener('click', openStructureModal);
    document.getElementById('btn-backups')?.addEventListener('click', openBackupsModal);

    // EVENT DELEGATION para toolbar inline (evita duplicados en cada re-render)
    // Un solo listener en el document captura todos los clics en botones de toolbar
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-data');
        if (editBtn) {
            e.stopPropagation();
            openDataEditorModal(editBtn.dataset.section);
            return;
        }
        const layoutBtn = e.target.closest('.btn-change-layout');
        if (layoutBtn) {
            e.stopPropagation();
            changeSectionComponent(layoutBtn.dataset.section);
            return;
        }
    });

    // Event listener para el import de archivo (una sola vez)
    document.getElementById('import-config-file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.masterConfig) localStorage.setItem('cv_master_config', JSON.stringify(data.masterConfig));
                if (data.sectionsData) {
                    Object.keys(data.sectionsData).forEach(k => {
                        localStorage.setItem(`cv_section_data_${k}`, JSON.stringify(data.sectionsData[k]));
                    });
                }
                alert('Carga de datos exitosa.');
                location.reload();
            } catch (err) {
                alert('Error al leer el archivo JSON.');
            }
        };
        reader.readAsText(file);
    });
});

const sectionNames = {
    profile: "Perfil Profesional",
    iniciatives: "Iniciativas",
    "methods-tools": "Tecnologías y Métodos",
    languages: "Idiomas",
    references: "Referencias",
    about: "Sobre Mí",
    "executive-highlights": "Hitos Ejecutivos",
    experience: "Experiencia Profesional",
    education: "Educación"
};

function triggerSaveAnimation() {
    console.log("Sincronizado");
}

/* ==========================================
   GESTOR DEL MODAL ÚNICO (PREMIUM LIGHT MODE)
   ========================================== */
function getGenericModal() {
    let modal = document.getElementById('general-settings-modal');
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = closeModal;
        document.body.appendChild(overlay);
    }
    return { modal, overlay };
}

function showModal(contentHtml) {
    const { modal, overlay } = getGenericModal();
    modal.className = 'modal'; // Limpia clases previas
    modal.innerHTML = contentHtml;

    overlay.style.display = 'block';
    modal.style.display = 'block';

    setTimeout(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    }, 10);
}

window.closeModal = function () {
    const modal = document.getElementById('general-settings-modal');
    const overlay = document.querySelector('.modal-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');

    setTimeout(() => {
        if (modal) modal.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    }, 300);
};

/* ==========================================
   MODAL 1: AJUSTES GENERALES
   ========================================== */
function openGeneralSettingsModal() {
    const config = window.CVConfig;
    const debugLevel = config.layout?.debugLayout || 0;
    const html = `
        <div class="modal-header">
            <h2>Ajustes Generales</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">

            <p class="modal-section-label">Colores Corporativos</p>
            <div class="form-group-grid">
                <div class="form-group-row">
                    <label>Color Principal</label>
                    <div class="color-picker-wrapper">
                        <input type="color" id="inline-theme-primary" value="${config.theme.primaryColor || '#1d3557'}">
                    </div>
                </div>
                <div class="form-group-row">
                    <label>Color Sidebar</label>
                    <div class="color-picker-wrapper">
                        <input type="color" id="inline-theme-sidebar" value="${config.theme.sidebarColor || '#1d3557'}">
                    </div>
                </div>
                <div class="form-group-row">
                    <label>Color Fondo</label>
                    <div class="color-picker-wrapper">
                        <input type="color" id="inline-theme-bg" value="${config.theme.backgroundColor || '#ffffff'}">
                    </div>
                </div>
                <div class="form-group-row">
                    <label>Color Texto</label>
                    <div class="color-picker-wrapper">
                        <input type="color" id="inline-theme-text" value="${config.theme.textColor || '#1e293b'}">
                    </div>
                </div>
            </div>

            <p class="modal-section-label" style="margin-top:24px;">Tipografía</p>
            <div class="form-group-single">
                <label>Fuente del currículum</label>
                <select id="inline-theme-font" class="dynamic-select">
                    <option value="'Inter', sans-serif" ${(config.theme.fontFamily || '').includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="'Roboto', sans-serif" ${(config.theme.fontFamily || '').includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="system-ui, sans-serif" ${(config.theme.fontFamily || '').includes('system-ui') ? 'selected' : ''}>Predeterminada del Sistema</option>
                </select>
            </div>

            <p class="modal-section-label" style="margin-top:24px;">Depuración del Layout</p>
            <div class="form-group-single">
                <label>Modo de visualización técnica</label>
                <div class="debug-toggle-group" id="debug-toggle-group">
                    <button class="debug-toggle-btn ${debugLevel === 0 ? 'active' : ''}" data-level="0" onclick="setDebugLevel(0)">Desactivado</button>
                    <button class="debug-toggle-btn ${debugLevel === 1 ? 'active' : ''}" data-level="1" onclick="setDebugLevel(1)">Nivel 1</button>
                    <button class="debug-toggle-btn ${debugLevel === 2 ? 'active' : ''}" data-level="2" onclick="setDebugLevel(2)">Nivel 2</button>
                </div>
            </div>
            <p class="modal-help-text">Muestra las cajas de grid, áreas y márgenes. Se restablece automáticamente al recargar la página.</p>

            <button class="modal-btn" onclick="saveGeneralSettings()">Guardar Ajustes</button>
        </div>
    `;
    showModal(html);
}

window.setDebugLevel = function (level) {
    document.querySelectorAll('.debug-toggle-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.level) === level);
    });
    window._pendingDebugLevel = level;
};

window.saveGeneralSettings = function () {
    window.CVConfig.theme.primaryColor = document.getElementById('inline-theme-primary').value;
    window.CVConfig.theme.sidebarColor = document.getElementById('inline-theme-sidebar').value;
    window.CVConfig.theme.backgroundColor = document.getElementById('inline-theme-bg').value;
    window.CVConfig.theme.textColor = document.getElementById('inline-theme-text').value;
    window.CVConfig.theme.fontFamily = document.getElementById('inline-theme-font').value;

    const activeDebugBtn = document.querySelector('.debug-toggle-btn.active');
    const debugLevel = window._pendingDebugLevel !== undefined
        ? window._pendingDebugLevel
        : (activeDebugBtn ? parseInt(activeDebugBtn.dataset.level) : 0);
    window._pendingDebugLevel = undefined;
    window.CVConfig.layout.debugLayout = debugLevel;

    localStorage.setItem('cv_master_config', JSON.stringify(window.CVConfig));
    closeModal();
    window.refreshCV();
};

/* ==========================================
   MODAL 2: ESTRUCTURA (DOS COLUMNAS)
   ========================================== */
function openStructureModal() {
    const html = `
        <div class="modal-header">
            <h2>Estructura de Secciones</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <p class="modal-desc-text">Activa, desactiva y reorganiza las secciones en las dos columnas principales de tu diseño.</p>
        <div class="structure-columns">
            <div class="structure-column">
                <div class="structure-col-header sidebar-header">
                    <span>Columna Lateral (Sidebar)</span>
                </div>
                <div id="structure-sidebar" class="structure-area-list"></div>
            </div>
            <div class="structure-column">
                <div class="structure-col-header main-header">
                    <span>Columna Principal (Main)</span>
                </div>
                <div id="structure-main" class="structure-area-list"></div>
            </div>
        </div>
    `;
    showModal(html);
    const modalEl = document.getElementById('general-settings-modal');
    if (modalEl) {
        modalEl.classList.add('modal-wide');
    }
    renderStructureList();
}

function renderStructureList() {
    const sidebarList = document.getElementById('structure-sidebar');
    const mainList = document.getElementById('structure-main');
    if (!sidebarList || !mainList) return;

    sidebarList.innerHTML = '';
    mainList.innerHTML = '';

    const config = window.CVConfig;
    const sidebarSecs = config.sections.filter(s => s.area === 'sidebar');
    const mainSecs = config.sections.filter(s => s.area === 'main');

    function buildItem(sec) {
        const globalIndex = config.sections.indexOf(sec);
        const areaSecs = config.sections.filter(s => s.area === sec.area);
        const areaIndex = areaSecs.indexOf(sec);

        const item = document.createElement('div');
        item.className = `structure-item ${sec.disabled ? 'is-disabled' : ''}`;

        // Toggle activo/inactivo (switch minimalista)
        const toggle = document.createElement('label');
        toggle.className = 'struct-toggle';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !sec.disabled;
        checkbox.onchange = () => {
            sec.disabled = !checkbox.checked;
            saveConfig();
            renderStructureList();
        };
        const slider = document.createElement('span');
        slider.className = 'struct-slider';
        toggle.appendChild(checkbox);
        toggle.appendChild(slider);

        // Nombre traducido de la sección
        const name = document.createElement('span');
        name.className = 'struct-name';
        name.textContent = sectionNames[sec.id] || sec.id;

        // Controles de ordenamiento lineal
        const controls = document.createElement('div');
        controls.className = 'struct-controls';

        const btnUp = document.createElement('button');
        btnUp.innerHTML = '▲';
        btnUp.className = 'struct-btn';
        btnUp.title = 'Mover arriba';
        btnUp.disabled = areaIndex === 0;
        btnUp.onclick = () => {
            if (areaIndex > 0) {
                const prevInArea = areaSecs[areaIndex - 1];
                const prevGlobal = config.sections.indexOf(prevInArea);
                config.sections.splice(globalIndex, 1);
                config.sections.splice(prevGlobal, 0, sec);
                saveConfig();
                renderStructureList();
            }
        };

        const btnDown = document.createElement('button');
        btnDown.innerHTML = '▼';
        btnDown.className = 'struct-btn';
        btnDown.title = 'Mover abajo';
        btnDown.disabled = areaIndex === areaSecs.length - 1;
        btnDown.onclick = () => {
            if (areaIndex < areaSecs.length - 1) {
                const nextInArea = areaSecs[areaIndex + 1];
                const nextGlobal = config.sections.indexOf(nextInArea);
                config.sections.splice(nextGlobal + 1, 0, config.sections.splice(globalIndex, 1)[0]);
                saveConfig();
                renderStructureList();
            }
        };

        controls.appendChild(btnUp);
        controls.appendChild(btnDown);

        item.appendChild(toggle);
        item.appendChild(name);
        item.appendChild(controls);
        return item;
    }

    sidebarSecs.forEach(sec => sidebarList.appendChild(buildItem(sec)));
    mainSecs.forEach(sec => mainList.appendChild(buildItem(sec)));
}

function saveConfig() {
    localStorage.setItem('cv_master_config', JSON.stringify(window.CVConfig));
    window.refreshCV();
    triggerSaveAnimation();
}

/* ==========================================
   MODAL 3: DATOS DE SECCIÓN (CON ACORDEONES/COLLAPSIBLES)
   ========================================== */
function openDataEditorModal(sectionId) {
    const sectionNameStr = sectionNames[sectionId] || sectionId.toUpperCase();
    const html = `
        <div class="modal-header">
            <h2>Editar Contenido: ${sectionNameStr}</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <p class="modal-desc-text">Modifica directamente la información de esta sección del currículum. Los cambios se guardan automáticamente.</p>
        <div class="modal-body" id="data-editor-form" style="max-height:55vh; overflow-y:auto; padding-right:12px;">
            <!-- Generado dinámicamente -->
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e4e4e7; display: flex; justify-content: flex-end;">
            <button class="modal-btn secondary-btn" style="width: auto; padding: 10px 24px; margin-top: 0;" onclick="closeModal()">Finalizar Edición</button>
        </div>
    `;
    showModal(html);
    const modalEl = document.getElementById('general-settings-modal');
    if (modalEl) {
        modalEl.classList.add('modal-medium');
    }

    const formCont = document.getElementById('data-editor-form');
    const data = window.CVSectionsData[sectionId];
    if (!data) return;

    generatePremiumFormFields(data, formCont, [], sectionId, false);
}

function extractItemHeaderTitle(item, defaultTitle) {
    if (typeof item !== 'object' || item === null) return String(item);
    const candidates = ['role', 'company', 'category', 'title', 'degree', 'institution', 'name', 'label', 'idioma', 'skill'];
    for (const key of candidates) {
        if (item[key] && typeof item[key] === 'string' && item[key].trim() !== '') {
            return item[key].trim();
        }
    }
    return defaultTitle;
}

function generatePremiumFormFields(obj, parentElement, pathKeys, sectionId, forceCollapse = false) {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, val]) => {
        const currentPath = [...pathKeys, key];
        const labelText = key.replace(/_/g, ' ').toUpperCase();

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group-dynamic';

        if (typeof val === 'string' || typeof val === 'number') {
            const label = document.createElement('label');
            label.innerText = labelText;
            label.className = 'field-label';
            formGroup.appendChild(label);

            let input;
            if (typeof val === 'string' && val.length > 50) {
                input = document.createElement('textarea');
                input.rows = 3;
            } else {
                input = document.createElement('input');
                input.type = typeof val === 'number' ? 'number' : 'text';
            }
            input.value = val;
            input.className = 'dynamic-input';

            input.addEventListener('change', (e) => {
                const finalVal = typeof val === 'number' ? parseFloat(e.target.value) : e.target.value;
                updateNestedValue(window.CVSectionsData[sectionId], currentPath, finalVal);
                localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                window.refreshCV();
            });
            formGroup.appendChild(input);
            parentElement.appendChild(formGroup);

        } else if (Array.isArray(val)) {
            const label = document.createElement('label');
            label.className = 'form-section-header';
            label.innerHTML = `<span>${labelText}</span>`;
            formGroup.appendChild(label);

            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-container';

            val.forEach((item, idx) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'array-item collapsed'; // Collapsed by default

                // Header del Accordion/Colapsable
                const itemHeader = document.createElement('div');
                itemHeader.className = 'array-item-header';

                const itemTitleText = extractItemHeaderTitle(item, `Elemento ${idx + 1}`);
                const itemTitleSpan = document.createElement('span');
                itemTitleSpan.className = 'array-item-title';
                itemTitleSpan.innerText = itemTitleText;

                const caretSpan = document.createElement('span');
                caretSpan.className = 'array-item-caret';
                caretSpan.innerHTML = '▼';

                itemHeader.appendChild(itemTitleSpan);
                itemHeader.appendChild(caretSpan);

                // Contenido del Accordion
                const itemBody = document.createElement('div');
                itemBody.className = 'array-item-body';

                // Toggle click handler para colapsar/expandir
                itemHeader.onclick = (e) => {
                    if (e.target.closest('.btn-delete-item')) return;

                    const isCollapsed = itemCard.classList.contains('collapsed');
                    if (isCollapsed) {
                        itemCard.classList.remove('collapsed');
                        caretSpan.style.transform = 'rotate(180deg)';
                    } else {
                        itemCard.classList.add('collapsed');
                        caretSpan.style.transform = 'rotate(0deg)';
                    }
                };

                const controls = document.createElement('div');
                controls.className = 'array-controls';

                const btnDel = document.createElement('button');
                btnDel.innerText = 'Eliminar';
                btnDel.className = 'btn-delete-item';
                btnDel.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    val.splice(idx, 1);
                    localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                    window.refreshSection(sectionId);
                    openDataEditorModal(sectionId); // re-render modal
                };

                controls.appendChild(btnDel);
                itemBody.appendChild(controls);

                if (typeof item === 'object' && item !== null) {
                    generatePremiumFormFields(item, itemBody, [...currentPath, idx], sectionId, forceCollapse);
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = String(item);
                    input.className = 'dynamic-input';
                    input.onchange = (e) => {
                        updateNestedValue(window.CVSectionsData[sectionId], [...currentPath, idx], e.target.value);
                        localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                        window.refreshSection(sectionId);
                    };
                    itemBody.appendChild(input);
                }

                itemCard.appendChild(itemHeader);
                itemCard.appendChild(itemBody);
                arrayContainer.appendChild(itemCard);
            });

            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn-add-item';
            btnAdd.innerText = `+ Añadir elemento a ${labelText}`;
            btnAdd.onclick = (e) => {
                e.preventDefault();
                let newItem = typeof val[0] === 'object' ? Object.keys(val[0]).reduce((acc, k) => ({ ...acc, [k]: "" }), {}) : "";
                val.push(newItem);
                localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                window.refreshSection(sectionId);
                openDataEditorModal(sectionId);
            };

            formGroup.appendChild(arrayContainer);
            formGroup.appendChild(btnAdd);
            parentElement.appendChild(formGroup);

        } else if (typeof val === 'object' && val !== null) {
            const label = document.createElement('label');
            label.className = 'form-section-header';
            label.innerHTML = `<span>${labelText}</span>`;
            formGroup.appendChild(label);

            const subContainer = document.createElement('div');
            subContainer.className = 'form-object-container';

            generatePremiumFormFields(val, subContainer, currentPath, sectionId, forceCollapse);
            formGroup.appendChild(subContainer);
            parentElement.appendChild(formGroup);
        }
    });
}

function updateNestedValue(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
    current[path[path.length - 1]] = value;
}

/* ==========================================
   MODAL 4: BACKUPS Y EXPORTACIÓN
   ========================================== */
function openBackupsModal() {
    const html = `
        <div class="modal-header">
            <h2>Copia de Seguridad y Datos</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
            <p class="modal-desc-text">Administra las configuraciones y el contenido de tu currículum. Puedes exportar una copia local o importar datos previamente guardados en formato JSON corporativo.</p>

            <div class="backup-actions-list">
                <button class="modal-btn-action" onclick="exportBackup()">
                    <span class="action-title">Exportar Datos Consolidados</span>
                    <span class="action-desc">Descarga un archivo .json unificado con tu contenido y preferencias actuales.</span>
                </button>

                <button class="modal-btn-action secondary-action" onclick="document.getElementById('import-config-file').click()">
                    <span class="action-title">Importar Archivo de Ajustes</span>
                    <span class="action-desc">Sube una copia de seguridad para restaurar la configuración anterior.</span>
                </button>

                <div class="backup-divider"></div>

                <button class="modal-btn-action danger-action" onclick="resetToFactory()">
                    <span class="action-title">Restablecer Currículum</span>
                    <span class="action-desc">Borra todos los cambios locales y restaura la configuración empresarial inicial.</span>
                </button>
            </div>
        </div>
    `;
    showModal(html);
}

window.exportBackup = function () {
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

window.resetToFactory = function () {
    if (confirm('¿Estás seguro de que deseas restablecer todos los datos del currículum de fábrica? Se perderán todas tus personalizaciones.')) {
        localStorage.clear();
        location.reload();
    }
};

/* ==========================================
   CAMBIO DE COMPONENTES DE DISEÑO (CON VISUAL PREVIEWS)
   ========================================== */
function changeSectionComponent(sectionId) {
    const config = window.CVConfig;
    const sec = config.sections.find(s => s.id === sectionId);
    if (!sec) return;

    let options = [];

    if (sectionId === 'languages') {
        const current = sec.component || 'bars';

        options = [
            {
                id: 'bars',
                name: 'Barras de Nivel Gráficas',
                desc: 'Muestra los idiomas con barras de progreso de fluidez elegantes, optimizadas para la barra lateral.',
                previewHtml: `
                    <div class="component-preview-visual bars-preview">
                        <div class="preview-bar-row">
                            <span class="preview-lbl">Inglés</span>
                            <div class="preview-bar-line">
                                <div class="preview-bar-fill" style="width: 85%;"></div>
                            </div>
                        </div>
                        <div class="preview-bar-row">
                            <span class="preview-lbl">Francés</span>
                            <div class="preview-bar-line">
                                <div class="preview-bar-fill" style="width: 60%;"></div>
                            </div>
                        </div>
                    </div>
                `,
                active: current === 'bars',
                apply: () => {
                    sec.component = 'bars';
                }
            },
            {
                id: 'pills',
                name: 'Etiquetas Modernas (Pills)',
                desc: 'Muestra los idiomas como etiquetas compactas en línea, ideale para optimizar espacio vertical.',
                previewHtml: `
                    <div class="component-preview-visual pills-preview">
                        <span class="preview-pill">Inglés (C1)</span>
                        <span class="preview-pill">Francés (B2)</span>
                    </div>
                `,
                active: current === 'pills',
                apply: () => {
                    sec.component = 'pills';
                }
            }
        ];

    } else if (sectionId === 'education') {
        options = [
            {
                id: 'list',
                name: 'Estructura en Lista Clásica',
                desc: 'Disposición lineal clásica con descripciones completas, etiquetas de cursos y años alineados verticalmente.',
                previewHtml: `
                    <div class="component-preview-visual detailed-preview">
                        <div class="preview-line title"></div>
                        <div class="preview-line text" style="width: 90%;"></div>
                        <div class="preview-line text" style="width: 75%;"></div>
                    </div>
                `,
                active: !sec.component || sec.component === 'list',
                apply: () => {
                    sec.component = null;
                }
            },
            {
                id: 'cards',
                name: 'Tarjetas de Credenciales (Grid 2 Columnas)',
                desc: 'Diseño ultra-visual en cuadrícula de dos columnas con iconos académicos, insignias y estructuración moderna.',
                previewHtml: `
                    <div class="component-preview-visual pills-preview">
                        <div class="preview-pill" style="width: 42%; height: 28px;"></div>
                        <div class="preview-pill" style="width: 42%; height: 28px;"></div>
                    </div>
                `,
                active: sec.component === 'cards',
                apply: () => {
                    sec.component = 'cards';
                }
            }
        ];

    } else {
        const currentMode = sec.mode || 'detailed';

        options = [
            {
                id: 'detailed',
                name: 'Estructura Detallada Clásica',
                desc: 'Disposición corporativa clásica con descripciones completas, viñetas detalladas y fechas alineadas.',
                previewHtml: `
                    <div class="component-preview-visual detailed-preview">
                        <div class="preview-line title"></div>
                        <div class="preview-line text" style="width: 90%;"></div>
                        <div class="preview-line text" style="width: 75%;"></div>
                    </div>
                `,
                active: currentMode === 'detailed',
                apply: () => {
                    sec.mode = 'detailed';
                }
            },
            {
                id: 'visual',
                name: 'Diseño Compacto / Visual',
                desc: 'Estructura orientada al impacto visual que agrupa elementos con mayor densidad y optimiza el aire de página.',
                previewHtml: `
                    <div class="component-preview-visual visual-preview">
                        <div class="preview-line title" style="width: 45%;"></div>
                        <div class="preview-row">
                            <span class="preview-box"></span>
                            <span class="preview-box"></span>
                            <span class="preview-box"></span>
                        </div>
                    </div>
                `,
                active: currentMode === 'visual',
                apply: () => {
                    sec.mode = 'visual';
                }
            }
        ];
    }

    const sectionNameStr =
        sectionNames[sectionId] || sectionId.toUpperCase();

    let html = `
        <div class="modal-header">
            <h2>Diseño Visual: ${sectionNameStr}</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>

        <p class="modal-desc-text">
            Selecciona la variante de visualización preferida para esta sección de tu CV.
        </p>

        <div class="modal-body">
            <div class="component-options-grid">
    `;

    options.forEach((opt, idx) => {
        html += `
            <div class="component-option-card ${opt.active ? 'active' : ''}"
                 onclick="selectComponentOption('${sectionId}', ${idx})">

                <div class="option-card-preview">
                    ${opt.previewHtml}
                </div>

                <div class="option-card-meta">
                    <div class="option-card-title-row">
                        <span class="option-card-title">${opt.name}</span>
                        ${opt.active
                ? '<span class="active-badge">Seleccionado</span>'
                : ''}
                    </div>

                    <p class="option-card-desc">${opt.desc}</p>
                </div>

            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    showModal(html);

    const modalEl =
        document.getElementById('general-settings-modal');

    if (modalEl) {
        modalEl.classList.add('modal-medium');
    }

    // Guardamos las opciones para poder seleccionarlas
    window._tempOptions = options;
}


/*
 * Selecciona una variante de diseño
 */
window.selectComponentOption = function (sectionId, index) {
    if (!window._tempOptions || !window._tempOptions[index]) {
        return;
    }

    // Aplicar la opción seleccionada
    window._tempOptions[index].apply();

    // Guardar configuración
    localStorage.setItem(
        'cv_master_config',
        JSON.stringify(window.CVConfig)
    );

    // Cerrar modal
    closeModal();

    // Actualizar CV
    window.refreshCV();
};