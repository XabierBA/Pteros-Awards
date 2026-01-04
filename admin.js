// ===== SISTEMA DE CONTRASEÑA SIMPLE =====
const ADMIN_PASSWORD = "qwerty123456";
let passwordAttempts = 0;
const MAX_ATTEMPTS = 3;

// ===== PANEL ADMIN CON CONTRASEÑA =====
function openAdminPanel() {
    if (!appData.currentUser) {
        alert('Debes estar logueado para acceder al panel admin');
        return;
    }
    
    // Mostrar modal de contraseña
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('adminPassword').value = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('adminPassword').focus();
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
    
    if (!inputPassword) {
        errorElement.textContent = 'Por favor, introduce la contraseña';
        shakePasswordInput();
        return;
    }
    
    if (inputPassword === ADMIN_PASSWORD) {
        // Contraseña correcta
        passwordAttempts = 0; // Resetear intentos
        errorElement.textContent = '';
        errorElement.style.color = '#4CAF50';
        errorElement.textContent = '✅ Contraseña correcta';
        
        // Cerrar modal y abrir panel después de un breve delay
        setTimeout(() => {
            closePasswordModal();
            document.getElementById('adminPanel').style.display = 'block';
            updateStats();
        }, 500);
        
    } else {
        // Contraseña incorrecta
        passwordAttempts++;
        
        if (passwordAttempts >= MAX_ATTEMPTS) {
            errorElement.textContent = '❌ Demasiados intentos fallidos. Intenta más tarde.';
            setTimeout(() => {
                closePasswordModal();
            }, 2000);
        } else {
            const remaining = MAX_ATTEMPTS - passwordAttempts;
            errorElement.textContent = `❌ Contraseña incorrecta. Intentos restantes: ${remaining}`;
            shakePasswordInput();
        }
    }
}

function shakePasswordInput() {
    const passwordInput = document.getElementById('adminPassword');
    passwordInput.classList.remove('shake');
    void passwordInput.offsetWidth; // Trigger reflow
    passwordInput.classList.add('shake');
    
    setTimeout(() => {
        passwordInput.classList.remove('shake');
    }, 500);
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

// ===== FUNCIONES DEL PANEL ADMIN =====
function setPhase(phase) {
    appData.phase = phase;
    saveData();
    updatePhaseBanner();
    renderCategories();
    
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
    const name = input.value.trim();
    
    if (!name) {
        alert('Por favor, introduce un nombre para la categoría');
        return;
    }
    
    const newId = appData.categories.length > 0 
        ? Math.max(...appData.categories.map(c => c.id)) + 1 
        : 1;
    
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

function showResults() {
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    modalCategory.textContent = '🏆 RESULTADOS FINALES 🏆';
    nomineesList.innerHTML = '';
    
    appData.categories.forEach(category => {
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
    const dataToExport = {
        categories: appData.categories,
        users: appData.users,
        phase: appData.phase,
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
                    appData.categories = imported.categories || appData.categories;
                    appData.users = imported.users || appData.users;
                    appData.phase = imported.phase || 'nominations';
                    
                    saveData();
                    saveUsers();
                    loadData();
                    renderCategories();
                    
                    alert('✅ Datos importados correctamente');
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

function resetVotes() {
    if (confirm('⚠️ ¿ESTÁS SEGURO DE REINICIAR TODOS LOS VOTOS?\n\nEsto eliminará:\n• Todos los votos de nominados\n• Historial de votantes\n• Fotos de nominados\n\nEsta acción NO se puede deshacer.')) {
        appData.categories.forEach(category => {
            category.nominees.forEach(nominee => {
                nominee.votes = 0;
                nominee.voters = [];
            });
        });
        
        appData.users.forEach(user => {
            user.votes = {};
        });
        
        saveData();
        saveUsers();
        renderCategories();
        updateVotersList();
        updateStats();
        
        alert('✅ ¡Todos los votos han sido reiniciados!');
    }
}

// ===== FUNCIONES DE APOYO =====
function updateStats() {
    const totalVoters = appData.users.filter(u => Object.keys(u.votes).length > 0).length;
    const totalCategories = appData.categories.length;
    const totalVotes = appData.categories.reduce((sum, cat) => 
        sum + cat.nominees.reduce((catSum, nom) => catSum + nom.votes, 0), 0);
    
    document.getElementById('totalVoters').textContent = totalVoters;
    document.getElementById('totalCategories').textContent = totalCategories;
    document.getElementById('totalVotes').textContent = totalVotes;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
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
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const passwordModal = document.getElementById('passwordModal');
        if (event.target === passwordModal) {
            closePasswordModal();
        }
    });
});