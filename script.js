// ===== SISTEMA DE USUARIOS Y VOTOS =====
let appData = {
    currentUser: null,
    phase: 'nominations',
    categories: [],
    users: [],
    photoUrls: {} // Nuevo: almacenará las URLs de fotos
};

// ===== CARGAR DATOS Y FOTOS =====
async function loadAppData() {
    try {
        // Cargar datos de localStorage primero
        const savedData = localStorage.getItem('premiosData');
        const savedUsers = localStorage.getItem('premiosUsers');
        
        if (savedData) {
            const parsed = JSON.parse(savedData);
            appData.categories = parsed.categories || [];
            appData.phase = parsed.phase || 'nominations';
        }
        
        appData.users = savedUsers ? JSON.parse(savedUsers) : [];
        
        // Cargar fotos desde data.json
        const response = await fetch('data.json');
        if (response.ok) {
            const data = await response.json();
            appData.photoUrls = data.photoUrls || {};
            
            // Si no hay categorías cargadas, crear desde JSON
            if (appData.categories.length === 0 && data.categories) {
                appData.categories = data.categories.map(category => ({
                    ...category,
                    nominees: data.people ? data.people.map(person => ({
                        name: person,
                        votes: 0,
                        voters: [],
                        photo: appData.photoUrls[person] || null
                    })) : []
                }));
            } else {
                // Actualizar fotos en categorías existentes
                appData.categories.forEach(category => {
                    category.nominees.forEach(nominee => {
                        nominee.photo = appData.photoUrls[nominee.name] || nominee.photo;
                    });
                });
            }
        }
        
        // Si aún no hay categorías, usar las predeterminadas
        if (appData.categories.length === 0) {
            // Tu estructura original de categorías aquí
            appData.categories = [/* tu estructura original */];
        }
        
        updatePhaseBanner();
        updateVotersList();
        updateStats();
        
    } catch (error) {
        console.error("Error cargando datos:", error);
        // Cargar datos predeterminados si hay error
        loadDefaultData();
    }
}

function loadDefaultData() {
    // Tu estructura original de appData.categories aquí
    // (la que me mostraste con todas las categorías)
}

// ===== GUARDAR DATOS =====
function saveData() {
    const dataToSave = {
        categories: appData.categories,
        phase: appData.phase
    };
    localStorage.setItem('premiosData', JSON.stringify(dataToSave));
    updateStats();
}

// ===== OBTENER FOTO DE PERSONA =====
function getPersonPhoto(personName) {
    return appData.photoUrls[personName] || null;
}

// ===== ACTUALIZAR FOTO DE PERSONA =====
function updatePersonPhoto(personName, photoUrl) {
    if (personName && photoUrl) {
        appData.photoUrls[personName] = photoUrl;
        
        // Actualizar en todas las categorías
        appData.categories.forEach(category => {
            const nominee = category.nominees.find(n => n.name === personName);
            if (nominee) {
                nominee.photo = photoUrl;
            }
        });
        
        // Guardar en data.json (opcional)
        savePhotoUrls();
        saveData();
        renderCategories();
    }
}

// ===== GUARDAR FOTOS EN JSON (opcional - para persistencia) =====
function savePhotoUrls() {
    // Esto guardaría las fotos en localStorage
    localStorage.setItem('premiosPhotos', JSON.stringify(appData.photoUrls));
}

// ===== RENDERIZAR CATEGORÍAS (MODIFICADO) =====
function renderCategories() {
    const container = document.querySelector('.categories-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.categories.forEach(category => {
        const totalVotes = category.nominees.reduce((sum, n) => sum + n.votes, 0);
        const userVote = appData.currentUser ? appData.currentUser.votes[category.id] : null;
        
        const top3 = category.nominees
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3);
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => openVoteModal(category.id);
        
        card.innerHTML = `
            <h3>${category.name}</h3>
            <p class="category-description">${category.description || ''}</p>
            <div class="vote-count">${totalVotes}</div>
            <div class="nominees-preview">
                ${top3.map(n => `
                    <div class="nominee-tag">
                        ${getNomineePhotoHTML(n)}
                        ${n.name} (${n.votes})
                    </div>
                `).join('')}
            </div>
            ${userVote ? `<div class="user-vote-indicator">✅ Tu voto: ${userVote}</div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

// ===== FUNCIÓN AUXILIAR PARA MOSTRAR FOTOS =====
function getNomineePhotoHTML(nominee) {
    const photoUrl = nominee.photo || appData.photoUrls[nominee.name];
    if (photoUrl) {
        return `<img src="${photoUrl}" class="nominee-preview-img" alt="${nominee.name}" onerror="this.style.display='none';">`;
    }
    return '👤';
}

// ===== MODAL DE VOTACIÓN (MODIFICADO) =====
function openVoteModal(categoryId) {
    if (!appData.currentUser) {
        alert('Por favor, identifícate primero');
        return;
    }
    
    currentCategoryId = categoryId;
    const category = appData.categories.find(c => c.id === categoryId);
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    modalCategory.textContent = category.name;
    modalCategory.innerHTML = `${category.name}<br><small>${category.description || ''}</small>`;
    nomineesList.innerHTML = '';
    
    const userVote = appData.currentUser.votes[categoryId];
    
    const sortedNominees = [...category.nominees].sort((a, b) => b.votes - a.votes);
    
    sortedNominees.forEach(nominee => {
        const isVoted = userVote === nominee.name;
        const votersCount = nominee.voters.length;
        const hasVoted = nominee.voters.includes(appData.currentUser.id);
        const photoUrl = nominee.photo || appData.photoUrls[nominee.name];
        
        const nomineeItem = document.createElement('div');
        nomineeItem.className = `nominee-item ${isVoted ? 'voted' : ''}`;
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        
        nomineeItem.innerHTML = `
            ${photoUrl ? 
                `<img src="${photoUrl}" class="nominee-photo" alt="${nominee.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\" viewBox=\"0 0 140 140\"><rect width=\"140\" height=\"140\" fill=\"%23667eea\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"50\" fill=\"white\" text-anchor=\"middle\" dy=\".3em\">${nominee.name.charAt(0)}</text></svg>';">` : 
                `<div class="nominee-photo" style="background:linear-gradient(45deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-user" style="font-size:3rem;color:white;"></i>
                </div>`
            }
            <h4 class="nominee-name">${nominee.name}</h4>
            <div class="vote-count-small">${nominee.votes} votos</div>
            <div class="voters-count">${votersCount} persona${votersCount !== 1 ? 's' : ''}</div>
            ${hasVoted ? '<div class="voted-check">⭐ Tú votaste aquí</div>' : ''}
            ${isVoted ? '<div class="voted-check">✅ Tu voto actual</div>' : ''}
        `;
        
        nomineesList.appendChild(nomineeItem);
    });
    
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('newNomineeName').value = '';
    photoPreviewFile = null;
    
    modal.style.display = 'block';
}

// ===== INICIALIZACIÓN MODIFICADA =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadAppData();
    updateStats();
    
    const lastUserId = localStorage.getItem('lastUserId');
    if (lastUserId && appData.users.length > 0) {
        const lastUser = appData.users.find(u => u.id == lastUserId);
        if (lastUser) {
            document.getElementById('userName').value = lastUser.name;
        }
    }
    
    window.onclick = function(event) {
        const modal = document.getElementById('voteModal');
        if (event.target == modal) {
            closeModal();
        }
        
        const adminPanel = document.getElementById('adminPanel');
        if (event.target == adminPanel) {
            closeAdminPanel();
        }
        
        const passwordModal = document.getElementById('passwordModal');
        if (event.target == passwordModal) {
            closePasswordModal();
        }
    };
    
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});