// Abrir/cerrar panel admin
function openAdminPanel() {
    document.getElementById('adminPanel').style.display = 'block';
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

// Cambiar fase
function setPhase(phase) {
    appData.phase = phase;
    saveData();
    updatePhaseBanner();
    renderCategories();
    
    if (phase === 'results') {
        showResults();
    }
    
    alert(`Fase cambiada a: ${getPhaseName(phase)}`);
}

function getPhaseName(phase) {
    const phases = {
        'nominations': 'Nominaciones',
        'voting': 'Votación Final',
        'results': 'Resultados'
    };
    return phases[phase] || phase;
}

// Añadir nueva categoría
function addCategory() {
    const input = document.getElementById('newCategory');
    const name = input.value.trim();
    
    if (name) {
        const newId = Math.max(...appData.categories.map(c => c.id)) + 1;
        appData.categories.push({
            id: newId,
            name: name,
            nominees: []
        });
        
        saveData();
        renderCategories();
        input.value = '';
        alert('¡Categoría añadida!');
    }
}

// Mostrar resultados
function showResults() {
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    modalCategory.textContent = '🏆 RESULTADOS FINALES 🏆';
    nomineesList.innerHTML = '';
    
    appData.categories.forEach(category => {
        const winner = [...category.nominees]
            .sort((a, b) => b.votes - a.votes)[0];
        
        const resultItem = document.createElement('div');
        resultItem.className = 'nominee-item';
        resultItem.style.background = 'linear-gradient(45deg, #4CAF50, #8BC34A)';
        resultItem.innerHTML = `
            <h3>${category.name}</h3>
            <h2>🏆 ${winner ? winner.name : 'Sin votos'}</h2>
            <p>${winner ? `Con ${winner.votes} votos` : ''}</p>
            <div class="all-nominees">
                ${category.nominees.map(n => `
                    <div>${n.name}: ${n.votes} votos</div>
                `).join('')}
            </div>
        `;
        nomineesList.appendChild(resultItem);
    });
    
    modal.style.display = 'block';
}

// Reiniciar votos
function resetVotes() {
    if (confirm('⚠️ ¿Estás seguro de reiniciar todos los votos? Esto no se puede deshacer.')) {
        appData.categories.forEach(category => {
            category.nominees.forEach(nominee => {
                nominee.votes = 0;
            });
        });
        appData.userVotes = {};
        saveData();
        renderCategories();
        alert('✅ Votos reiniciados correctamente');
    }
}

// Exportar/importar datos
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'premios_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => { 
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const imported = JSON.parse(event.target.result);
                appData = imported;
                saveData();
                loadData();
                alert('✅ Datos importados correctamente');
            } catch (error) {
                alert('❌ Error al importar datos');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}