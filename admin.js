// ===== CONTRASEÑA DE ADMIN =====
const ADMIN_PASSWORD = "qwerty123456";

// ===== FUNCIÓN PRINCIPAL PARA ABRIR PANEL =====
function openAdminPanel() {
    console.log("openAdminPanel llamada"); // Para debug
    
    if (!appData || !appData.currentUser) {
        alert('Debes estar logueado para acceder al panel admin');
        return;
    }
    
    // Mostrar modal de contraseña
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.style.display = 'block';
        document.getElementById('adminPassword').value = '';
        document.getElementById('passwordError').textContent = '';
        document.getElementById('adminPassword').focus();
    } else {
        console.error("No se encontró el modal de contraseña");
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
    const passwordInput = document.getElementById('adminPassword');
    const errorElement = document.getElementById('passwordError');
    
    if (!passwordInput || !errorElement) return;
    
    const inputPassword = passwordInput.value.trim();
    
    if (!inputPassword) {
        errorElement.textContent = 'Por favor, introduce la contraseña';
        return;
    }
    
    if (inputPassword === ADMIN_PASSWORD) {
        // Contraseña correcta
        errorElement.textContent = '✅ Acceso concedido...';
        errorElement.style.color = '#4CAF50';
        
        setTimeout(() => {
            closePasswordModal();
            // Abrir panel admin
            document.getElementById('adminPanel').style.display = 'block';
            updateStats();
        }, 500);
        
    } else {
        // Contraseña incorrecta
        errorElement.textContent = '❌ Contraseña incorrecta. Prueba con: qwerty123456';
        errorElement.style.color = '#ff4757';
        
        // Animación de shake
        passwordInput.classList.add('shake');
        setTimeout(() => {
            passwordInput.classList.remove('shake');
        }, 500);
    }
}

// ===== FUNCIONES DEL PANEL ADMIN =====
function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

function setPhase(phase) {
    if (!appData) return;
    
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
    if (!input || !appData) return;
    
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
    
    if (!modal || !modalCategory || !nomineesList || !appData) return;
    
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
    if (!appData) return;
    
    const dataToExport = {
        categories: appData.categories,
        users: appData.users || [],
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
    if (!appData) return;
    
    if (confirm('⚠️ ¿ESTÁS SEGURO DE REINICIAR TODOS LOS VOTOS?\n\nEsto eliminará:\n• Todos los votos de nominados\n• Historial de votantes\n• Fotos de nominados\n\nEsta acción NO se puede deshacer.')) {
        appData.categories.forEach(category => {
            category.nominees.forEach(nominee => {
                nominee.votes = 0;
                nominee.voters = [];
            });
        });
        
        if (appData.users) {
            appData.users.forEach(user => {
                user.votes = {};
            });
        }
        
        saveData();
        saveUsers();
        renderCategories();
        updateVotersList();
        updateStats();
        
        alert('✅ ¡Todos los votos han sido reiniciados!');
    }
}

function updateStats() {
    if (!appData) return;
    
    const totalVoters = appData.users ? appData.users.filter(u => u.votes && Object.keys(u.votes).length > 0).length : 0;
    const totalCategories = appData.categories ? appData.categories.length : 0;
    const totalVotes = appData.categories ? appData.categories.reduce((sum, cat) => 
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
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const passwordModal = document.getElementById('passwordModal');
        if (event.target === passwordModal) {
            closePasswordModal();
        }
    });
});