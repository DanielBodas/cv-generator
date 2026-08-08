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

    // Fallback: si cv-loaded ya se disparó antes de que este script cargara,
    // bindInlineEvents habrá sido un no-op. Los eventos ya están delegados arriba.
})

// bindInlineEvents ya no es necesaria (la delegación cubre esto)
function bindInlineEvents() {}

function triggerSaveAnimation() {
    // Sincronización transparente (podríamos añadir un pequeño toast minimalista)
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
            <h2>⚙️ Ajustes Generales</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">

            <p class="modal-section-label">Colores</p>
            <div class="form-group">
                <label>Color Principal</label>
                <input type="color" id="inline-theme-primary" value="${config.theme.primaryColor || '#1d3557'}">
            </div>
            <div class="form-group">
                <label>Color Sidebar</label>
                <input type="color" id="inline-theme-sidebar" value="${config.theme.sidebarColor || '#1d3557'}">
            </div>
            <div class="form-group">
                <label>Color Fondo</label>
                <input type="color" id="inline-theme-bg" value="${config.theme.backgroundColor || '#ffffff'}">
            </div>
            <div class="form-group">
                <label>Color Texto</label>
                <input type="color" id="inline-theme-text" value="${config.theme.textColor || '#1e293b'}">
            </div>

            <p class="modal-section-label" style="margin-top:20px;">Tipografía</p>
            <div class="form-group">
                <label>Fuente</label>
                <select id="inline-theme-font">
                    <option value="'Inter', sans-serif" ${(config.theme.fontFamily||'').includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="'Roboto', sans-serif" ${(config.theme.fontFamily||'').includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="system-ui, sans-serif" ${(config.theme.fontFamily||'').includes('system-ui') ? 'selected' : ''}>Sistema</option>
                </select>
            </div>

            <p class="modal-section-label" style="margin-top:20px;">Debug Layout</p>
            <div class="form-group">
                <label>Modo de visualización de debug</label>
                <div class="debug-toggle-group" id="debug-toggle-group">
                    <button class="debug-toggle-btn ${debugLevel === 0 ? 'active' : ''}" data-level="0" onclick="setDebugLevel(0)">Off</button>
                    <button class="debug-toggle-btn ${debugLevel === 1 ? 'active' : ''}" data-level="1" onclick="setDebugLevel(1)">Nivel 1</button>
                    <button class="debug-toggle-btn ${debugLevel === 2 ? 'active' : ''}" data-level="2" onclick="setDebugLevel(2)">Nivel 2</button>
                </div>
            </div>
            <p style="font-size:11px; color:#555; margin-top:-8px;">El debug se resetea automáticamente al recargar la página.</p>

            <button class="modal-btn" onclick="saveGeneralSettings()">Aplicar Cambios</button>
        </div>
    `;
    showModal(html);
}

window.setDebugLevel = function(level) {
    document.querySelectorAll('.debug-toggle-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.level) === level);
    });
    // Guardar en variable temporal para leerla al aplicar
    window._pendingDebugLevel = level;
};

window.saveGeneralSettings = function() {
    window.CVConfig.theme.primaryColor = document.getElementById('inline-theme-primary').value;
    window.CVConfig.theme.sidebarColor = document.getElementById('inline-theme-sidebar').value;
    window.CVConfig.theme.backgroundColor = document.getElementById('inline-theme-bg').value;
    window.CVConfig.theme.textColor = document.getElementById('inline-theme-text').value;
    window.CVConfig.theme.fontFamily = document.getElementById('inline-theme-font').value;
    
    // Debug: leer nivel desde pendingDebugLevel o el botón activo
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
            <h2>🗂️ Estructura del CV</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="structure-columns">
            <div class="structure-column">
                <div class="structure-col-header sidebar-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/></svg>
                    <span>Sidebar</span>
                </div>
                <div id="structure-sidebar" class="structure-area-list"></div>
            </div>
            <div class="structure-column">
                <div class="structure-col-header main-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="3" width="7" height="18" rx="1"/><rect x="3" y="3" width="7" height="18" rx="1" opacity="0.3"/></svg>
                    <span>Main</span>
                </div>
                <div id="structure-main" class="structure-area-list"></div>
            </div>
        </div>
    `;
    // Modal más ancho para dos columnas
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

        // Nombre de la sección
        const name = document.createElement('span');
        name.className = 'struct-name';
        name.textContent = sec.id;

        // Controles de orden
        const controls = document.createElement('div');
        controls.className = 'struct-controls';

        const btnUp = document.createElement('button');
        btnUp.innerHTML = '▲';
        btnUp.className = 'struct-btn';
        btnUp.disabled = areaIndex === 0;
        btnUp.onclick = () => {
            if (areaIndex > 0) {
                // Mover dentro del orden global (solo entre misma área)
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
   MODAL 3: DATOS DE SECCIÓN
   ========================================== */
function openDataEditorModal(sectionId) {
    const html = `
        <div class="modal-header">
            <h2>✏️ Datos: ${sectionId.toUpperCase()}</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" id="data-editor-form" style="max-height:60vh; overflow-y:auto; padding-right:10px;">
            <!-- Generado dinámicamente -->
        </div>
        <button class="modal-btn" onclick="closeModal()">Cerrar</button>
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
        formGroup.style.marginBottom = '12px';

        if (typeof val === 'string' || typeof val === 'number') {
            const label = document.createElement('label');
            label.innerText = labelText;
            label.style.display = 'block';
            label.style.marginBottom = '4px';
            label.style.fontSize = '11px';
            label.style.color = '#a1a1aa';
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
                window.refreshSection(sectionId);
            });
            formGroup.appendChild(input);
            parentElement.appendChild(formGroup);

        } else if (Array.isArray(val)) {
            const label = document.createElement('label');
            label.innerHTML = `<strong style="color: #818cf8;">📁 ${labelText}</strong>`;
            label.style.display = 'block';
            label.style.marginBottom = '8px';
            formGroup.appendChild(label);

            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-container';

            val.forEach((item, idx) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'array-item';
                
                const controls = document.createElement('div');
                controls.className = 'array-controls';
                
                const btnDel = document.createElement('button');
                btnDel.innerText = '🗑️';
                btnDel.className = 'dock-btn';
                btnDel.style.padding = '4px';
                btnDel.onclick = () => {
                    val.splice(idx, 1);
                    localStorage.setItem(`cv_section_data_${sectionId}`, JSON.stringify(window.CVSectionsData[sectionId]));
                    window.refreshSection(sectionId);
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
                        window.refreshSection(sectionId);
                    };
                    itemCard.appendChild(input);
                }
                arrayContainer.appendChild(itemCard);
            });

            const btnAdd = document.createElement('button');
            btnAdd.className = 'modal-btn';
            btnAdd.style.background = 'rgba(255,255,255,0.05)';
            btnAdd.style.color = '#fff';
            btnAdd.style.border = '1px dashed rgba(255,255,255,0.2)';
            btnAdd.innerText = `+ Añadir ${labelText}`;
            btnAdd.onclick = () => {
                let newItem = typeof val[0] === 'object' ? Object.keys(val[0]).reduce((acc, k) => ({...acc, [k]: ""}), {}) : "";
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
            label.innerHTML = `<strong>📦 ${labelText}</strong>`;
            formGroup.appendChild(label);

            const subContainer = document.createElement('div');
            subContainer.style.borderLeft = '1px solid rgba(255,255,255,0.1)';
            subContainer.style.paddingLeft = '12px';
            subContainer.style.marginLeft = '4px';

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
   MODAL 4: BACKUPS Y EXPORTACIÓN
   ========================================== */
function openBackupsModal() {
    const html = `
        <div class="modal-header">
            <h2>💾 Backups y Datos</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
            <button class="modal-btn" onclick="exportBackup()">📥 Descargar JSON Consolidado</button>
            <button class="modal-btn" style="background:rgba(255,255,255,0.1); color:#fff;" onclick="document.getElementById('import-config-file').click()">📤 Importar JSON</button>
            <button class="modal-btn" style="background:#ef4444;" onclick="resetToFactory()">🔄 Restablecer de Fábrica</button>
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
    if (confirm('⚠️ ¿Borrar todos los cambios y restablecer?')) {
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
   CAMBIO DE COMPONENTES DE DISEÑO
   ========================================== */
function changeSectionComponent(sectionId) {
    const config = window.CVConfig;
    const sec = config.sections.find(s => s.id === sectionId);
    if (!sec) return;
    
    if (sectionId === 'languages') {
        const current = sec.component || 'bars';
        sec.component = current === 'bars' ? 'pills' : 'bars';
    } else {
        alert(`Opciones de diseño no implementadas para: ${sectionId}`);
        return;
    }

    localStorage.setItem('cv_master_config', JSON.stringify(config));
    window.refreshSection(sectionId);
}
