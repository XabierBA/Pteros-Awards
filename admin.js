// ===== CONTRASEÑA DE ADMIN =====
const ADMIN_PASSWORD = "qawsedrfty123456";

// Añade esta función en admin.js (al final del archivo):
function mostrarDescripcionBotones() {
    const descripciones = {
        'Ver Resultados': 'Muestra los resultados finales de todas las categorías',
        'Exportar Datos': 'Descarga todos los datos en un archivo JSON',
        'Importar Datos': 'Carga datos desde un archivo JSON',
        'Reiniciar Votos': 'Borra todos los votos (cuidado: irreversible)',
        'Diagnosticar Firebase': 'Verifica el estado de conexión con Firebase',
        'Sincronizar Firebase': 'Forza la sincronización con Firebase',
        'Verificar Votos': 'Muestra estadísticas detalladas de votos',
        'Limpiar Cache Local': 'Borra datos locales y recarga desde Firebase'
    };
    
    console.log("=== 🛠️ DESCRIPCIONES DE BOTONES ===");
    Object.entries(descripciones).forEach(([boton, desc]) => {
        console.log(`• ${boton}: ${desc}`);
    });
}


// ===== FUNCIÓN PRINCIPAL PARA ABRIR PANEL =====
function openAdminPanel() {
    console.log("openAdminPanel llamada - VERIFICANDO ACCESO");
    
    // VERIFICAR QUE EL USUARIO ESTÉ LOGUEADO
    if (!appData || !appData.currentUser) {
        alert('❌ Debes iniciar sesión para acceder al panel admin');
        return;
    }
    
    // VERIFICACIÓN EXTRA: Asegurarnos que no haya acceso directo
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && adminPanel.style.display === 'block') {
        closeAdminPanel(); // Si por algún motivo ya está abierto, cerrarlo
        return;
    }
    
    console.log("Mostrando modal de contraseña...");
    
    // Mostrar modal de contraseña (NO el panel directamente)
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.style.display = 'flex'; // Usar flex para centrar
        passwordModal.style.alignItems = 'center';
        passwordModal.style.justifyContent = 'center';
        document.getElementById('adminPassword').value = '';
        document.getElementById('passwordError').textContent = '';
        document.getElementById('adminPassword').focus();
    } else {
        console.error("❌ ERROR: No se encontró el modal de contraseña");
    }
}

// ===== FUNCIONES DEL MODAL DE CONTRASEÑA =====
function closePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.style.display = 'none';
    }
    document.getElementById('adminPassword').value = '';
    document.getElementById('passwordError').textContent = '';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const eyeIcon = document.getElementById('passwordEye');
    
    if (!passwordInput || !eyeIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

function checkAdminPassword() {
    console.log("🔐 Verificando contraseña admin...");
    
    const passwordInput = document.getElementById('adminPassword');
    const errorElement = document.getElementById('passwordError');
    
    if (!passwordInput || !errorElement) {
        console.error("❌ Elementos del formulario no encontrados");
        return;
    }
    
    const inputPassword = passwordInput.value.trim();
    
    if (!inputPassword) {
        errorElement.textContent = '❌ Por favor, introduce la contraseña';
        errorElement.style.color = '#ff4757';
        passwordInput.focus();
        return;
    }
    
    if (inputPassword === ADMIN_PASSWORD) {
        console.log("✅ Contraseña correcta - Acceso concedido");
        
        // Contraseña correcta
        errorElement.textContent = '✅ Acceso concedido...';
        errorElement.style.color = '#4CAF50';
        
        // Cerrar modal de contraseña
        setTimeout(() => {
            closePasswordModal();
            
            // ABRIR PANEL ADMIN - SOLO AQUÍ
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.style.display = 'block';
                console.log("✅ Panel admin mostrado después de autenticación");
                
                // Actualizar estadísticas
                if (typeof updateStats === 'function') updateStats();
                
                // Cargar listas
                if (typeof cargarListaPersonas === 'function') cargarListaPersonas();
                if (typeof cargarListaFotos === 'function') cargarListaFotos();
            } else {
                console.error("❌ ERROR: No se encontró el panel admin");
                alert("Error del sistema: No se puede mostrar el panel de administración");
            }
        }, 800);
        
    } else {
        console.log("❌ Contraseña incorrecta - Activando medidas de seguridad");
        
        // ¡CONTRASEÑA INCORRECTA - RICKROLL ACTIVADO!
        errorElement.textContent = '❌ Contraseña incorrecta. ¡Rickroll en 3... 2... 1...!';
        errorElement.style.color = '#ff4757';
        
        // Animación de shake
        passwordInput.classList.add('shake');
        setTimeout(() => {
            passwordInput.classList.remove('shake');
        }, 500);
        
        // RICKROLL - Abrir en nueva pestaña inmediatamente
        setTimeout(() => {
            window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
        }, 1000);
        
        // Mensaje divertido y limpiar campo
        setTimeout(() => {
            errorElement.textContent = '❌ ¡Contraseña incorrecta! Disfruta del Rickroll 🎵';
            
            // Limpiar campo y volver a enfocar
            passwordInput.value = '';
            passwordInput.focus();
        }, 1500);
    }
}

// ===== FUNCIONES DEL PANEL ADMIN =====
function closeAdminPanel() {
    console.log("🔒 Cerrando panel admin...");
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
        console.log("✅ Panel admin ocultado");
    } else {
        console.warn("⚠️ Panel admin no encontrado al intentar cerrar");
    }
    
    // También cerrar modal de contraseña si está abierto
    closePasswordModal();
}

function setPhase(phase) {
    if (!appData) return;
    
    appData.phase = phase;
    saveData();
    updatePhaseBanner(); // ← Esto actualizará el botón
    renderCategories();
    
    if (phase === 'results') {
        showResults(); // Muestra resultados automáticamente al admin
    }
    
    alert(`✅ Fase cambiada a: ${getPhaseName(phase)}`);
}

function getPhaseName(phase) {
    const phases = {
        'nominations': 'Nominaciones',
        'voting': 'Votación Final',
        'results': 'Resultados'
    };
    return phases[phase] || phase;
}

function addCategory() {
    const input = document.getElementById('newCategory');
    if (!input || !appData) return;
    
    const name = input.value.trim();
    
    if (!name) {
        alert('Por favor, introduce un nombre para la categoría');
        return;
    }
    
    // Encontrar el máximo ID actual
    const maxId = appData.categories && appData.categories.length > 0 
        ? Math.max(...appData.categories.map(c => c.id || 0)) 
        : 0;
    
    const newId = maxId + 1;
    
    // Asegurar que categories existe
    if (!appData.categories) appData.categories = [];
    
    appData.categories.push({
        id: newId,
        name: name,
        nominees: []
    });
    
    saveData();
    renderCategories();
    input.value = '';
    alert('✅ ¡Categoría añadida!');
}

// ===== GESTIÓN DE FOTOS =====

// Función para cargar la lista de personas en el select
function cargarListaPersonas() {
    const personSelect = document.getElementById('personSelect');
    if (!personSelect) return;
    
    // Limpiar opciones excepto la primera
    personSelect.innerHTML = '<option value="">Seleccionar persona...</option>';
    
    const personas = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", 
                     "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    personas.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona;
        option.textContent = persona;
        personSelect.appendChild(option);
    });
}

// Función para cargar la lista de fotos actuales
function cargarListaFotos() {
    const photosList = document.getElementById('photosList');
    if (!photosList || !appData || !appData.photoUrls) return;
    
    photosList.innerHTML = '';
    
    const personas = Object.keys(appData.photoUrls || {}).sort();
    
    if (personas.length === 0) {
        photosList.innerHTML = '<div class="photo-item">No hay fotos configuradas</div>';
        return;
    }
    
    personas.forEach(persona => {
        const fotoUrl = appData.photoUrls[persona];
        if (!fotoUrl) return;
        
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        // Determinar si es una URL de GitHub
        const esGitHub = fotoUrl.includes('github.com') || fotoUrl.includes('raw.githubusercontent.com');
        const esPlaceholder = fotoUrl.includes('data:image/svg+xml');
        
        let tipo = 'URL';
        if (esGitHub) tipo = 'GitHub';
        if (esPlaceholder) tipo = 'Placeholder';
        
        photoItem.innerHTML = `
            <div class="photo-info">
                <strong>${persona}</strong><br>
                <small>Tipo: ${tipo}</small><br>
                ${!esPlaceholder ? `<a href="${fotoUrl}" target="_blank">${fotoUrl.substring(0, 50)}...</a>` : 'Avatar por defecto'}
            </div>
            ${!esPlaceholder ? `<img src="${fotoUrl}" class="photo-thumbnail" alt="${persona}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"50\" height=\"50\" viewBox=\"0 0 50 50\"><rect width=\"50\" height=\"50\" fill=\"%23ccc\"/><text x=\"25\" y=\"30\" font-size=\"20\" fill=\"white\" text-anchor=\"middle\">❌</text></svg>';">` : 
              `<div class="photo-thumbnail" style="background:#667eea;display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-weight:bold;">${persona.charAt(0)}</span>
              </div>`}
        `;
        
        photosList.appendChild(photoItem);
    });
}

// Función para actualizar foto seleccionada
function updateSelectedPhoto() {
    const personSelect = document.getElementById('personSelect');
    const photoUrlInput = document.getElementById('photoUrl');
    
    if (!personSelect || !photoUrlInput) {
        alert('Error: No se encontraron los elementos del formulario');
        return;
    }
    
    const persona = personSelect.value;
    const nuevaUrl = photoUrlInput.value.trim();
    
    if (!persona) {
        alert('❌ Por favor, selecciona una persona');
        return;
    }
    
    if (!nuevaUrl) {
        alert('❌ Por favor, introduce una URL de foto');
        return;
    }
    
    // Validar URL básica
    if (!nuevaUrl.startsWith('http://') && !nuevaUrl.startsWith('https://')) {
        alert('❌ La URL debe empezar con http:// o https://');
        return;
    }
    
    // Usar la nueva función del sistema de fotos
    if (typeof actualizarFotoPersona === 'function') {
        actualizarFotoPersona(persona, nuevaUrl).then(() => {
            alert(`✅ Foto de ${persona} actualizada`);
            photoUrlInput.value = '';
            cargarListaFotos();
        });
    } else if (typeof updatePersonPhoto === 'function') {
        // Fallback a la función antigua
        updatePersonPhoto(persona, nuevaUrl);
        alert(`✅ Foto de ${persona} actualizada`);
        photoUrlInput.value = '';
        cargarListaFotos();
    } else {
        alert('❌ Error: No se encontró función para actualizar fotos');
    }
}

// Función para usar foto de GitHub
function usarFotoGitHub() {
    const personSelect = document.getElementById('personSelect');
    const photoUrlInput = document.getElementById('photoUrl');
    
    if (!personSelect || !photoUrlInput) return;
    
    const persona = personSelect.value;
    
    if (!persona) {
        alert('❌ Primero selecciona una persona');
        return;
    }
    
    // Preguntar por el nombre del archivo
    const nombreArchivo = prompt(
        `Introduce el nombre del archivo para ${persona} (ej: brais.jpg):\n\n` +
        `Las fotos deben estar en: https://github.com/XabiERBA/Pteros-Awards/tree/main/fotos/`,
        `${persona.toLowerCase()}.jpg`
    );
    
    if (!nombreArchivo) return;
    
    // Construir URL de GitHub
    const githubUrl = `https://raw.githubusercontent.com/XabiERBA/Pteros-Awards/main/fotos/${nombreArchivo}`;
    
    // Poner en el input
    photoUrlInput.value = githubUrl;
    
    // Informar al usuario
    alert(`✅ URL generada:\n${githubUrl}\n\nAhora haz clic en "Actualizar Foto" para guardar.`);
}

// Función para subir foto desde archivo
function subirFotoArchivo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const personSelect = document.getElementById('personSelect');
        if (!personSelect || !personSelect.value) {
            alert('❌ Primero selecciona una persona');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const dataUrl = event.target.result;
            const persona = personSelect.value;
            
            if (confirm(`¿Subir esta foto para ${persona}?\n\nTamaño: ${Math.round(file.size / 1024)} KB`)) {
                if (typeof updatePersonPhoto === 'function') {
                    updatePersonPhoto(persona, dataUrl);
                    alert(`✅ Foto de ${persona} subida correctamente`);
                    cargarListaFotos();
                }
            }
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

function showResults() {
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    if (!modal || !modalCategory || !nomineesList || !appData) return;
    
    modalCategory.textContent = '🏆 RESULTADOS FINALES 🏆';
    nomineesList.innerHTML = '';
    
    const categories = appData.categories || [];
    
    if (categories.length === 0) {
        nomineesList.innerHTML = '<div class="nominee-item">No hay categorías</div>';
        modal.style.display = 'block';
        return;
    }
    
    categories.forEach(category => {
        const nominees = category.nominees || [];
        const sortedNominees = [...nominees]
            .filter(n => n)
            .sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        const winner = sortedNominees[0];
        const second = sortedNominees[1];
        const third = sortedNominees[2];
        
        const resultItem = document.createElement('div');
        resultItem.className = 'nominee-item';
        resultItem.style.background = 'linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(212, 175, 55, 0.1))';
        resultItem.style.border = '2px solid var(--gold)';
        
        let podiumHTML = '';
        if (winner) {
            // MODIFICADO: MOSTRAR VOTOS DE CADA UNO
            podiumHTML = `
                <div style="display: flex; justify-content: center; gap: 20px; margin: 15px 0; flex-wrap: wrap;">
                    ${second ? `
                        <div style="text-align: center; flex: 1; min-width: 100px;">
                            <div style="font-size: 2rem;">🥈</div>
                            <div style="font-weight: bold;">${second.name || 'Sin nombre'}</div>
                            <div style="color: var(--silver); font-size: 0.9rem;">${second.votes || 0} votos</div>
                            <div style="color: var(--silver);">Segundo lugar</div>
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center; flex: 1; min-width: 120px;">
                        <div style="font-size: 3rem;">🥇</div>
                        <div style="font-weight: bold; font-size: 1.3rem; color: var(--gold);">${winner.name || 'Sin nombre'}</div>
                        <div style="color: var(--gold); font-weight: bold; font-size: 0.9rem;">${winner.votes || 0} votos</div>
                        <div style="color: var(--gold); font-weight: bold;">¡GANADOR/A!</div>
                    </div>
                    
                    ${third ? `
                        <div style="text-align: center; flex: 1; min-width: 100px;">
                            <div style="font-size: 1.5rem;">🥉</div>
                            <div style="font-weight: bold;">${third.name || 'Sin nombre'}</div>
                            <div style="color: var(--bronze); font-size: 0.9rem;">${third.votes || 0} votos</div>
                            <div style="color: var(--bronze);">Tercer lugar</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    
        const totalVotes = nominees.reduce((sum, n) => sum + (n.votes || 0), 0);
        const totalVoters = nominees.reduce((sum, n) => sum + ((n.voters || []).length), 0);
        
        // ========== CÓDIGO DE FRASES ==========
        let frasesHTML = '';
        
        // Solo para categoría 17 (Frase del Año)
        if (category.id === 17) {
            const todasLasFrases = [];
            
            // Recoger todas las frases de todos los nominados
            nominees.forEach(nominee => {
                if (nominee.frases && Object.keys(nominee.frases).length > 0) {
                    Object.values(nominee.frases).forEach(fraseData => {
                        todasLasFrases.push({
                            persona: nominee.name,
                            frase: fraseData.frase,
                            votante: fraseData.voter,
                            votos: nominee.votes || 0
                        });
                    });
                }
            });
            
            // Ordenar frases (las más votadas primero)
            todasLasFrases.sort((a, b) => b.votos - a.votos);
            
            if (todasLasFrases.length > 0) {
                frasesHTML = `
                    <div style="margin-top: 25px; background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.3);">
                        <h4 style="color: var(--gold); text-align: center; margin-bottom: 15px;">
                            💬 Frases Icónicas del Año
                        </h4>
                `;
                
                // Mostrar máximo 5 frases
                todasLasFrases.slice(0, 5).forEach((item, index) => {
                    frasesHTML += `
                        <div style="margin: 12px 0; padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; border-left: 3px solid var(--gold);">
                            <div style="font-style: italic; color: white; margin-bottom: 5px;">
                                "${item.frase}"
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--silver);">
                                <span><strong>${item.persona}</strong></span>
                                <span>Añadida por: ${item.votante}</span>
                            </div>
                        </div>
                    `;
                });
                
                if (todasLasFrases.length > 5) {
                    frasesHTML += `
                        <div style="text-align: center; margin-top: 10px; font-size: 12px; color: var(--silver);">
                            + ${todasLasFrases.length - 5} frases más...
                        </div>
                    `;
                }
                
                frasesHTML += '</div>';
            }
        }
        // ========== FIN DEL CÓDIGO DE FRASES ==========
        
        // MODIFICADO: Solo mostrar "X votos totales" sin detalles
        resultItem.innerHTML = `
            <h3 style="color: var(--gold); text-align: center; margin-bottom: 15px;">${category.name || 'Sin nombre'}</h3>
            ${category.description ? `<p style="text-align: center; color: var(--silver); font-style: italic; margin-bottom: 15px;">${category.description}</p>` : ''}
            ${winner ? podiumHTML : '<p style="text-align: center; color: var(--silver);">Sin votos registrados</p>'}
            ${frasesHTML}
            <div style="margin-top: 20px; color: var(--silver); font-size: 0.9rem; text-align: center;">
                <p>${totalVotes} votos totales | ${totalVoters} votantes</p>
            </div>
        `;
        
        nomineesList.appendChild(resultItem);
    });
    
    modal.style.display = 'block';
}

// ===== IMPORTAR/EXPORTAR =====
function exportData() {
    if (!appData) return;
    
    const dataToExport = {
        categories: appData.categories || [],
        users: appData.users || [],
        phase: appData.phase || 'nominations',
        photoUrls: appData.photoUrls || {},
        exportDate: new Date().toISOString(),
        app: 'Pteros Awards'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `pteros_awards_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    
    alert('✅ Datos exportados correctamente');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => { 
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const imported = JSON.parse(event.target.result);
                
                if (confirm('⚠️ ¿IMPORTAR DATOS?\n\nEsto sobrescribirá:\n• Categorías\n• Usuarios\n• Fotos\n• Fase actual\n\n¿Continuar?')) {
                    appData.categories = imported.categories || appData.categories || [];
                    appData.users = imported.users || appData.users || [];
                    appData.phase = imported.phase || 'nominations';
                    appData.photoUrls = imported.photoUrls || appData.photoUrls || {};
                    
                    // Verificar IDs duplicados
                    if (typeof verificarIDsCategorias === 'function') {
                        verificarIDsCategorias();
                    }
                    
                    saveData();
                    saveUsers();
                    savePhotos();
                    renderCategories();
                    updateVotersList();
                    updateStats();
                    cargarListaFotos();
                    
                    alert('✅ Datos importados correctamente');
                }
            } catch (error) {
                console.error('Error importing:', error);
                alert('❌ Error al importar. El archivo puede estar corrupto.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ===== VERIFICACIÓN DE VOTOS =====
function verificarVotos() {
    console.log("=== 🔍 VERIFICANDO VOTOS ===");
    
    if (!appData) {
        console.log("❌ appData no disponible");
        return;
    }
    
    console.log("📊 ESTADÍSTICAS:");
    console.log("- Usuarios totales:", appData.users?.length || 0);
    console.log("- Categorías:", appData.categories?.length || 0);
    
    // Verificar usuarios con votos
    const usuariosConVotos = (appData.users || []).filter(user => {
        const votes = user.votes || {};
        return Object.keys(votes).length > 0;
    });
    
    console.log("- Usuarios que han votado:", usuariosConVotos.length);
    
    if (usuariosConVotos.length > 0) {
        console.log("=== 👥 USUARIOS CON VOTOS ===");
        usuariosConVotos.forEach(user => {
            console.log(`${user.name}: ${Object.keys(user.votes || {}).length} votos`);
        });
    }
    
    // Verificar total de votos en categorías
    let totalVotosCategorias = 0;
    (appData.categories || []).forEach((cat, index) => {
        const votesInCategory = (cat.nominees || []).reduce((sum, n) => sum + (n.votes || 0), 0);
        totalVotosCategorias += votesInCategory;
        console.log(`Categoría ${index+1} (${cat.name}): ${votesInCategory} votos`);
    });
    
    console.log("- Votos totales en categorías:", totalVotosCategorias);
    
    // Verificar Firebase
    console.log("=== 🔥 ESTADO FIREBASE ===");
    console.log("Firebase disponible:", typeof saveDataToFirebase === 'function' ? "✅" : "❌");
    
    alert(`✅ Verificación completada:\n\nUsuarios: ${appData.users?.length || 0}\nHan votado: ${usuariosConVotos.length}\nVotos totales: ${totalVotosCategorias}`);
}

function resetVotes() {
    if (!appData) return;
    
    if (confirm('⚠️ ¿REINICIAR TODOS LOS VOTOS?\n\nEsto eliminará:\n• Todos los votos de nominados\n• Historial de votantes\n\n¡Esta acción NO se puede deshacer!')) {
        const categories = appData.categories || [];
        
        categories.forEach(category => {
            const nominees = category.nominees || [];
            nominees.forEach(nominee => {
                if (nominee) {
                    nominee.votes = 0;
                    nominee.voters = [];
                    nominee.frases = {}; // También reiniciar frases
                }
            });
        });
        
        const users = appData.users || [];
        users.forEach(user => {
            if (user) {
                user.votes = {};
            }
        });
        
        saveData();
        saveUsers();
        renderCategories();
        updateVotersList();
        updateStats();
        
        alert('✅ ¡Todos los votos han sido reiniciados!');
    }
}

// ===== ESTADÍSTICAS =====
function updateStats() {
    if (!appData) return;
    
    const users = appData.users || [];
    const categories = appData.categories || [];
    const photoUrls = appData.photoUrls || {};
    
    const totalVoters = users.filter(u => {
        if (!u) return false;
        const votes = u.votes || {};
        return Object.keys(votes).length > 0;
    }).length;
    
    const totalCategories = categories.length;
    
    const totalVotes = categories.reduce((sum, cat) => {
        const nominees = cat.nominees || [];
        return sum + nominees.reduce((catSum, nom) => catSum + (nom.votes || 0), 0);
    }, 0);
    
    const totalFotos = Object.keys(photoUrls).filter(key => {
        const url = photoUrls[key];
        return url && !url.includes('data:image/svg+xml'); // Excluir placeholders
    }).length;
    
    const votersElement = document.getElementById('totalVoters');
    const categoriesElement = document.getElementById('totalCategories');
    const votesElement = document.getElementById('totalVotes');
    
    if (votersElement) votersElement.textContent = totalVoters;
    if (categoriesElement) categoriesElement.textContent = totalCategories;
    if (votesElement) votesElement.textContent = totalVotes;
    
    // También podríamos mostrar fotos si añadimos otro elemento
    const fotosElement = document.getElementById('totalFotos');
    if (fotosElement) fotosElement.textContent = totalFotos;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("admin.js cargado");
    
    // Enter para enviar contraseña
    const adminPasswordInput = document.getElementById('adminPassword');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAdminPassword();
            }
        });
    }
    
    // Enter para añadir categoría
    const newCategoryInput = document.getElementById('newCategory');
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCategory();
            }
        });
    }
    
    // Enter para actualizar foto
    const photoUrlInput = document.getElementById('photoUrl');
    if (photoUrlInput) {
        photoUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                updateSelectedPhoto();
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const passwordModal = document.getElementById('passwordModal');
        if (event.target === passwordModal) {
            closePasswordModal();
        }
    });
    
    // Añadir botones extra para gestión de fotos si no existen
    setTimeout(() => {
        const photoManagement = document.querySelector('.photo-management .photo-input-group');
        if (photoManagement && !document.getElementById('btnGitHub')) {
            const botonesExtra = document.createElement('div');
            botonesExtra.style.display = 'flex';
            botonesExtra.style.gap = '10px';
            botonesExtra.style.marginTop = '10px';
            botonesExtra.style.flexWrap = 'wrap';
            
            botonesExtra.innerHTML = `
                <button onclick="usarFotoGitHub()" class="btn-add" style="background: #24292e;">
                    <i class="fab fa-github"></i> Usar GitHub
                </button>
                <button onclick="subirFotoArchivo()" class="btn-add" style="background: #4CAF50;">
                    <i class="fas fa-upload"></i> Subir Archivo
                </button>
                <button onclick="cargarListaFotos()" class="btn-add" style="background: #2196F3;">
                    <i class="fas fa-sync"></i> Actualizar Lista
                </button>
            `;
            
            photoManagement.parentNode.insertBefore(botonesExtra, photoManagement.nextSibling);
        }
    }, 1000);
});