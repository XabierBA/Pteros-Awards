// ===== SISTEMA DE USUARIOS Y VOTOS =====
let appData = {
    currentUser: null,
    phase: 'nominations',
    categories: [],
    users: [],
    photoUrls: {}
};

let currentCategoryId = null;
let photoPreviewFile = null;

// ===== CARGAR DATOS Y FOTOS =====
async function loadAppData() {
    try {
        console.log("🔄 Cargando datos de la aplicación...");
        
        // Inicializar arrays vacíos por si acaso
        appData.categories = [];
        appData.users = [];
        appData.photoUrls = {};
        
        // Cargar de Firebase si está disponible
        if (typeof loadDataFromFirebase === 'function') {
            console.log("🔥 Intentando cargar de Firebase...");
            await loadDataFromFirebase();
            await loadUsersFromFirebase();
        } else {
            console.log("📱 Firebase no disponible, usando localStorage");
            // Cargar de localStorage
            const savedData = localStorage.getItem('premiosData');
            const savedUsers = localStorage.getItem('premiosUsers');
            const savedPhotos = localStorage.getItem('premiosPhotos');
            
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    appData.categories = parsed.categories || [];
                    appData.phase = parsed.phase || 'nominations';
                    appData.photoUrls = parsed.photoUrls || {};
                } catch (e) {
                    console.error("Error parseando premiosData:", e);
                }
            }
            
            if (savedUsers) {
                try {
                    appData.users = JSON.parse(savedUsers);
                } catch (e) {
                    console.error("Error parseando premiosUsers:", e);
                    appData.users = [];
                }
            }
            
            if (savedPhotos) {
                try {
                    appData.photoUrls = JSON.parse(savedPhotos);
                } catch (e) {
                    console.error("Error parseando premiosPhotos:", e);
                    appData.photoUrls = {};
                }
            }
        }
        
        console.log("📊 Categorías cargadas:", appData.categories.length);
        console.log("👥 Usuarios cargados:", appData.users.length);
        console.log("🖼️ PhotoUrls cargados:", Object.keys(appData.photoUrls).length);
        
        // Si no hay categorías, crear defaults
        if (appData.categories.length === 0) {
            console.log("📋 Creando categorías por defecto...");
            appData.categories = createDefaultCategories();
            // Guardar las categorías por defecto
            saveData();
        } else {
            console.log("✅ Usando categorías existentes");
            ensureAllNomineesInCategories();
        }
        
        // Configurar listeners de Firebase (si existen)
        if (typeof setupRealtimeListeners === 'function') {
            setTimeout(setupRealtimeListeners, 2000); // Esperar un poco
        }
        
        updatePhaseBanner();
        updateVotersList();
        updateStats();
        
        // FORZAR renderizado de categorías
        console.log("🎨 Renderizando categorías...");
        renderCategories();
        
        console.log("✅ Datos cargados correctamente");
        
    } catch (error) {
        console.error("❌ Error cargando datos:", error);
        // Crear datos por defecto si hay error
        appData.categories = createDefaultCategories();
        appData.users = [];
        appData.photoUrls = {};
        
        // Renderizar categorías de todas formas
        renderCategories();
    }
}

function createDefaultCategories() {
    const people = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    return [
        {
            id: 1,
            name: "👑 Rey/Reyna del Grupo",
            description: "La persona más \"influyente\" y respetada del grupo",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 2,
            name: "⚽ MVP ESEI FUT",
            description: "El q vote Iker se lleva una ostia (Avisado estas Iker)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 3,
            name: "😂 Payaso Oficial",
            description: "Es facil reirse con el, o de el jsjsj",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 4,
            name: "🎨 Talento Artístico",
            description: "En este grupo? poco y regular",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 5,
            name: "💖 Corazón del Grupo",
            description: "El/la más empático/a, cariñoso/a y buen rollo",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 6,
            name: "🍻 El alma de la fiesta",
            description: "Si no hay ganas el las trae",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 7,
            name: "📱 Cerebro dopamínico de niño de tiktok",
            description: "Si deja el movil 10 segundos, se convierte en nani",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 8,
            name: "🍕 Pizza-p",
            description: "Come mas pizzas q pijas Joel",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 9,
            name: "🎮 Gamer del Año",
            description: "Ni pareja ni pollas, total esta jugando todo el dia",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 10,
            name: "🏆 El bromitas",
            description: "Si no hace coñas, le da un jamacuco al cabrón",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 11,
            name: "👨‍💻 Admin Legendario",
            description: "Obvio Xabi",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 12,
            name: "💃 Reina del Baile",
            description: "Baila baila baila",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 13,
            name: "🎤 Karaoke Star",
            description: "Se cree Bisbal o algo así",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 14,
            name: "📸 Fotógrafo",
            description: "A ver si para de sacar fotos de una puta vez",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        },
        {
            id: 15,
            name: "😴 Narcolepsico",
            description: "Quien es el subnormal que siempre se duerme, o duerme infinito",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: appData.photoUrls[person] || null
            }))
        }
    ];
}

function ensureAllNomineesInCategories() {
    const allPeople = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    appData.categories.forEach(category => {
        // Asegurar que nominees existe
        if (!category.nominees) {
            category.nominees = [];
        }
        
        allPeople.forEach(person => {
            if (!category.nominees.some(n => n && n.name === person)) {
                category.nominees.push({
                    name: person,
                    votes: 0,
                    voters: [],
                    photo: appData.photoUrls[person] || null
                });
            } else {
                // Actualizar foto si no está definida
                const nominee = category.nominees.find(n => n && n.name === person);
                if (nominee && !nominee.photo && appData.photoUrls[person]) {
                    nominee.photo = appData.photoUrls[person];
                }
            }
        });
    });
}

// ===== GUARDAR DATOS =====
function saveData() {
    const dataToSave = {
        categories: appData.categories || [],
        phase: appData.phase || 'nominations',
        photoUrls: appData.photoUrls || {}
    };
    
    // Guardar en localStorage como backup
    localStorage.setItem('premiosData', JSON.stringify(dataToSave));
    
    // Intentar guardar en Firebase
    if (typeof saveDataToFirebase === 'function') {
        saveDataToFirebase().catch(error => {
            console.error("Error en saveDataToFirebase:", error);
        });
    }
    
    updateStats();
}

function saveUsers() {
    // Guardar en localStorage como backup
    localStorage.setItem('premiosUsers', JSON.stringify(appData.users || []));
    
    // Intentar guardar en Firebase
    if (typeof saveUsersToFirebase === 'function') {
        saveUsersToFirebase().catch(error => {
            console.error("Error en saveUsersToFirebase:", error);
        });
    }
    
    updateVotersList();
}

function savePhotos() {
    // Guardar en localStorage como backup
    localStorage.setItem('premiosPhotos', JSON.stringify(appData.photoUrls || {}));
    
    // Intentar guardar en Firebase
    if (typeof saveDataToFirebase === 'function') {
        saveDataToFirebase().catch(error => {
            console.error("Error guardando fotos en Firebase:", error);
        });
    }
}

// ===== ACTUALIZAR FOTO DE PERSONA =====
function updatePersonPhoto(personName, photoUrl) {
    if (personName && photoUrl) {
        // Asegurar que photoUrls existe
        if (!appData.photoUrls) {
            appData.photoUrls = {};
        }
        
        appData.photoUrls[personName] = photoUrl;
        
        // Actualizar en todas las categorías
        appData.categories.forEach(category => {
            const nominee = category.nominees.find(n => n && n.name === personName);
            if (nominee) {
                nominee.photo = photoUrl;
            }
        });
        
        savePhotos();
        saveData();
        renderCategories();
    }
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
    let user = (appData.users || []).find(u => u && u.name && u.name.toLowerCase() === userName.toLowerCase());
    
    if (!user) {
        // Crear nuevo usuario
        user = {
            id: Date.now(),
            name: userName,
            votes: {},
            votedAt: new Date().toISOString()
        };
        appData.users = appData.users || [];
        appData.users.push(user);
        saveUsers();
    }
    
    appData.currentUser = user;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Guardar último usuario
    localStorage.setItem('lastUserId', user.id);
    
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
    if (!votersList) return;
    
    // Asegurar que users existe y tiene votes
    const activeUsers = (appData.users || []).filter(u => {
        if (!u) return false;
        const votes = u.votes || {};
        return Object.keys(votes).length > 0;
    });
    
    votersList.innerHTML = activeUsers.length > 0 
        ? activeUsers
            .map(user => `<div class="voter-tag">${user.name}</div>`)
            .join('')
        : '<div class="no-voters">Aún no hay votantes</div>';
}

// ===== RENDERIZAR CATEGORÍAS =====
function renderCategories() {
    const container = document.querySelector('.categories-container');
    if (!container) {
        console.error("❌ No se encontró .categories-container");
        return;
    }
    
    container.innerHTML = '';
    
    // Verificar que hay categorías
    if (!appData.categories || appData.categories.length === 0) {
        container.innerHTML = '<div class="no-categories">No hay categorías disponibles</div>';
        return;
    }
    
    appData.categories.forEach(category => {
        if (!category) return;
        
        const nominees = category.nominees || [];
        const totalVotes = nominees.reduce((sum, n) => sum + (n.votes || 0), 0);
        const userVote = appData.currentUser ? (appData.currentUser.votes || {})[category.id] : null;
        
        const top3 = nominees
            .filter(n => n) // Filtrar nominados nulos
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .slice(0, 3);
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => openVoteModal(category.id);
        
        card.innerHTML = `
            <h3>${category.name || 'Sin nombre'}</h3>
            <p class="category-description">${category.description || ''}</p>
            <div class="vote-count">${totalVotes}</div>
            <div class="nominees-preview">
                ${top3.map(n => `
                    <div class="nominee-tag">
                        ${getNomineePhotoHTML(n)}
                        ${n.name || 'Sin nombre'} (${n.votes || 0})
                    </div>
                `).join('')}
            </div>
            ${userVote ? `<div class="user-vote-indicator">✅ Tu voto: ${userVote}</div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

function getNomineePhotoHTML(nominee) {
    if (!nominee) return '👤';
    
    const photoUrls = appData.photoUrls || {};
    const photoUrl = nominee.photo || photoUrls[nominee.name];
    if (photoUrl) {
        return `<img src="${photoUrl}" class="nominee-preview-img" alt="${nominee.name}" onerror="this.style.display='none';">`;
    }
    return '👤';
}

// ===== MODAL DE VOTACIÓN =====
function openVoteModal(categoryId) {
    if (!appData.currentUser) {
        alert('Por favor, identifícate primero');
        return;
    }
    
    currentCategoryId = categoryId;
    const category = appData.categories.find(c => c && c.id === categoryId);
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    if (!category) {
        alert('Error: Categoría no encontrada');
        return;
    }
    
    modalCategory.innerHTML = `${category.name || 'Sin nombre'}<br><small>${category.description || ''}</small>`;
    nomineesList.innerHTML = '';
    
    const userVotes = appData.currentUser.votes || {};
    const userVote = userVotes[categoryId];
    
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n) // Filtrar nulos
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    sortedNominees.forEach(nominee => {
        const isVoted = userVote === nominee.name;
        const voters = nominee.voters || [];
        const votersCount = voters.length;
        const hasVoted = voters.includes(appData.currentUser.id);
        const photoUrls = appData.photoUrls || {};
        const photoUrl = nominee.photo || photoUrls[nominee.name];
        
        const nomineeItem = document.createElement('div');
        nomineeItem.className = `nominee-item ${isVoted ? 'voted' : ''}`;
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        
        nomineeItem.innerHTML = `
            ${photoUrl ? 
                `<img src="${photoUrl}" class="nominee-photo" alt="${nominee.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\" viewBox=\"0 0 140 140\"><rect width=\"140\" height=\"140\" fill=\"%23667eea\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"50\" fill=\"white\" text-anchor=\"middle\" dy=\".3em\">${nominee.name ? nominee.name.charAt(0) : '?'}</text></svg>';">` : 
                `<div class="nominee-photo" style="background:linear-gradient(45deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-user" style="font-size:3rem;color:white;"></i>
                </div>`
            }
            <h4 class="nominee-name">${nominee.name || 'Sin nombre'}</h4>
            <div class="vote-count-small">${nominee.votes || 0} votos</div>
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

// ===== VOTAR POR UN NOMINADO =====
function voteForNominee(nomineeName) {
    if (!appData.currentUser) {
        alert('Por favor, identifícate primero');
        return;
    }
    
    const category = appData.categories.find(c => c && c.id === currentCategoryId);
    if (!category) {
        alert('Error: Categoría no encontrada');
        return;
    }
    
    const nominees = category.nominees || [];
    const nominee = nominees.find(n => n && n.name === nomineeName);
    if (!nominee) {
        alert('Error: Nominado no encontrada');
        return;
    }
    
    // Inicializar arrays si no existen
    if (!appData.currentUser.votes) appData.currentUser.votes = {};
    if (!nominee.voters) nominee.voters = [];
    
    // Verificar si ya votó en esta categoría
    if (appData.currentUser.votes[category.id]) {
        const previousVote = appData.currentUser.votes[category.id];
        
        // Restar voto anterior
        const previousNominee = nominees.find(n => n && n.name === previousVote);
        if (previousNominee) {
            previousNominee.votes = (previousNominee.votes || 1) - 1;
            previousNominee.voters = (previousNominee.voters || []).filter(v => v !== appData.currentUser.id);
        }
    }
    
    // Registrar nuevo voto
    appData.currentUser.votes[category.id] = nomineeName;
    nominee.votes = (nominee.votes || 0) + 1;
    
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
    
    const category = appData.categories.find(c => c && c.id === currentCategoryId);
    if (!category) {
        alert('Categoría no encontrada');
        return;
    }
    
    // Inicializar nominees si no existe
    if (!category.nominees) category.nominees = [];
    
    // Verificar si ya existe
    if (category.nominees.some(n => n && n.name && n.name.toLowerCase() === name.toLowerCase())) {
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
            updatePersonPhoto(name, e.target.result);
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
    const users = appData.users || [];
    const categories = appData.categories || [];
    
    const totalVoters = users.filter(u => {
        const votes = u.votes || {};
        return Object.keys(votes).length > 0;
    }).length;
    
    const totalCategories = categories.length;
    
    const totalVotes = categories.reduce((sum, cat) => {
        const nominees = cat.nominees || [];
        return sum + nominees.reduce((catSum, nom) => catSum + (nom.votes || 0), 0);
    }, 0);
    
    const votersElement = document.getElementById('totalVoters');
    const categoriesElement = document.getElementById('totalCategories');
    const votesElement = document.getElementById('totalVotes');
    
    if (votersElement) votersElement.textContent = totalVoters;
    if (categoriesElement) categoriesElement.textContent = totalCategories;
    if (votesElement) votesElement.textContent = totalVotes;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Iniciando aplicación...");
    
    // Esperar un momento para que Firebase se cargue
    setTimeout(async () => {
        await loadAppData();
        updateStats();
        
        const lastUserId = localStorage.getItem('lastUserId');
        if (lastUserId && appData.users && appData.users.length > 0) {
            const lastUser = appData.users.find(u => u && u.id == lastUserId);
            if (lastUser) {
                document.getElementById('userName').value = lastUser.name;
            }
        }
    }, 500);
    
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