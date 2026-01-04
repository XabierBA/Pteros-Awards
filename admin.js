// ===== SISTEMA DE CONTRASEÑA PARA ADMIN =====
let adminPassword = "pteros2024"; // Contraseña por defecto
let adminAttempts = 0;
const MAX_ATTEMPTS = 5;
let adminLocked = false;
let adminLockedUntil = 0;

// Configuración de contraseña (puede ser cambiada por el admin)
function setAdminPassword(newPassword) {
    if (newPassword && newPassword.length >= 4) {
        adminPassword = newPassword;
        localStorage.setItem('adminPassword', adminPassword);
        return true;
    }
    return false;
}

// Cargar contraseña guardada
function loadAdminPassword() {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        adminPassword = savedPassword;
    }
    
    // Cargar estado de bloqueo
    const lockState = localStorage.getItem('adminLockState');
    if (lockState) {
        try {
            const { locked, until } = JSON.parse(lockState);
            adminLocked = locked;
            adminLockedUntil = until;
            
            // Verificar si ya pasó el tiempo de bloqueo
            if (adminLocked && Date.now() < adminLockedUntil) {
                return false;
            } else if (adminLocked) {
                // Desbloquear si ya pasó el tiempo
                adminLocked = false;
                adminAttempts = 0;
                saveLockState();
            }
        } catch (e) {
            console.error("Error loading lock state:", e);
        }
    }
    
    return true;
}

// Guardar estado de bloqueo
function saveLockState() {
    const lockState = {
        locked: adminLocked,
        until: adminLockedUntil
    };
    localStorage.setItem('adminLockState', JSON.stringify(lockState));
}

// ===== MODAL DE CONTRASEÑA =====
function openPasswordModal() {
    if (!window.appData || !window.appData.currentUser) {
        alert('Debes estar logueado para acceder al panel admin');
        return;
    }
    
    // Cargar configuración de contraseña primero
    if (!loadAdminPassword()) {
        showLockedMessage();
        return;
    }
    
    // Verificar si está bloqueado
    if (adminLocked && Date.now() < adminLockedUntil) {
        showLockedMessage();
        return;
    }
    
    // Mostrar modal de contraseña
    document.getElementById('passwordModal').style.display = 'block';
    
    // Resetear mensaje de error
    document.getElementById('passwordError').textContent = '';
    document.getElementById('adminPassword').value = '';
    
    // Mostrar contador de intentos
    updateAttemptsDisplay();
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('adminPassword').type = 'password';
    const eyeIcon = document.getElementById('passwordEye');
    if (eyeIcon) {
        eyeIcon.className = 'fas fa-eye';
    }
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
    const passwordInput = document.getElementById('adminPassword');
    const errorElement = document.getElementById('passwordError');
    
    if (!passwordInput || !errorElement) return;
    
    const inputPassword = passwordInput.value;
    
    // Verificar si está bloqueado
    if (adminLocked && Date.now() < adminLockedUntil) {
        showLockedMessage();
        return;
    }
    
    if (!inputPassword) {
        errorElement.textContent = '⚠️ Por favor, introduce la contraseña';
        shakePasswordInput();
        return;
    }
    
    // Cargar contraseña actual
    loadAdminPassword();
    
    if (inputPassword === adminPassword) {
        // Contraseña correcta
        adminAttempts = 0;
        saveLockState();
        
        // Mostrar mensaje de éxito
        errorElement.textContent = '';
        errorElement.className = 'access-granted';
        errorElement.innerHTML = '✅ Acceso concedido. Abriendo panel...';
        
        // Cerrar modal y abrir panel después de un breve delay
        setTimeout(() => {
            closePasswordModal();
            document.getElementById('adminPanel').style.display = 'block';
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            }
            errorElement.className = 'error-message';
        }, 1000);
        
    } else {
        // Contraseña incorrecta
        adminAttempts++;
        updateAttemptsDisplay();
        
        if (adminAttempts >= MAX_ATTEMPTS) {
            // Bloquear acceso por 5 minutos
            adminLocked = true;
            adminLockedUntil = Date.now() + (5 * 60 * 1000);
            saveLockState();
            showLockedMessage();
        } else {
            errorElement.textContent = `❌ Contraseña incorrecta. Intentos restantes: ${MAX_ATTEMPTS - adminAttempts}`;
            shakePasswordInput();
        }
    }
}

function shakePasswordInput() {
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) return;
    
    passwordInput.classList.remove('shake');
    void passwordInput.offsetWidth;
    passwordInput.classList.add('shake');
    
    setTimeout(() => {
        passwordInput.classList.remove('shake');
    }, 500);
}

function showLockedMessage() {
    const errorElement = document.getElementById('passwordError');
    if (!errorElement) return;
    
    const remainingTime = Math.ceil((adminLockedUntil - Date.now()) / 1000 / 60);
    
    errorElement.textContent = `🔒 Acceso bloqueado. Intenta de nuevo en ${remainingTime} minutos`;
    errorElement.style.color = '#ff4757';
    errorElement.style.fontWeight = 'bold';
    
    setTimeout(() => {
        closePasswordModal();
    }, 3000);
}

function updateAttemptsDisplay() {
    const attemptsElement = document.createElement('div');
    attemptsElement.className = 'attempts-counter';
    attemptsElement.textContent = `Intentos: ${adminAttempts}/${MAX_ATTEMPTS}`;
    
    const hintElement = document.querySelector('.password-hint');
    if (!hintElement) return;
    
    let existingCounter = hintElement.querySelector('.attempts-counter');
    if (existingCounter) {
        existingCounter.textContent = `Intentos: ${adminAttempts}/${MAX_ATTEMPTS}`;
    } else {
        hintElement.appendChild(attemptsElement);
    }
}

// ===== FUNCIONES DEL PANEL ADMIN =====
function setPhase(phase) {
    if (!window.appData) return;
    
    window.appData.phase = phase;
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
    if (typeof window.updatePhaseBanner === 'function') {
        window.updatePhaseBanner();
    }
    if (typeof window.renderCategories === 'function') {
        window.renderCategories();
    }
    
    if (phase === 'results') {
        showResults();
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
    if (!input || !window.appData) return;
    
    const name = input.value.trim();
    
    if (!name) {
        alert('Por favor, introduce un nombre para la categoría');
        return;
    }
    
    const newId = window.appData.categories.length > 0 
        ? Math.max(...window.appData.categories.map(c => c.id)) + 1 
        : 1;
    
    window.appData.categories.push({
        id: newId,
        name: name,
        nominees: []
    });
    
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
    if (typeof window.renderCategories === 'function') {
        window.renderCategories();
    }
    
    input.value = '';
    alert('✅ ¡Categoría añadida!');
}

function showResults() {
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    if (!modal || !modalCategory || !nomineesList || !window.appData) return;
    
    modalCategory.textContent = '🏆 RESULTADOS FINALES 🏆';
    nomineesList.innerHTML = '';
    
    window.appData.categories.forEach(category => {
        const sortedNominees = [...category.nominees].sort((a, b) => b.votes - a.votes);
        const winner = sortedNominees[0];
        const second = sortedNominees[1];
        const third = sortedNominees[2];
        
        const resultItem = document.createElement('div');
        resultItem.className = 'nominee-item';
        resultItem.style.background = 'linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(212, 175, 55, 0.1))';
        resultItem.style.border = '2px solid var(--gold)';
        
        let podiumHTML = '';
        if (winner) {
            podiumHTML = `
                <div style="display: flex; justify-content: center; gap: 20px; margin: 15px 0;">
                    ${second ? `
                        <div style="text-align: center;">
                            <div style="font-size: 2rem;">🥈</div>
                            <div>${second.name}</div>
                            <div style="color: var(--silver);">${second.votes} votos</div>
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                        <div style="font-size: 3rem;">🥇</div>
                        <div style="font-weight: bold; font-size: 1.3rem;">${winner.name}</div>
                        <div style="color: var(--gold);">${winner.votes} votos</div>
                    </div>
                    
                    ${third ? `
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem;">🥉</div>
                            <div>${third.name}</div>
                            <div style="color: var(--bronze);">${third.votes} votos</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        resultItem.innerHTML = `
            <h3 style="color: var(--gold); text-align: center; margin-bottom: 15px;">${category.name}</h3>
            ${winner ? podiumHTML : '<p style="text-align: center; color: var(--silver);">Sin votos</p>'}
            <div style="margin-top: 20px; color: var(--silver); font-size: 0.9rem;">
                <p>Total votantes: ${category.nominees.reduce((sum, n) => sum + n.voters.length, 0)}</p>
                <p>Total votos: ${category.nominees.reduce((sum, n) => sum + n.votes, 0)}</p>
            </div>
        `;
        
        nomineesList.appendChild(resultItem);
    });
    
    modal.style.display = 'block';
}

function exportData() {
    if (!window.appData) return;
    
    const dataToExport = {
        categories: window.appData.categories,
        users: window.appData.users || [],
        phase: window.appData.phase,
        exportDate: new Date().toISOString()
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
                
                if (confirm('⚠️ Esto sobrescribirá todos los datos actuales. ¿Continuar?')) {
                    if (window.appData) {
                        window.appData.categories = imported.categories || window.appData.categories;
                        window.appData.users = imported.users || window.appData.users;
                        window.appData.phase = imported.phase || 'nominations';
                        
                        if (typeof window.saveData === 'function') {
                            window.saveData();
                        }
                        if (typeof window.saveUsers === 'function') {
                            window.saveUsers();
                        }
                        if (typeof window.loadData === 'function') {
                            window.loadData();
                        }
                        if (typeof window.renderCategories === 'function') {
                            window.renderCategories();
                        }
                        
                        alert('✅ Datos importados correctamente');
                    }
                }
            } catch (error) {
                console.error('Error importing:', error);
                alert('❌ Error al importar datos. El archivo puede estar corrupto.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ===== FUNCIÓN CORREGIDA: REINICIAR VOTOS =====
function resetVotes() {
    if (!window.appData || !window.appData.categories) {
        alert('Error: No se pueden cargar los datos');
        return;
    }
    
    if (confirm('⚠️ ¿ESTÁS SEGURO DE REINICIAR TODOS LOS VOTOS?\n\nEsto eliminará:\n• Todos los votos de nominados\n• Historial de votantes\n\nLas fotos de nominados NO se eliminarán.\n\nEsta acción NO se puede deshacer.')) {
        
        // Reiniciar votos en todas las categorías
        window.appData.categories.forEach(category => {
            category.nominees.forEach(nominee => {
                nominee.votes = 0;
                nominee.voters = [];
                // NOTA: Mantenemos la foto (nominee.photo) intacta
            });
        });
        
        // Reiniciar votos de todos los usuarios
        if (window.appData.users) {
            window.appData.users.forEach(user => {
                user.votes = {}; // Objeto vacío
            });
        }
        
        // Guardar los cambios
        if (typeof window.saveData === 'function') {
            window.saveData();
        }
        
        if (typeof window.saveUsers === 'function') {
            window.saveUsers();
        }
        
        // Actualizar la interfaz
        if (typeof window.renderCategories === 'function') {
            window.renderCategories();
        }
        
        if (typeof window.updateVotersList === 'function') {
            window.updateVotersList();
        }
        
        if (typeof window.updateStats === 'function') {
            window.updateStats();
        }
        
        // También actualizar las estadísticas en el panel admin
        updateAdminStats();
        
        alert('✅ ¡Todos los votos han sido reiniciados!');
    }
}

// ===== FUNCIÓN AUXILIAR PARA ACTUALIZAR ESTADÍSTICAS EN PANEL ADMIN =====
function updateAdminStats() {
    if (!window.appData) return;
    
    const totalVoters = window.appData.users ? 
        window.appData.users.filter(u => Object.keys(u.votes).length > 0).length : 0;
    const totalCategories = window.appData.categories ? window.appData.categories.length : 0;
    const totalVotes = window.appData.categories ? 
        window.appData.categories.reduce((sum, cat) => 
            sum + cat.nominees.reduce((catSum, nom) => catSum + nom.votes, 0), 0) : 0;
    
    const votersElement = document.getElementById('totalVoters');
    const categoriesElement = document.getElementById('totalCategories');
    const votesElement = document.getElementById('totalVotes');
    
    if (votersElement) votersElement.textContent = totalVoters;
    if (categoriesElement) categoriesElement.textContent = totalCategories;
    if (votesElement) votesElement.textContent = totalVotes;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Cargar configuración de contraseña
    loadAdminPassword();
    
    // Sobreescribir la función openAdminPanel del script principal
    window.openAdminPanelFromAdmin = function() {
        openPasswordModal();
    };
    
    // Enter para enviar contraseña
    const adminPasswordInput = document.getElementById('adminPassword');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAdminPassword();
            }
        });
    }
});