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
        const { locked, until } = JSON.parse(lockState);
        adminLocked = locked;
        adminLockedUntil = until;
        
        // Verificar si ya pasó el tiempo de bloqueo
        if (adminLocked && Date.now() < adminLockedUntil) {
            showLockedMessage();
            return false;
        } else if (adminLocked) {
            // Desbloquear si ya pasó el tiempo
            adminLocked = false;
            adminAttempts = 0;
            saveLockState();
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

// ===== MODIFICAR LA FUNCIÓN openAdminPanel =====
function openAdminPanel() {
    if (!appData.currentUser) {
        alert('Debes estar logueado para acceder al panel admin');
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
    
    // Mostrar contador de intentos
    updateAttemptsDisplay();
}

// ===== FUNCIONES DEL MODAL DE CONTRASEÑA =====
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('passwordError').textContent = '';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const eyeIcon = document.getElementById('passwordEye');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

function checkAdminPassword() {
    const inputPassword = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('passwordError');
    
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
        adminAttempts = 0; // Resetear intentos
        saveLockState();
        
        // Mostrar mensaje de éxito
        errorElement.textContent = '';
        errorElement.className = 'access-granted';
        errorElement.innerHTML = '✅ Acceso concedido. Abriendo panel...';
        
        // Cerrar modal y abrir panel después de un breve delay
        setTimeout(() => {
            closePasswordModal();
            document.getElementById('adminPanel').style.display = 'block';
            updateStats();
            errorElement.className = 'error-message';
        }, 1000);
        
    } else {
        // Contraseña incorrecta
        adminAttempts++;
        updateAttemptsDisplay();
        
        if (adminAttempts >= MAX_ATTEMPTS) {
            // Bloquear acceso por 5 minutos
            adminLocked = true;
            adminLockedUntil = Date.now() + (5 * 60 * 1000); // 5 minutos
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
    passwordInput.classList.remove('shake');
    void passwordInput.offsetWidth; // Trigger reflow
    passwordInput.classList.add('shake');
    
    // Remover la clase después de la animación
    setTimeout(() => {
        passwordInput.classList.remove('shake');
    }, 500);
}

function showLockedMessage() {
    const errorElement = document.getElementById('passwordError');
    const remainingTime = Math.ceil((adminLockedUntil - Date.now()) / 1000 / 60);
    
    errorElement.textContent = `🔒 Acceso bloqueado. Intenta de nuevo en ${remainingTime} minutos`;
    errorElement.style.color = '#ff4757';
    errorElement.style.fontWeight = 'bold';
    
    // Cerrar modal automáticamente después de 3 segundos
    setTimeout(() => {
        closePasswordModal();
    }, 3000);
}

function updateAttemptsDisplay() {
    const attemptsElement = document.createElement('div');
    attemptsElement.className = 'attempts-counter';
    attemptsElement.textContent = `Intentos: ${adminAttempts}/${MAX_ATTEMPTS}`;
    
    // Actualizar o añadir el contador
    let existingCounter = document.querySelector('.attempts-counter');
    if (existingCounter) {
        existingCounter.textContent = `Intentos: ${adminAttempts}/${MAX_ATTEMPTS}`;
    } else {
        document.querySelector('.password-hint').appendChild(attemptsElement);
    }
}

// ===== FUNCIONES DE AYUDA =====
function useDefaultPassword() {
    document.getElementById('adminPassword').value = 'pteros2024';
    document.getElementById('passwordError').textContent = '🔑 Contraseña por defecto insertada';
    document.getElementById('passwordError').style.color = '#4CAF50';
}

function showPasswordHint() {
    const hint = "Pista: Nombre del grupo + año actual (en minúsculas)";
    document.getElementById('passwordError').textContent = `💡 ${hint}`;
    document.getElementById('passwordError').style.color = '#FFD700';
}

// ===== FUNCIONALIDAD PARA CAMBIAR CONTRASEÑA DESDE EL PANEL =====
function addChangePasswordFeature() {
    // Añadir sección para cambiar contraseña en el panel admin
    const adminSection = document.createElement('div');
    adminSection.className = 'admin-section';
    adminSection.innerHTML = `
        <h3><i class="fas fa-key"></i> Seguridad</h3>
        <div class="change-password-form">
            <input type="password" id="newPassword" placeholder="Nueva contraseña..." class="password-input">
            <input type="password" id="confirmPassword" placeholder="Confirmar contraseña..." class="password-input">
            <button onclick="changeAdminPassword()" class="btn-add">
                <i class="fas fa-save"></i> Cambiar Contraseña
            </button>
            <p class="password-requirements">Mínimo 4 caracteres</p>
        </div>
    `;
    
    // Insertar después de la sección de Resultados
    const resultsSection = document.querySelector('.admin-section:nth-child(3)');
    if (resultsSection) {
        resultsSection.after(adminSection);
    }
}

function changeAdminPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        alert('Por favor, completa ambos campos');
        return;
    }
    
    if (newPassword.length < 4) {
        alert('La contraseña debe tener al menos 4 caracteres');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    if (setAdminPassword(newPassword)) {
        alert('✅ Contraseña cambiada correctamente');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } else {
        alert('❌ Error al cambiar la contraseña');
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Cargar configuración de contraseña
    loadAdminPassword();
    
    // Añadir funcionalidad de cambiar contraseña
    setTimeout(addChangePasswordFeature, 1000);
    
    // Enter para enviar contraseña
    document.getElementById('adminPassword')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAdminPassword();
        }
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('passwordModal');
        if (event.target === modal) {
            closePasswordModal();
        }
    });
});