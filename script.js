// ===== SISTEMA DE USUARIOS Y VOTOS =====
let appData = {
    currentUser: null,
    phase: 'nominations',
    categories: [],
    users: [],
    photoUrls: {}
};

// Hacer appData global para otros scripts
window.appData = appData;

let currentCategoryId = null;
let photoPreviewFile = null;

// ===== CARGAR DATOS (SIN COMPLICACIONES) =====
function loadAppData() {
    console.log("🔄 Cargando datos de la aplicación...");
    
    try {
        // A. INICIALIZAR ESTRUCTURAS
        if (!appData.photoUrls) appData.photoUrls = {};
        if (!appData.categories) appData.categories = [];
        if (!appData.users) appData.users = [];
        
        // B. CARGAR DE LOCALSTORAGE (SIEMPRE PRIMERO)
        cargarDesdeLocalStorage();
        
        // C. VERIFICAR CATEGORÍAS
        if (appData.categories.length === 0) {
            console.log("📋 Creando categorías por defecto...");
            appData.categories = createDefaultCategories();
            saveData();
        } else {
            console.log("✅ Usando categorías existentes:", appData.categories.length);
            ensureAllNomineesInCategories();
        }
        
        // D. INTENTAR FIREBASE (SOLO COMO EXTRA, NO ESENCIAL)
        if (typeof loadDataFromFirebase === 'function') {
            console.log("🔥 Intentando sincronizar con Firebase...");
            // Esto es solo para sincronizar, no es crítico
            loadDataFromFirebase().catch(() => {
                console.log("ℹ️ Firebase no disponible, trabajando localmente");
            });
        }
        
        // E. ACTUALIZAR UI
        updatePhaseBanner();
        updateVotersList();
        updateStats();
        renderCategories();
        
        console.log("✅ Datos cargados correctamente");
        
    } catch (error) {
        console.error("❌ Error en loadAppData:", error);
        // Si todo falla, crear datos básicos
        appData.categories = createDefaultCategories();
        renderCategories();
    }
}

// Función auxiliar para cargar desde localStorage
function cargarDesdeLocalStorage() {
    try {
        const savedData = localStorage.getItem('premiosData');
        const savedUsers = localStorage.getItem('premiosUsers');
        const savedPhotos = localStorage.getItem('premiosPhotos');
        
        if (savedData) {
            const parsed = JSON.parse(savedData);
            appData.categories = parsed.categories || [];
            appData.phase = parsed.phase || 'nominations';
            appData.photoUrls = parsed.photoUrls || {};
        }
        
        if (savedUsers) {
            appData.users = JSON.parse(savedUsers);
        }
        
        if (savedPhotos) {
            // Combinar fotos
            const parsedPhotos = JSON.parse(savedPhotos);
            appData.photoUrls = { ...appData.photoUrls, ...parsedPhotos };
        }
        
        console.log("📂 Datos cargados de localStorage");
        
    } catch (error) {
        console.error("Error cargando localStorage:", error);
    }
}

function createDefaultCategories() {
    const people = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    return [
        {
            id: 1,
            name: "👑 Más Putero/Putera",
            description: "El/la que más sale de fiesta y se lo curra en el ocio",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {} // Nuevo: para guardar frases
            }))
        },
        {
            id: 2,
            name: "🍻 Peor Borrachera",
            description: "Quien haya tenido la noche más épica (o desastrosa)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 3,
            name: "⏰ Más Impuntual",
            description: "El/la que siempre llega tarde, sin excepción",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 4,
            name: "😂 Más Gracioso/a",
            description: "El/la que siempre te saca una sonrisa (o carcajada)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 5,
            name: "👯‍♂️ Mejor Dúo",
            description: "La pareja más icónica del grupo",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 6,
            name: "🎉 Mejor Evento del Año",
            description: "La mejor fiesta/salida/organización del año",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 7,
            name: "🔊 Más Tocahuevos",
            description: "El/la que más insiste o molesta (con cariño)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 8,
            name: "🥴 Más Borracho/a",
            description: "Quien se pasa más con el alcohol (habitualmente)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 9,
            name: "👀 El/Lam que más mira por el grupo",
            description: "Quien más se preocupa por todos",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 10,
            name: "👿 Peor Influencia",
            description: "Quien te mete en más líos (pero divertidos)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 11,
            name: "🎭 El/Lam Dramas",
            description: "Quien monta más drama por todo",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 12,
            name: "🏃‍♂️ El/Lam que más deja tirado al grupo",
            description: "Quien más falla o desaparece",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 13,
            name: "💀 El/Lam que suelta más bastadas",
            description: "Quien dice las cosas más brutales sin filtro",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 14,
            name: "✅ Más Responsable",
            description: "Quien más se puede contar para lo importante",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 15,
            name: "😡 Mayor Cabreo del Año",
            description: "La mejor pataleta/enfado del año",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 16,
            name: "💬 Frase del Año",
            description: "La mejor frase/momento icónico (¡añade la frase al votar!)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {} // AQUÍ se guardarán las frases
            }))
        },
        {
            id: 17,
            name: "🌟 Persona Revelación 2025",
            description: "Quien más ha sorprendido este año",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 18,
            name: "🏆 Balón de Oro Puteros Awards 2025",
            description: "El MVP absoluto del grupo",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 19,
            name: "🎤 El Cantante",
            description: "Quien más canta (bien o mal, eso da igual)",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 20,
            name: "🔒 El Correas",
            description: "Quien más controla o ata corto",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 21,
            name: "👻 El Fantasma de la ESEI",
            description: "Quien menos se deja ver por la uni",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 22,
            name: "📚 El que menos va a clase",
            description: "Autodescriptivo, el rey/la reina del absentismo",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 23,
            name: "😳 Momento más Humillante",
            description: "La situación más vergonzosa del año",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 24,
            name: "😭 Más Lloros",
            description: "Quien más se emociona o dramatiza",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 25,
            name: "🎲 Datos Random",
            description: "Quien dice/sabe cosas más random",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 26,
            name: "📉 El/Lam más Putilla Académicamente",
            description: "El peor compañero para estudiar/trabajar",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 27,
            name: "💪 Tu Salvación Académica",
            description: "El último recurso, el mejor compañero en apuros",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        // CATEGORÍAS ORIGINALES QUE MANTENEMOS
        {
            id: 28,
            name: "🎮 Gamer del Año",
            description: "Ni pareja ni pollas, total esta jugando todo el dia",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 29,
            name: "📱 Cerebro dopamínico de niño de tiktok",
            description: "Si deja el movil 10 segundos, se convierte en nani",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 30,
            name: "🎤 Karaoke Star",
            description: "Se cree Bisbal o algo así",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        },
        {
            id: 31,
            name: "😴 Narcolepsico",
            description: "Quien es el subnormal que siempre se duerme, o duerme infinito",
            nominees: people.map(person => ({
                name: person,
                votes: 0,
                voters: [],
                photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null,
                frases: {}
            }))
        }
    ];
}

function ensureAllNomineesInCategories() {
    const allPeople = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    appData.categories.forEach(category => {
        if (!category.nominees) category.nominees = [];
        
        allPeople.forEach(person => {
            if (!category.nominees.some(n => n && n.name === person)) {
                category.nominees.push({
                    name: person,
                    votes: 0,
                    voters: [],
                    photo: obtenerFotoPersona ? obtenerFotoPersona(person) : null
                });
            } else {
                const nominee = category.nominees.find(n => n && n.name === person);
                if (nominee && !nominee.photo && obtenerFotoPersona) {
                    nominee.photo = obtenerFotoPersona(person);
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
    
    localStorage.setItem('premiosData', JSON.stringify(dataToSave));
    
    if (typeof saveDataToFirebase === 'function') {
        saveDataToFirebase().catch(error => {
            console.error("Error Firebase:", error);
        });
    }
    
    updateStats();
}

function saveUsers() {
    localStorage.setItem('premiosUsers', JSON.stringify(appData.users || []));
    
    if (typeof saveUsersToFirebase === 'function') {
        saveUsersToFirebase().catch(error => {
            console.error("Error Firebase users:", error);
        });
    }
    
    updateVotersList();
}

function savePhotos() {
    localStorage.setItem('premiosPhotos', JSON.stringify(appData.photoUrls || {}));
    
    if (typeof saveDataToFirebase === 'function') {
        saveDataToFirebase().catch(error => {
            console.error("Error Firebase photos:", error);
        });
    }
}

// ===== ACTUALIZAR FOTO DE PERSONA =====
function updatePersonPhoto(personName, photoUrl) {
    if (!personName || !photoUrl) return;
    
    if (!appData.photoUrls) appData.photoUrls = {};
    appData.photoUrls[personName] = photoUrl;
    
    appData.categories.forEach(category => {
        const nominee = category.nominees?.find(n => n && n.name === personName);
        if (nominee) nominee.photo = photoUrl;
    });
    
    savePhotos();
    saveData();
    if (typeof renderCategories === 'function') renderCategories();
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
    
    let user = (appData.users || []).find(u => u && u.name && u.name.toLowerCase() === userName.toLowerCase());
    
    if (!user) {
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
    
    localStorage.setItem('lastUserId', user.id);
    
    showUserInfo();
    renderCategories();
    
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
    
    const activeUsers = (appData.users || []).filter(u => {
        if (!u) return false;
        const votes = u.votes || {};
        return Object.keys(votes).length > 0;
    });
    
    votersList.innerHTML = activeUsers.length > 0 
        ? activeUsers.map(user => `<div class="voter-tag">${user.name}</div>`).join('')
        : '<div class="no-voters">Aún no hay votantes</div>';
}

// ===== RENDERIZAR CATEGORÍAS =====
function renderCategories() {
    const container = document.querySelector('.categories-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!appData.categories || appData.categories.length === 0) {
        container.innerHTML = '<div class="no-categories">No hay categorías</div>';
        return;
    }
    
    appData.categories.forEach(category => {
        if (!category) return;
        
        const nominees = category.nominees || [];
        const totalVotes = nominees.reduce((sum, n) => sum + (n.votes || 0), 0);
        const userVote = appData.currentUser ? (appData.currentUser.votes || {})[category.id] : null;
        
        const top3 = nominees
            .filter(n => n)
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
    
    const photoUrl = nominee.photo || (appData.photoUrls && appData.photoUrls[nominee.name]);
    if (photoUrl) {
        return `<img src="${photoUrl}" class="nominee-preview-img" alt="${nominee.name}" onerror="this.style.display='none';">`;
    }
    return '👤';
}

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
    
    modalCategory.innerHTML = `${category.name}<br><small>${category.description || ''}</small>`;
    nomineesList.innerHTML = '';
    
    const userVotes = appData.currentUser.votes || {};
    const userVote = userVotes[categoryId];
    
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    sortedNominees.forEach(nominee => {
        const isVoted = userVote && userVote.nomineeName === nominee.name;
        const voters = nominee.voters || [];
        const votersCount = voters.length;
        const hasVoted = voters.includes(appData.currentUser.id);
        const photoUrl = nominee.photo || (appData.photoUrls && appData.photoUrls[nominee.name]);
        
        const nomineeItem = document.createElement('div');
        nomineeItem.className = `nominee-item ${isVoted ? 'voted' : ''}`;
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        
        // Contenido básico del nominado
        nomineeItem.innerHTML = `
            ${photoUrl ? 
                `<img src="${photoUrl}" class="nominee-photo" alt="${nominee.name}" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                ''
            }
            ${!photoUrl ? `
                <div class="nominee-photo" style="background:linear-gradient(45deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-user" style="font-size:3rem;color:white;"></i>
                </div>
            ` : ''}
            <h4 class="nominee-name">${nominee.name}</h4>
            <div class="vote-count-small">${nominee.votes || 0} votos</div>
            <div class="voters-count">${votersCount} persona${votersCount !== 1 ? 's' : ''}</div>
            ${hasVoted ? '<div class="voted-check">⭐ Tú votaste aquí</div>' : ''}
            ${isVoted ? '<div class="voted-check">✅ Tu voto actual</div>' : ''}
        `;
        
        // ========== AÑADIR FRASES EXISTENTES ==========
        // Solo para categoría 16 (Frase del Año) y si hay frases
        if (category.id === 16 && nominee.frases && Object.keys(nominee.frases).length > 0) {
            const frasesDiv = document.createElement('div');
            frasesDiv.className = 'existing-frases';
            frasesDiv.style.marginTop = '10px';
            frasesDiv.style.padding = '8px';
            frasesDiv.style.background = 'rgba(255, 215, 0, 0.1)';
            frasesDiv.style.borderRadius = '5px';
            frasesDiv.style.fontSize = '12px';
            
            let frasesText = '<strong>💬 Frases añadidas:</strong><br>';
            let contador = 0;
            
            // Mostrar máximo 2 frases para no saturar
            Object.values(nominee.frases).forEach(fraseData => {
                if (contador < 2) {
                    frasesText += `"${fraseData.frase.substring(0, 40)}${fraseData.frase.length > 40 ? '...' : ''}"<br>`;
                    contador++;
                }
            });
            
            if (Object.keys(nominee.frases).length > 2) {
                frasesText += `... y ${Object.keys(nominee.frases).length - 2} más`;
            }
            
            frasesDiv.innerHTML = frasesText;
            nomineeItem.appendChild(frasesDiv);
        }
        // ========== FIN DEL CÓDIGO DE FRASES ==========
        
        nomineesList.appendChild(nomineeItem);
    });
    
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('newNomineeName').value = '';
    photoPreviewFile = null;
    
    modal.style.display = 'block';
}

// ===== VOTAR POR UN NOMINADO CON FRASE =====
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
        alert('Error: Nominado no encontrado');
        return;
    }
    
    // ===== SISTEMA DE FRASES PARA "FRASE DEL AÑO" =====
    let fraseUsuario = '';
    
    // Solo pedir frase para la categoría 16 (Frase del Año)
    if (category.id === 16) {
        fraseUsuario = prompt(
            `📝 FRASE DEL AÑO\n\nEstás votando a ${nomineeName}.\n\nPor favor, escribe la frase icónica que dijo (o por la que es famoso/a):\n\nEjemplo: "Mejor me voy a mi casa"`,
            ""
        );
        
        // Si cancela el prompt, no votar
        if (fraseUsuario === null) {
            return;
        }
        
        // Limpiar la frase
        fraseUsuario = fraseUsuario.trim();
        
        // Validar que no esté vacía
        if (!fraseUsuario) {
            if (!confirm("¿Votar sin añadir frase? (Puedes dejarla vacía)")) {
                return;
            }
        }
    }
    
    // ===== PROCESAR EL VOTO =====
    if (!appData.currentUser.votes) appData.currentUser.votes = {};
    if (!nominee.voters) nominee.voters = [];
    if (!nominee.frases) nominee.frases = {};
    
    // Quitar voto anterior si existe
    if (appData.currentUser.votes[category.id]) {
        const previousVote = appData.currentUser.votes[category.id];
        const previousNominee = nominees.find(n => n && n.name === previousVote.nomineeName);
        if (previousNominee) {
            previousNominee.votes = Math.max(0, (previousNominee.votes || 1) - 1);
            previousNominee.voters = (previousNominee.voters || []).filter(v => v !== appData.currentUser.id);
            // También quitar frase anterior si existe
            if (previousNominee.frases && previousNominee.frases[appData.currentUser.id]) {
                delete previousNominee.frases[appData.currentUser.id];
            }
        }
    }
    
    // Guardar el nuevo voto
    appData.currentUser.votes[category.id] = {
        nomineeName: nomineeName,
        frase: fraseUsuario || null,
        timestamp: new Date().toISOString()
    };
    
    // Actualizar nominado
    nominee.votes = (nominee.votes || 0) + 1;
    
    if (!nominee.voters.includes(appData.currentUser.id)) {
        nominee.voters.push(appData.currentUser.id);
    }
    
    // Guardar frase si existe
    if (fraseUsuario) {
        nominee.frases[appData.currentUser.id] = {
            frase: fraseUsuario,
            voter: appData.currentUser.name,
            timestamp: new Date().toISOString()
        };
    }
    
    // Guardar datos
    saveData();
    saveUsers();
    
    // Mostrar confirmación especial para Frase del Año
    if (category.id === 16 && fraseUsuario) {
        alert(`✅ ¡Voto registrado!\n\nHas votado por ${nomineeName}\nFrase añadida: "${fraseUsuario}"`);
    } else {
        alert(`✅ ¡Voto registrado!\nHas votado por ${nomineeName} en "${category.name}"`);
    }
    
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
    
    if (!category.nominees) category.nominees = [];
    
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
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Iniciando aplicación Pteros Awards...");
    
    setTimeout(function() {
        loadAppData();
        updateStats();
        
        const lastUserId = localStorage.getItem('lastUserId');
        if (lastUserId && appData.users && appData.users.length > 0) {
            const lastUser = appData.users.find(u => u && u.id == lastUserId);
            if (lastUser) {
                document.getElementById('userName').value = lastUser.name;
            }
        }
    }, 800);
    
    window.onclick = function(event) {
        const modal = document.getElementById('voteModal');
        if (event.target == modal) closeModal();
        
        const adminPanel = document.getElementById('adminPanel');
        if (event.target == adminPanel) closeAdminPanel();
        
        const passwordModal = document.getElementById('passwordModal');
        if (event.target == passwordModal) closePasswordModal();
    };
    
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
});