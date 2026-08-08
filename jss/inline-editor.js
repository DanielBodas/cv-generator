document.addEventListener('DOMContentLoaded', () => {
    // Bindear botones del Dock (estáticos en el HTML, se bindean una sola vez)
    document.getElementById('btn-general-settings')?.addEventListener('click', openGeneralSettingsModal);
    document.getElementById('btn-structure')?.addEventListener('click', openStructureModal);
    document.getElementById('btn-backups')?.addEventListener('click', openBackupsModal);

    // EVENT DELEGATION para toolbar inline (evita duplicados en cada re-render)
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
});

// No-op para mantener compatibilidad si se llamara en algún lado
function bindInlineEvents() {}

function triggerSaveAnimation() {
    console.log("Sincronizado");
}

/* ==========================================
   GESTOR DEL MODAL ÚNICO
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
    modal.innerHTML = contentHtml;
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    setTimeout(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    }, 10);
}

window.closeModal = function() {
    const modal = document.getElementById('general-settings-modal');
    const overlay = document.querySelector('.modal-overlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    }, 200);
};

/* ==========================================
   MODAL 1: AJUSTES GENERALES (SIN EMOJIS)
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

            <p class="modal-section-label">Colores del Tema</p>
            <div class="form-group">
                <label>Color Principal</label>
                <input type="color" id="inline-theme-primary" value="${config.theme.primaryColor || '#1d3557'}">
            </div>
            <div class="form-group">
                <label>Color de Barra Lateral</label>
                <input type="color" id="inline-theme-sidebar" value="${config.theme.sidebarColor || '#1d3557'}">
            </div>
            <div class="form-group">
                <label>Color de Fondo</label>
                <input type="color" id="inline-theme-bg" value="${config.theme.backgroundColor || '#ffffff'}">
            </div>
            <div class="form-group">
                <label>Color de Texto</label>
                <input type="color" id="inline-theme-text" value="${config.theme.textColor || '#1e293b'}">
            </div>

            <p class="modal-section-label" style="margin-top:20px;">Tipografía</p>
            <div class="form-group">
                <label>Familia de Fuentes</label>
                <select id="inline-theme-font" class="dynamic-input">
                    <option value="'Inter', sans-serif" ${(config.theme.fontFamily||'').includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="'Roboto', sans-serif" ${(config.theme.fontFamily||'').includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="system-ui, sans-serif" ${(config.theme.fontFamily||'').includes('system-ui') ? 'selected' : ''}>Sistema</option>
                </select>
            </div>

            <p class="modal-section-label" style="margin-top:20px;">Depuración de Diseño (Debug)</p>
            <div class="form-group">
                <label>Modo de visualización</label>
                <div class="debug-toggle-group" id="debug-toggle-group">
                    <button class="debug-toggle-btn ${debugLevel === 0 ? 'active' : ''}" data-level="0" onclick="setDebugLevel(0)">Desactivado</button>
                    <button class="debug-toggle-btn ${debugLevel === 1 ? 'active' : ''}" data-level="1" onclick="setDebugLevel(1)">Nivel 1</button>
                    <button class="debug-toggle-btn ${debugLevel === 2 ? 'active' : ''}" data-level="2" onclick="setDebugLevel(2)">Nivel 2</button>
                </div>
            </div>
            <p style="font-size:11px; color:#64748b; margin-top:-8px; line-height: 1.4;">La depuración visual se restaura al recargar la página.</p>

            <button class="modal-btn" onclick="saveGeneralSettings()">Guardar Cambios</button>
        </div>
    `;
    showModal(html);
}

window.setDebugLevel = function(level) {
    document.querySelectorAll('.debug-toggle-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.level) === level);
    });
    window._pendingDebugLevel = level;
};

window.saveGeneralSettings = function() {
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
   MODAL 2: ESTRUCTURA (DOS COLUMNAS, SIN EMOJIS)
   ========================================== */
function openStructureModal() {
    const html = `
        <div class="modal-header">
            <h2>Estructura del CV</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="structure-columns">
            <div class="structure-column">
                <div class="structure-col-header sidebar-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/></svg>
                    <span>Columna Lateral</span>
                </div>
                <div id="structure-sidebar" class="structure-area-list"></div>
            </div>
            <div class="structure-column">
                <div class="structure-col-header main-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="3" width="7" height="18" rx="1"/><rect x="3" y="3" width="7" height="18" rx="1" opacity="0.3"/></svg>
                    <span>Columna Principal</span>
                </div>
                <div id="structure-main" class="structure-area-list"></div>
            </div>
        </div>
    `;
    showModal(html);
    document.getElementById('general-settings-modal').style.width = '560px';
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

        // Toggle activo/inactivo
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

        // Nombre de la sección formateado
        const name = document.createElement('span');
        name.className = 'struct-name';
        name.textContent = sec.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Controles de orden
        const controls = document.createElement('div');
        controls.className = 'struct-controls';

        const btnUp = document.createElement('button');
        btnUp.innerHTML = '▲';
        btnUp.className = 'struct-btn';
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
   MODAL 3: DATOS DE SECCIÓN (SANEADO, CORPORATIVO, SIN EMOJIS)
   ========================================== */
function openDataEditorModal(sectionId) {
    const formattedTitle = sectionId.split('-').map(w => w.toUpperCase()).join(' ');
    const html = `
        <div class="modal-header">
            <h2>Editar Datos: ${formattedTitle}</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" id="data-editor-form" style="max-height:60vh; overflow-y:auto; padding-right:10px;">
            <!-- Generado dinámicamente -->
        </div>
        <div class="modal-footer" style="margin-top: 16px;">
            <button class="modal-btn" onclick="closeModal()" style="margin-top: 0;">Guardar y Cerrar</button>
        </div>
    `;
    showModal(html);

    const formCont = document.getElementById('data-editor-form');
    const data = window.CVSectionsData[sectionId];
    if (!data) return;

    generatePremiumFormFields(data, formCont, [], sectionId);
}

function generatePremiumFormFields(obj, parentElement, pathKeys, sectionId) {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, val]) => {
        const currentPath = [...pathKeys, key];
        const labelText = key.replace(/_/g, ' ').toUpperCase();

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group-dynamic';
        formGroup.style.marginBottom = '14px';

        if (typeof val === 'string' || typeof val === 'number') {
            const label = document.createElement('label');
            label.innerText = labelText;
            label.style.display = 'block';
            label.style.marginBottom = '6px';
            label.style.fontSize = '11px';
            label.style.fontWeight = '600';
            label.style.letterSpacing = '0.5px';
            label.style.color = '#475569';
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
            label.innerHTML = `<span style="font-weight: 700; color: #0f172a; font-size: 12px; display: block; margin-top: 10px; margin-bottom: 6px;">${labelText}</span>`;
            formGroup.appendChild(label);

            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-container';

            val.forEach((item, idx) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'array-item';
                
                const controls = document.createElement('div');
                controls.className = 'array-controls';
                
                const btnDel = document.createElement('button');
                btnDel.className = 'btn-delete-item';
                btnDel.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Eliminar
                `;
                btnDel.onclick = () => {
                    val.splice(idx, 1);
                    localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                    window.refreshCV();
                    openDataEditorModal(sectionId); // re-render modal
                };

                controls.appendChild(btnDel);
                itemCard.appendChild(controls);

                if (typeof item === 'object' && item !== null) {
                    generatePremiumFormFields(item, itemCard, [...currentPath, idx], sectionId);
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = String(item);
                    input.className = 'dynamic-input';
                    input.onchange = (e) => {
                        updateNestedValue(window.CVSectionsData[sectionId], [...currentPath, idx], e.target.value);
                        localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                        window.refreshCV();
                    };
                    itemCard.appendChild(input);
                }
                arrayContainer.appendChild(itemCard);
            });

            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn-add-item';
            btnAdd.innerText = `+ Añadir elemento a ${labelText.toLowerCase()}`;
            btnAdd.onclick = () => {
                let newItem = typeof val[0] === 'object' ? Object.keys(val[0]).reduce((acc, k) => ({...acc, [k]: ""}), {}) : "";
                val.push(newItem);
                localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                window.refreshCV();
                openDataEditorModal(sectionId);
            };

            formGroup.appendChild(arrayContainer);
            formGroup.appendChild(btnAdd);
            parentElement.appendChild(formGroup);

        } else if (typeof val === 'object' && val !== null) {
            const label = document.createElement('label');
            label.innerHTML = `<span style="font-weight: 700; color: #334155; font-size: 11px; display: block; margin-top: 8px;">Grupo: ${labelText}</span>`;
            formGroup.appendChild(label);

            const subContainer = document.createElement('div');
            subContainer.style.borderLeft = '2px solid #e2e8f0';
            subContainer.style.paddingLeft = '12px';
            subContainer.style.marginLeft = '4px';
            subContainer.style.marginTop = '6px';

            generatePremiumFormFields(val, subContainer, currentPath, sectionId);
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
   MODAL 4: BACKUPS Y EXPORTACIÓN (SIN EMOJIS)
   ========================================== */
function openBackupsModal() {
    const html = `
        <div class="modal-header">
            <h2>Copias de Seguridad y Datos</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
            <button class="modal-btn" onclick="exportBackup()">Descargar JSON Consolidado</button>
            <button class="modal-btn-secondary" onclick="document.getElementById('import-config-file').click()">Importar JSON</button>
            <button class="modal-btn" style="background:#ef4444; color: #ffffff;" onclick="resetToFactory()">Restablecer de Fábrica</button>
        </div>
    `;
    showModal(html);
}

window.exportBackup = function() {
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

window.resetToFactory = function() {
    if (confirm('¿Borrar todos los cambios y restablecer?')) {
        localStorage.clear();
        location.reload();
    }
};

document.getElementById('import-config-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.masterConfig) localStorage.setItem('cv_master_config', JSON.stringify(data.masterConfig));
            if (data.sectionsData) {
                Object.keys(data.sectionsData).forEach(k => {
                    localStorage.setItem(`cv_section_data_${k}`, JSON.stringify(data.sectionsData[k]));
                });
            }
            alert('Carga exitosa');
            location.reload();
        } catch (err) {
            alert('Error al leer JSON');
        }
    };
    reader.readAsText(file);
});

/* ==========================================
   CAMBIO DE COMPONENTES DE DISEÑO (INTERACTIVO CON PREVIEWS)
   ========================================== */
function changeSectionComponent(sectionId) {
    const config = window.CVConfig;
    const sec = config.sections.find(s => s.id === sectionId);
    if (!sec) return;

    let contentHtml = '';

    if (sectionId === 'languages') {
        const current = sec.component || 'bars';
        contentHtml = `
            <div class="modal-header">
                <h2>Diseño de la Sección: Idiomas</h2>
                <button class="btn-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <p style="font-size: 13px; color: #475569; margin-bottom: 16px;">Seleccione la variante visual para presentar los idiomas en su currículum. Los cambios se aplicarán en tiempo real.</p>

                <div class="layout-preview-container">
                    <div class="layout-preview-grid">
                        <div class="layout-preview-card ${current === 'bars' ? 'active' : ''}" onclick="selectComponentOption('languages', 'bars')">
                            <div class="layout-preview-header">
                                <h3 class="layout-preview-title">Barras de Progreso</h3>
                                <span class="layout-preview-badge">${current === 'bars' ? 'Activo' : 'Seleccionar'}</span>
                            </div>
                            <p class="layout-preview-desc">Muestra cada idioma con una barra horizontal de progreso indicando el nivel de competencia de forma muy visual.</p>
                            <div class="layout-mini-preview">
                                <div class="layout-mini-preview-bar">
                                    <div class="layout-mini-preview-bar-row"></div>
                                    <div class="layout-mini-preview-bar-row" style="opacity: 0.6;"></div>
                                </div>
                            </div>
                        </div>

                        <div class="layout-preview-card ${current === 'pills' ? 'active' : ''}" onclick="selectComponentOption('languages', 'pills')">
                            <div class="layout-preview-header">
                                <h3 class="layout-preview-title">Etiquetas de Nivel (Pills)</h3>
                                <span class="layout-preview-badge">${current === 'pills' ? 'Activo' : 'Seleccionar'}</span>
                            </div>
                            <p class="layout-preview-desc">Presenta los idiomas como etiquetas compactas con un badge para el nivel, ideal para optimizar el espacio vertical.</p>
                            <div class="layout-mini-preview">
                                <div class="layout-mini-preview-pills">
                                    <div class="layout-mini-preview-pill"></div>
                                    <div class="layout-mini-preview-pill"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn-secondary" onclick="closeModal()">Cerrar</button>
            </div>
        `;
    } else {
        const formattedName = sectionId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        contentHtml = `
            <div class="modal-header">
                <h2>Diseño de la Sección: ${formattedName}</h2>
                <button class="btn-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body single-layout-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <p><strong>Diseño Estándar Ultra-Optimizado</strong></p>
                <p>Esta sección está configurada con un diseño premium por defecto, adaptado para mantener la máxima legibilidad, espaciado automático de A4 y compatibilidad con sistemas ATS.</p>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Variantes de diseño adicionales para esta sección estarán disponibles en futuras actualizaciones.</p>
            </div>
            <div class="modal-footer">
                <button class="modal-btn" onclick="closeModal()" style="margin-top: 0;">Entendido</button>
            </div>
        `;
    }
    showModal(contentHtml);
}

window.selectComponentOption = function(sectionId, componentName) {
    const config = window.CVConfig;
    const sec = config.sections.find(s => s.id === sectionId);
    if (!sec) return;

    sec.component = componentName;
    localStorage.setItem('cv_master_config', JSON.stringify(config));
    window.refreshCV();

    // Volver a abrir para reflejar la selección en tiempo real en el modal
    changeSectionComponent(sectionId);
};
