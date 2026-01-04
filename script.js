// ===== SISTEMA DE USUARIOS Y VOTOS =====
let appData = {
    currentUser: null,
    phase: 'nominations',
    categories: [
        {
            id: 1,
            name: "🏆 Mejor Meme Viviente",
            nominees: [
                { name: "Juan", votes: 0, voters: [], photo: null },
                { name: "Ana", votes: 0, voters: [], photo: null },
                { name: "Carlos", votes: 0, voters: [], photo: null }
            ]
        },
        {
            id: 2,
            name: "🎮 Jugón/a del Año",
            nominees: [
                { name: "Luis", votes: 0, voters: [], photo: null },
                { name: "María", votes: 0, voters: [], photo: null },
                { name: "Pedro", votes: 0, voters: [], photo: null }
            ]
        },
        {
            id: 3,
            name: "😂 Bromista Oficial",
            nominees: [
                { name: "Sofía", votes: 0, voters: [], photo: null },
                { name: "Diego", votes: 0, voters: [], photo: null },
                { name: "Laura", votes: 0, voters: [], photo: null }
            ]
        },
        {
            id: 4,
            name: "🍕 Devorador/a de Pizzas",
            nominees: [
                { name: "Miguel", votes: 0, voters: [], photo: null },
                { name: "Elena", votes: 0, voters: [], photo: null },
                { name: "Jorge", votes: 0, voters: [], photo: null }
            ]
        }
    ]
};

// Cargar datos guardados
function loadData() {
    const savedData = localStorage.getItem('premiosData');
    const savedUsers = localStorage.getItem('premiosUsers');
    
    if (savedData) {
        const parsed = JSON.parse(savedData);
        appData.categories = parsed.categories || appData.categories;
        appData.phase = parsed.phase || 'nominations';
    }
    
    appData.users = savedUsers ? JSON.parse(savedUsers) : [];
    
    updatePhaseBanner();
    updateVotersList();
    updateStats();
}

// Guardar datos
function saveData() {
    const dataToSave = {
        categories: appData.categories,
        phase: appData.phase
    };
    localStorage.setItem('premiosData', JSON.stringify(dataToSave));
    updateStats();
}

function saveUsers() {
    localStorage.setItem('premiosUsers', JSON.stringify(appData.users));
    updateVotersList();
}

// ===== LOGIN =====
function login() {
    const userName = document.getElementById('userName').value.trim();
    
    if (!userName) {
        alert('Por favor, introduce tu nombre');
        return;
    }
    
    if (userName.length < 2) {
        alert('El nombre debe tener al menos 2 caracteres');
        return;
    }
    
    // Verificar si el usuario ya existe
    let user = appData.users.find(u => u.name.toLowerCase() === userName.toLowerCase());
    
    if (!user) {
        // Crear nuevo usuario
        user = {
            id: Date.now(),
            name: userName,
            votes: {},
            votedAt: new Date().toISOString()
        };
        appData.users.push(user);
        saveUsers();
    }
    
    appData.currentUser = user;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Mostrar info del usuario
    showUserInfo();
    renderCategories();
    
    // Animar aparición
    const mainContent = document.getElementById('mainContent');
    mainContent.style.animation = 'fadeIn 0.5s ease forwards';
}

function logout() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        appData.currentUser = null;
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
        document.querySelector('.user-info')?.remove();
    }
}

function showUserInfo() {
    // Remover info anterior si existe
    const oldInfo = document.querySelector('.user-info');
    if (oldInfo) oldInfo.remove();
    
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span class="user-name">${appData.currentUser.name}</span>
        <button onclick="logout()" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Salir
        </button>
    `;
    
    document.body.appendChild(userInfo);
}

// ===== LISTA DE VOTANTES =====
function updateVotersList() {
    const votersList = document.getElementById('votersList');
    const activeUsers = appData.users.filter(u => 
        Object.keys(u.votes).length > 0
    );
    
    votersList.innerHTML = activeUsers.length > 0 
        ? activeUsers
            .map(user => `<div class="voter-tag">${user.name}</div>`)
            .join('')
        : '<div class="no-voters">Aún no hay votantes</div>';
}

// ===== RENDERIZAR CATEGORÍAS =====
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
            <div class="vote-count">${totalVotes}</div>
            <div class="nominees-preview">
                ${top3.map(n => `
                    <div class="nominee-tag">
                        ${n.photo ? `<img src="${n.photo}" class="nominee-preview-img" alt="${n.name}">` : '👤'}
                        ${n.name} (${n.votes})
                    </div>
                `).join('')}
            </div>
            ${userVote ? `<div class="user-vote-indicator">✅ Tu voto: ${userVote}</div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

// ===== MODAL DE VOTACIÓN =====
let currentCategoryId = null;
let photoPreviewFile = null;

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
    nomineesList.innerHTML = '';
    
    const userVote = appData.currentUser.votes[categoryId];
    
    // Ordenar por votos
    const sortedNominees = [...category.nominees].sort((a, b) => b.votes - a.votes);
    
    sortedNominees.forEach(nominee => {
        const isVoted = userVote === nominee.name;
        const votersCount = nominee.voters.length;
        const hasVoted = nominee.voters.includes(appData.currentUser.id);
        
        const nomineeItem = document.createElement('div');
        nomineeItem.className = `nominee-item ${isVoted ? 'voted' : ''}`;
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        
        nomineeItem.innerHTML = `
            ${nominee.photo ? 
                `<img src="${nominee.photo}" class="nominee-photo" alt="${nominee.name}">` : 
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
    
    // Limpiar preview de foto
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('newNomineeName').value = '';
    photoPreviewFile = null;
    
    modal.style.display = 'block';
}

// ===== VOTAR POR UN NOMINADO =====
function voteForNominee(nomineeName) {
    if (!appData.currentUser) {
        alert('Por favor, identifícate primero');
        return;
    }
    
    const category = appData.categories.find(c => c.id === currentCategoryId);
    const nominee = category.nominees.find(n => n.name === nomineeName);
    
    if (!nominee) return;
    
    // Verificar si ya votó en esta categoría
    if (appData.currentUser.votes[category.id]) {
        const previousVote = appData.currentUser.votes[category.id];
        
        // Restar voto anterior
        const previousNominee = category.nominees.find(n => n.name === previousVote);
        if (previousNominee) {
            previousNominee.votes--;
            previousNominee.voters = previousNominee.voters.filter(v => v !== appData.currentUser.id);
        }
    }
    
    // Registrar nuevo voto
    appData.currentUser.votes[category.id] = nomineeName;
    nominee.votes++;
    
    // Añadir usuario a la lista de votantes si no está
    if (!nominee.voters.includes(appData.currentUser.id)) {
        nominee.voters.push(appData.currentUser.id);
    }
    
    // Guardar cambios
    saveData();
    saveUsers();
    
    // Actualizar UI
    renderCategories();
    openVoteModal(currentCategoryId);
    updateVotersList();
}

// ===== SUBIR FOTOS =====
function previewPhoto() {
    const fileInput = document.getElementById('photoUpload');
    const preview = document.getElementById('photoPreview');
    
    if (fileInput.files && fileInput.files[0]) {
        photoPreviewFile = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(photoPreviewFile);
    }
}

function addNomineeWithPhoto() {
    const nameInput = document.getElementById('newNomineeName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Por favor, introduce un nombre');
        return;
    }
    
    if (!currentCategoryId) {
        alert('Selecciona una categoría primero');
        return;
    }
    
    const category = appData.categories.find(c => c.id === currentCategoryId);
    
    // Verificar si ya existe
    if (category.nominees.some(n => n.name.toLowerCase() === name.toLowerCase())) {
        alert('Este nominado ya existe en la categoría');
        return;
    }
    
    const newNominee = {
        name: name,
        votes: 0,
        voters: [],
        photo: null
    };
    
    // Subir foto si hay
    if (photoPreviewFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newNominee.photo = e.target.result;
            addNomineeToCategory(newNominee, category);
        };
        reader.readAsDataURL(photoPreviewFile);
    } else {
        addNomineeToCategory(newNominee, category);
    }
}

function addNomineeToCategory(nominee, category) {
    category.nominees.push(nominee);
    saveData();
    openVoteModal(currentCategoryId);
    
    // Limpiar formulario
    document.getElementById('newNomineeName').value = '';
    document.getElementById('photoPreview').innerHTML = '';
    photoPreviewFile = null;
}

// ===== UTILIDADES =====
function closeModal() {
    document.getElementById('voteModal').style.display = 'none';
}

function updatePhaseBanner() {
    const banner = document.getElementById('phaseBanner');
    const text = document.getElementById('phaseText');
    
    if (!banner || !text) return;
    
    switch(appData.phase) {
        case 'nominations':
            banner.style.background = 'linear-gradient(90deg, #FF416C, #FF4B2B)';
            text.textContent = '🎯 FASE DE NOMINACIONES - Vota por tus amigos';
            break;
        case 'voting':
            banner.style.background = 'linear-gradient(90deg, #2196F3, #21CBF3)';
            text.textContent = '⭐ FASE FINAL - Vota entre los 3 más nominados';
            break;
        case 'results':
            banner.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            text.textContent = '🏆 RESULTADOS FINALES - ¡Ganadores revelados!';
            break;
    }
}

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
    loadData();
    updateStats();
    
    // Verificar si hay usuario en localStorage
    const lastUserId = localStorage.getItem('lastUserId');
    if (lastUserId && appData.users.length > 0) {
        const lastUser = appData.users.find(u => u.id == lastUserId);
        if (lastUser) {
            document.getElementById('userName').value = lastUser.name;
        }
    }
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        const modal = document.getElementById('voteModal');
        if (event.target == modal) {
            closeModal();
        }
        
        const adminPanel = document.getElementById('adminPanel');
        if (event.target == adminPanel) {
            closeAdminPanel();
        }
    };
    
    // Enter para login
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});