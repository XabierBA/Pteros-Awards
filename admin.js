// ===== PANEL ADMIN =====
let currentPhotoFile = null;

function openAdminPanel() {
    if (!appData.currentUser) {
        alert('Debes estar logueado para acceder al panel admin');
        return;
    }
    
    updateStats();
    document.getElementById('adminPanel').style.display = 'block';
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

// ===== CAMBIAR FASE =====
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

// ===== GESTIÓN DE CATEGORÍAS =====
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

// ===== MOSTRAR RESULTADOS =====
function showResults() {
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    modalCategory.textContent = '🏆 RESULTADOS FINALES 🏆';
    nomineesList.innerHTML = '';
    
    appData.categories.forEach(category => {
        // Ordenar por votos
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

// ===== EXPORTAR/IMPORTAR DATOS =====
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

// ===== REINICIAR VOTOS =====
function resetVotes() {
    if (confirm('⚠️ ¿ESTÁS SEGURO DE REINICIAR TODOS LOS VOTOS?\n\nEsto eliminará:\n• Todos los votos de nominados\n• Historial de votantes\n• Fotos de nominados\n\nEsta acción NO se puede deshacer.')) {
        // Reiniciar votos de nominados
        appData.categories.forEach(category => {
            category.nominees.forEach(nominee => {
                nominee.votes = 0;
                nominee.voters = [];
                // Opcional: mantener las fotos
                // nominee.photo = null;
            });
        });
        
        // Reiniciar votos de usuarios
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

// ===== GESTIÓN DE FOTOS =====
function adminPreviewPhoto(input) {
    if (input.files && input.files[0]) {
        currentPhotoFile = input.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById('adminPhotoPreview');
            preview.innerHTML = `<img src="${e.target.result}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);">`;
        };
        
        reader.readAsDataURL(currentPhotoFile);
    }
}

// ===== ESTADÍSTICAS DETALLADAS =====
function showDetailedStats() {
    let statsHTML = '<h3>📊 Estadísticas Detalladas</h3>';
    
    // Estadísticas por categoría
    appData.categories.forEach(category => {
        const totalVotes = category.nominees.reduce((sum, n) => sum + n.votes, 0);
        const totalVoters = category.nominees.reduce((sum, n) => sum + n.voters.length, 0);
        const topNominee = [...category.nominees].sort((a, b) => b.votes - a.votes)[0];
        
        statsHTML += `
            <div style="margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                <strong>${category.name}</strong><br>
                Total votos: ${totalVotes}<br>
                Total votantes únicos: ${totalVoters}<br>
                ${topNominee ? `Ganador actual: ${topNominee.name} (${topNominee.votes} votos)` : ''}
            </div>
        `;
    });
    
    // Usuarios más activos
    const activeUsers = appData.users
        .filter(u => Object.keys(u.votes).length > 0)
        .sort((a, b) => Object.keys(b.votes).length - Object.keys(a.votes).length)
        .slice(0, 5);
    
    statsHTML += '<h3>👥 Usuarios más activos</h3>';
    activeUsers.forEach((user, index) => {
        statsHTML += `
            <div style="margin: 10px 0; padding: 10px; background: rgba(255,215,0,0.1); border-radius: 10px;">
                ${index + 1}. ${user.name} - ${Object.keys(user.votes).length} categorías votadas
            </div>
        `;
    });
    
    alert(statsHTML);
}