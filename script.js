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

// ===== CARGAR DATOS Y FOTOS =====
function loadAppData() {
    console.log("🔄 Cargando datos de la aplicación...");
    
    // ==== NUEVO: FORZAR LIMPIEZA DE LOCALSTORAGE PARA SINCRONIZAR DESDE FIREBASE ====
    console.log("🧹 Limpiando localStorage para sincronizar desde Firebase...");
    
    // Opcional: Guardar el último usuario antes de limpiar
    const lastUser = localStorage.getItem('lastUserId');
    const lastUserName = localStorage.getItem('lastUserName');
    
    // Limpiar solo los datos de la aplicación, no todo
    localStorage.removeItem('premiosData');
    localStorage.removeItem('premiosUsers');
    localStorage.removeItem('premiosPhotos');
    
    // Restaurar el usuario si existe
    if (lastUser) {
        localStorage.setItem('lastUserId', lastUser);
    }
    if (lastUserName) {
        localStorage.setItem('lastUserName', lastUserName);
    }
    
    console.log("✅ localStorage limpiado para sincronización forzada");
    
    // Continuar con la carga normal...
    try {
        // ... el resto de tu función existente
        // A. INICIALIZAR ESTRUCTURAS
        if (!appData.photoUrls) appData.photoUrls = {};
        if (!appData.categories) appData.categories = [];
        if (!appData.users) appData.users = [];
        
        // B. INICIALIZAR SISTEMA DE FOTOS
        console.log("📸 Inicializando sistema de fotos...");
        
        if (typeof inicializarFotos === 'function') {
            inicializarFotos().then(exito => {
                if (exito) {
                    console.log("✅ Fotos cargadas correctamente");
                }
                continuarDespuesDeFotos();
            }).catch(error => {
                console.error("❌ Error cargando fotos:", error);
                continuarDespuesDeFotos();
            });
        } else {
            console.log("⚠️ Función inicializarFotos no disponible");
            continuarDespuesDeFotos();
        }
        
        function continuarDespuesDeFotos() {
            // C. PRIMERO LOCALSTORAGE (rápido)
            cargarDesdeLocalStorage();
            console.log("📂 Datos básicos cargados de localStorage");
            
            // D. VERIFICAR CATEGORÍAS
            if (appData.categories.length === 0) {
                console.log("📋 Creando categorías por defecto...");
                appData.categories = createDefaultCategories();
                saveData(); // Guardar inmediatamente
            } else {
                console.log("✅ Usando categorías existentes:", appData.categories.length);
                ensureAllNomineesInCategories();
                
                // VERIFICAR IDs DUPLICADOS
                verificarIDsCategorias();
            }
            
            // E. ACTUALIZAR UI CON LO QUE TENEMOS
            updatePhaseBanner();
            updateVotersList();
            updateStats();
            renderCategories();
            
            console.log("✅ UI actualizada con datos locales");
            
            // F. LUEGO FIREBASE EN SEGUNDO PLANO (sincronización)
            if (typeof loadDataFromFirebase === 'function') {
                console.log("🔥 Sincronizando con Firebase en segundo plano...");
                
                setTimeout(() => {
                    loadDataFromFirebase().then(exito => {
                        if (exito) {
                            console.log("✅ Sincronización Firebase completada");
                            updatePhaseBanner();
                            updateVotersList();
                            updateStats();
                            renderCategories();
                            console.log("🔄 UI actualizada con datos de Firebase");
                        }
                    }).catch(error => {
                        console.log("⚠️ Firebase no disponible, trabajando localmente:", error.message);
                    });
                }, 1000);
            } else {
                console.log("📱 Firebase no disponible en este navegador");
            }
            
            console.log("✅ Datos cargados correctamente");
        }
        
    } catch (error) {
        console.error("❌ Error crítico en loadAppData:", error);
        appData.categories = createDefaultCategories();
        appData.users = [];
        appData.photoUrls = {};
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
            const parsedPhotos = JSON.parse(savedPhotos);
            appData.photoUrls = { ...appData.photoUrls, ...parsedPhotos };
        }
        
        console.log("📂 Datos cargados de localStorage");
        
    } catch (error) {
        console.error("Error cargando localStorage:", error);
    }
}

// ===== VERIFICAR IDs DE CATEGORÍAS =====
function verificarIDsCategorias() {
    const ids = new Set();
    const duplicados = [];
    
    appData.categories.forEach((cat, index) => {
        if (!cat || !cat.id) return;
        if (ids.has(cat.id)) {
            duplicados.push({ id: cat.id, nombre: cat.name, index: index });
            // Asignar nuevo ID único
            cat.id = Math.max(...appData.categories.map(c => c.id || 0)) + 1;
        } else {
            ids.add(cat.id);
        }
    });
    
    if (duplicados.length > 0) {
        console.warn("⚠️ IDs duplicados corregidos:", duplicados);
        saveData(); // Guardar cambios
    }
}

function createDefaultCategories() {
    const people = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    return [
        { id: 1, name: "👑 Más Putero", description: "Puterismo de manual", nominees: people.map(p => crearNominado(p)) },
        { id: 2, name: "👑 Más Putera", description: "No me seais cabrones que nos conocemos", nominees: people.map(p => crearNominado(p)) },
        { id: 3, name: "🍻 Peor Borrachera", description: "La locura en persona cuando va borracha", nominees: people.map(p => crearNominado(p)) },
        { id: 4, name: "⏰ Más Impuntual", description: "Mmm, me cago en su puta estampa", nominees: people.map(p => crearNominado(p)) },
        { id: 5, name: "😂 Más Gracioso/a", description: "La vd es q dais pena todos", nominees: people.map(p => crearNominado(p)) },
        { id: 6, name: "👯‍♂️ Mejor Dúo", description: "El duo dinámico, creo q sabemos quienes son (si votais a alguien añadid a su duo como frase)", nominees: people.map(p => crearNominado(p)) },
        { id: 7, name: "🎉 Mejor Evento del Año", description: "Esto votad persona y el evento q organizó (como frase)", nominees: people.map(p => crearNominado(p)) },
        { id: 8, name: "🔊 Más Tocahuevos", description: "El/la que más insiste o molesta (con cariño)", nominees: people.map(p => crearNominado(p)) },
        { id: 9, name: "🥴 Más Borracho/a", description: "Quien se pasa más con el alcohol (habitualmente)", nominees: people.map(p => crearNominado(p)) },
        { id: 10, name: "👀 El/La que más mira por el grupo", description: "Quien más se preocupa por todos", nominees: people.map(p => crearNominado(p)) },
        { id: 11, name: "👿 Peor Influencia", description: "Quien te mete en más líos (pero divertidos)", nominees: people.map(p => crearNominado(p)) },
        { id: 12, name: "🎭 El/La que más dramas monta", description: "Quien monta más drama por todo", nominees: people.map(p => crearNominado(p)) },
        { id: 13, name: "🏃‍♂️ El/La que más deja tirado al grupo", description: "Quien más falla o desaparece", nominees: people.map(p => crearNominado(p)) },
        { id: 14, name: "💀 El/La que suelta más bastadas", description: "Quien dice las cosas más brutales sin filtro", nominees: people.map(p => crearNominado(p)) },
        { id: 15, name: "✅ Más Responsable", description: "Quien más se puede contar para lo importante", nominees: people.map(p => crearNominado(p)) },
        { id: 16, name: "😡 Mayor Cabreo del Año", description: "La mejor pataleta/enfado del año", nominees: people.map(p => crearNominado(p)) },
        { id: 17, name: "💬 Frase del Año", description: "La mejor frase/momento icónico (¡añade la frase al votar!)", nominees: people.map(p => crearNominado(p)) },
        { id: 18, name: "🌟 Persona Revelación 2025", description: "Quien más ha sorprendido este año", nominees: people.map(p => crearNominado(p)) },
        { id: 19, name: "🏆 Balón de Oro Puteros Awards 2026", description: "El MVP absoluto del grupo", nominees: people.map(p => crearNominado(p)) },
        { id: 20, name: "🔒 El Correas", description: "Quien más está atado corto", nominees: people.map(p => crearNominado(p)) },
        { id: 21, name: "🔒 El que pone las correas", description: "Quien más controla", nominees: people.map(p => crearNominado(p)) },
        { id: 22, name: "👻 El Fantasma de la ESEI", description: "Quien menos se deja ver por la uni", nominees: people.map(p => crearNominado(p)) },
        { id: 23, name: "📚 El que menos va a clase", description: "Autodescriptivo, el rey/la reina del absentismo", nominees: people.map(p => crearNominado(p)) },
        { id: 24, name: "😳 Momento más Humillante", description: "La situación más vergonzosa del año", nominees: people.map(p => crearNominado(p)) },
        { id: 25, name: "😭 Más Lloros", description: "Quien más se emociona o dramatiza", nominees: people.map(p => crearNominado(p)) },
        { id: 26, name: "🎲 Datos Random", description: "Quien dice/sabe cosas más random", nominees: people.map(p => crearNominado(p)) },
        { id: 27, name: "📉 El/La más Putilla Académicamente", description: "El peor compañero para estudiar/trabajar", nominees: people.map(p => crearNominado(p)) },
        { id: 28, name: "💪 Tu Salvación Académica", description: "El último recurso, el mejor compañero en apuros", nominees: people.map(p => crearNominado(p)) },
        { id: 29, name: "🎮 Gamer del Año", description: "Ni pareja ni pollas, total esta jugando todo el dia", nominees: people.map(p => crearNominado(p)) },
        { id: 30, name: "📱 Cerebro dopamínico de niño de tiktok", description: "Si deja el movil 10 segundos, se convierte en nani", nominees: people.map(p => crearNominado(p)) },
        { id: 31, name: "🎤 Karaoke Star", description: "Se cree Bisbal o algo así", nominees: people.map(p => crearNominado(p)) },
        { id: 32, name: "😴 Narcolepsico", description: "Quien es el subnormal que siempre se duerme, o duerme infinito", nominees: people.map(p => crearNominado(p)) }
    ];
}

function crearNominado(persona) {
    return {
        name: persona,
        votes: 0,
        voters: [],
        photo: obtenerFotoPersona ? obtenerFotoPersona(persona) : null,
        frases: {}
    };
}

function ensureAllNomineesInCategories() {
    const allPeople = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    appData.categories.forEach(category => {
        if (!category.nominees) category.nominees = [];
        
        allPeople.forEach(person => {
            if (!category.nominees.some(n => n && n.name === person)) {
                category.nominees.push(crearNominado(person));
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
async function saveData() {
    try {
        const dataToSave = {
            categories: appData.categories || [],
            phase: appData.phase || 'nominations',
            photoUrls: appData.photoUrls || {}
        };
        
        console.log("💾 Guardando datos en localStorage...");
        localStorage.setItem('premiosData', JSON.stringify(dataToSave));
        console.log("✅ Datos guardados en localStorage:", dataToSave.categories.length, "categorías");
        
        // Intentar guardar en Firebase
        if (typeof saveDataToFirebase === 'function') {
            console.log("🔥 Intentando guardar en Firebase...");
            try {
                await saveDataToFirebase();
                console.log("✅ Datos guardados en Firebase");
            } catch (firebaseError) {
                console.warn("⚠️ Error Firebase, pero guardado en localStorage:", firebaseError.message);
            }
        }
        
        updateStats();
        return true;
    } catch (error) {
        console.error("❌ Error crítico en saveData:", error);
        return false;
    }
}

async function saveUsers() {
    try {
        const usersToSave = appData.users || [];
        console.log("👥 Guardando usuarios:", usersToSave.length);
        
        localStorage.setItem('premiosUsers', JSON.stringify(usersToSave));
        
        // Intentar guardar en Firebase
        if (typeof saveUsersToFirebase === 'function') {
            try {
                await saveUsersToFirebase();
                console.log("✅ Usuarios guardados en Firebase");
            } catch (firebaseError) {
                console.warn("⚠️ Error Firebase usuarios:", firebaseError.message);
            }
        }
        
        updateVotersList();
        return true;
    } catch (error) {
        console.error("❌ Error en saveUsers:", error);
        return false;
    }
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
// ===== RENDERIZAR CATEGORÍAS (SOLO TU VOTO) =====
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
        
        const card = document.createElement('div');
        card.className = 'category-card';
        
        // CORRECCIÓN: Comprobar fase actual para decidir el comportamiento
        card.onclick = () => {
            if (appData.phase === 'results') {
                showCategoryResults(category.id);
            } else {
                openVoteModal(category.id);
            }
        };
        
        // VERSIÓN CENTRADA
        card.innerHTML = `
            <h3>${category.name || 'Sin nombre'}</h3>
            <div class="vote-count-centered">${totalVotes} votos</div>
            <p class="category-description">${category.description || ''}</p>
            ${userVote ? `<div class="user-vote-indicator">✅ Tu voto: ${userVote.nomineeName || 'Anónimo'}</div>` : ''}
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
    // Si estamos en fase resultados, mostrar resultados
    if (appData.phase === 'results') {
        showCategoryResults(categoryId);
        return;
    }
    
    // Verificar que el usuario esté logueado
    if (!appData.currentUser) {
        alert('Por favor, identifícate primero');
        return;
    }
    
    currentCategoryId = categoryId;
    const category = appData.categories.find(c => c && c.id === categoryId);
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    const votingContainer = document.getElementById('votingContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!category) {
        alert('Error: Categoría no encontrada');
        return;
    }
    
    // Configurar modo VOTACIÓN
    modal.classList.remove('results-mode');
    votingContainer.classList.add('active');
    resultsContainer.classList.remove('active');
    resultsContainer.style.display = 'none';
    votingContainer.style.display = 'block';
    
    // Mostrar sección de añadir nominado
    const addSection = document.querySelector('.add-nominee-section');
    if (addSection) {
        addSection.style.display = 'block';
    }
    
    modalCategory.innerHTML = `${category.name}<br><small>${category.description || ''}</small>`;
    nomineesList.innerHTML = '';
    
    const userVotes = appData.currentUser.votes || {};
    const userVote = userVotes[categoryId];
    
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n)
        .sort((a, b) => a.name.localeCompare(b.name));
    
    sortedNominees.forEach(nominee => {
        const isVoted = userVote && userVote.nomineeName === nominee.name;
        const voters = nominee.voters || [];
        const hasVoted = voters.includes(appData.currentUser.id);
        const photoUrl = nominee.photo || (appData.photoUrls && appData.photoUrls[nominee.name]);
        
        const nomineeItem = document.createElement('div');
        nomineeItem.className = `nominee-item ${isVoted ? 'voted' : ''}`;
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        
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
            ${hasVoted ? '<div class="voted-check">⭐ Tú votaste aquí</div>' : ''}
            ${isVoted ? '<div class="voted-check">✅ Tu voto actual</div>' : ''}
        `;
        
        // Añadir frases existentes (solo para Frase del Año)
        if (category.id === 17 && nominee.frases && Object.keys(nominee.frases).length > 0) {
            const frasesDiv = document.createElement('div');
            frasesDiv.className = 'existing-frases';
            frasesDiv.style.marginTop = '10px';
            frasesDiv.style.padding = '8px';
            frasesDiv.style.background = 'rgba(255, 215, 0, 0.1)';
            frasesDiv.style.borderRadius = '5px';
            frasesDiv.style.fontSize = '12px';
            
            let frasesText = '<strong>💬 Frases añadidas:</strong><br>';
            let contador = 0;
            
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
        
        nomineesList.appendChild(nomineeItem);
    });
    
    // Limpiar preview de foto
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('newNomineeName').value = '';
    photoPreviewFile = null;
    
    // Mostrar modal
    modal.style.display = 'block';
}
    
// ===== VOTAR POR UN NOMINADO CON FRASE =====

function voteForNominee(nomineeName) {
    console.log("🔴 voteForNominee LLAMADA con:", nomineeName);
    
    if (!appData.currentUser) {
        alert('Por favor, identifícate primero');
        return;
    }
    
    const category = appData.categories.find(c => c && c.id === currentCategoryId);
    if (!category) {
        alert('Error: Categoría no encontrada');
        return;
    }
    
    console.log("🗳️ VOTANDO EN CATEGORÍA:", category.id, category.name);
    
    const nominees = category.nominees || [];
    const nominee = nominees.find(n => n && n.name === nomineeName);
    if (!nominee) {
        alert('Error: Nominado no encontrado');
        return;
    }
    
    // ===== SISTEMA DE FRASES (CATEGORÍAS 6 y 17) =====
    let fraseUsuario = '';
    
    // VERIFICACIÓN para categorías que requieren frase (6: Dúo, 17: Frase del Año)
    console.log("🔍 CATEGORÍA ID:", category.id, "¿Requiere frase?", category.id === 6 || category.id === 17);
    
    if (category.id === 6 || category.id === 17) {
        console.log("📝 MOSTRANDO PROMPT PARA FRASE...");
        showFraseModal(category.id, nomineeName, category.name);
        return; // Salimos aquí, continuará cuando el usuario envíe el modal
    }
    
    // ===== PROCESAR VOTO SIN FRASE =====
    processVote(category, nominee, nomineeName, '');
}

// ===== NUEVA FUNCIÓN: MODAL PARA FRASES (MEJORADO) =====
function showFraseModal(categoryId, nomineeName, categoryName) {
    // Crear modal para frases
    const fraseModal = document.createElement('div');
    fraseModal.id = 'fraseModal';
    fraseModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(15, 15, 25, 0.99));
        padding: 40px;
        border-radius: 25px;
        max-width: 600px;
        width: 90%;
        border: 3px solid var(--gold);
        box-shadow: 0 0 60px rgba(255, 215, 0, 0.4);
        text-align: center;
        animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    
    // Configurar mensaje según categoría
    let title = '';
    let promptMessage = '';
    let placeholder = '';
    let examples = '';
    
    if (categoryId === 6) {
        // Categoría 6: Dúo Dinámico
        title = '👯‍♂️ MEJOR DÚO';
        promptMessage = `Estás votando a <strong style="color: var(--gold);">${nomineeName}</strong> para "Mejor Dúo".<br><br>Por favor, escribe el nombre del <strong>DUO COMPLETO</strong> (incluyendo a la persona que votas y a su pareja):`;
        placeholder = `Ej: ${nomineeName} y [nombre del compañero/a]`;
        examples = `
            <div style="
                background: rgba(255, 215, 0, 0.1);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 3px solid var(--gold);
                text-align: left;
            ">
                <strong style="color: var(--gold);">📝 Ejemplos:</strong>
                <ul style="margin: 10px 0 0 20px; color: var(--silver);">
                    <li>"${nomineeName} y Brais"</li>
                    <li>"${nomineeName} y Amalia"</li>
                    <li>"${nomineeName} y Carlita"</li>
                    <li>"El dúo de ${nomineeName} y Daniel"</li>
                </ul>
            </div>
        `;
    } else if (categoryId === 17) {
        // Categoría 17: Frase del Año
        title = '📝 FRASE DEL AÑO';
        promptMessage = `Estás votando a <strong style="color: var(--gold);">${nomineeName}</strong> para "Frase del Año".<br><br>Por favor, escribe la <strong>FRASE ICÓNICA</strong> que dijo (o por la que es famoso/a):`;
        placeholder = 'Ej: "Mejor me voy a mi casa"';
        examples = `
            <div style="
                background: rgba(255, 215, 0, 0.1);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 3px solid var(--gold);
                text-align: left;
            ">
                <strong style="color: var(--gold);">📝 Ejemplos:</strong>
                <ul style="margin: 10px 0 0 20px; color: var(--silver);">
                    <li>"Mejor me voy a mi casa"</li>
                    <li>"Esto es una puta mierda"</li>
                    <li>"No me toques los huevos"</li>
                    <li>"Vamos a tomar algo y se arregla todo"</li>
                </ul>
            </div>
        `;
    }
    
    modalContent.innerHTML = `
        <h2 style="color: var(--gold); margin-bottom: 20px; font-size: 2rem;">
            ${title}
        </h2>
        
        <div style="color: var(--silver); margin-bottom: 25px; line-height: 1.6; font-size: 1.1rem;">
            ${promptMessage}
        </div>
        
        ${examples}
        
        <textarea id="fraseInput" 
                  placeholder="${placeholder}"
                  style="
                    width: 100%;
                    height: 120px;
                    padding: 20px;
                    border: 2px solid var(--gold);
                    border-radius: 15px;
                    background: rgba(0, 0, 0, 0.4);
                    color: white;
                    font-size: 1.2rem;
                    resize: vertical;
                    margin: 25px 0;
                    outline: none;
                    font-family: inherit;
                    transition: all 0.3s ease;
                  "
                  onfocus="this.style.borderColor='var(--neon-blue)'; this.style.boxShadow='0 0 20px rgba(0, 243, 255, 0.3)';"
                  onblur="this.style.borderColor='var(--gold)'; this.style.boxShadow='none';"
                  onkeydown="if(event.key === 'Enter' && !event.shiftKey) {event.preventDefault(); submitFrase('${categoryId}', '${nomineeName}');}"></textarea>
        
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button onclick="submitFrase('${categoryId}', '${nomineeName}')" 
                    id="submitFraseBtn"
                    style="
                        background: linear-gradient(45deg, var(--gold), var(--gold-dark));
                        color: black;
                        border: none;
                        padding: 18px 50px;
                        border-radius: 15px;
                        font-size: 1.2rem;
                        cursor: pointer;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        transition: all 0.3s ease;
                        min-width: 200px;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 10px 30px rgba(255, 215, 0, 0.5)';"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                <i class="fas fa-check-circle"></i> Enviar Voto
            </button>
            
            <button onclick="cancelFrase()" 
                    style="
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--silver);
                        border: 2px solid var(--silver);
                        padding: 18px 50px;
                        border-radius: 15px;
                        font-size: 1.2rem;
                        cursor: pointer;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        transition: all 0.3s ease;
                        min-width: 200px;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 10px 30px rgba(192, 192, 192, 0.3)';"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                <i class="fas fa-times-circle"></i> Cancelar
            </button>
        </div>
        
        <div style="margin-top: 25px; color: #aaa; font-size: 0.9rem; font-style: italic;">
            Presiona Enter para enviar, Shift+Enter para nueva línea
        </div>
    `;
    
    fraseModal.appendChild(modalContent);
    document.body.appendChild(fraseModal);
    
    // Enfocar el textarea automáticamente
    setTimeout(() => {
        const textarea = document.getElementById('fraseInput');
        if (textarea) {
            textarea.focus();
            
            // Si es dúo, sugerir nombres automáticamente
            if (categoryId === 6) {
                const suggestions = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", 
                                   "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
                // Quitar el nombre actual de las sugerencias
                const otherSuggestions = suggestions.filter(name => 
                    name.toLowerCase() !== nomineeName.toLowerCase()
                );
                
                if (otherSuggestions.length > 0) {
                    // Añadir placeholder más específico
                    textarea.placeholder = `${nomineeName} y ${otherSuggestions[0]}`;
                    
                    // Añadir datalist para autocompletar
                    const datalist = document.createElement('datalist');
                    datalist.id = 'duoSuggestions';
                    
                    otherSuggestions.forEach(suggestion => {
                        const option = document.createElement('option');
                        option.value = `${nomineeName} y ${suggestion}`;
                        datalist.appendChild(option);
                    });
                    
                    document.body.appendChild(datalist);
                    textarea.setAttribute('list', 'duoSuggestions');
                }
            }
        }
    }, 100);
}

// ===== FUNCIÓN PARA ENVIAR FRASE =====
function submitFrase(categoryId, nomineeName) {
    const fraseInput = document.getElementById('fraseInput');
    if (!fraseInput) return;
    
    let fraseUsuario = fraseInput.value.trim();
    
    // Validaciones específicas por categoría
    if (categoryId == 6) {
        // Validación para Dúo Dinámico
        if (!fraseUsuario) {
            alert('❌ Por favor, escribe el nombre del dúo completo.\n\nEjemplo: "' + nomineeName + ' y [nombre del compañero/a]"');
            fraseInput.focus();
            return;
        }
        
        // Verificar que mencione al menos al votado
        if (!fraseUsuario.toLowerCase().includes(nomineeName.toLowerCase())) {
            const confirmar = confirm(`⚠️ El dúo que escribiste no menciona a ${nomineeName}.\n\n¿Estás seguro de que quieres votar por este dúo?`);
            if (!confirmar) {
                fraseInput.focus();
                return;
            }
        }
        
        // Verificar formato básico (debe tener "y" o "&" para indicar dúo)
        if (!fraseUsuario.includes(' y ') && !fraseUsuario.includes('&') && !fraseUsuario.toLowerCase().includes('duo') && !fraseUsuario.toLowerCase().includes('dúo')) {
            const confirmar = confirm(`⚠️ El formato no parece un dúo claro.\n\nRecomendado: "${nomineeName} y [otra persona]"\n\n¿Quieres corregirlo?`);
            if (confirmar) {
                fraseInput.focus();
                return;
            }
        }
        
    } else if (categoryId == 17) {
        // Validación para Frase del Año
        if (!fraseUsuario) {
            const confirmar = confirm("⚠️ ¿Votar sin añadir frase?\n\n(Puedes votar sin frase, pero es más divertido con una)");
            if (!confirmar) {
                fraseInput.focus();
                return;
            }
        }
        
        // Verificar longitud mínima si hay frase
        if (fraseUsuario && fraseUsuario.length < 3) {
            alert('❌ La frase es demasiado corta. Escribe algo más elaborado.');
            fraseInput.focus();
            return;
        }
    }
    
    // Cerrar modal
    cancelFrase();
    
    // Obtener datos actualizados
    const category = appData.categories.find(c => c && c.id == categoryId);
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
    
    // Procesar el voto con la frase
    processVote(category, nominee, nomineeName, fraseUsuario);
}

// ===== FUNCIÓN PARA CANCELAR FRASE =====
function cancelFrase() {
    const fraseModal = document.getElementById('fraseModal');
    if (fraseModal) {
        // Eliminar datalist si existe
        const datalist = document.getElementById('duoSuggestions');
        if (datalist) datalist.remove();
        
        fraseModal.remove();
    }
}

// ===== FUNCIÓN PARA PROCESAR VOTO (MODIFICADA PARA FRASES) =====
function processVote(category, nominee, nomineeName, fraseUsuario) {
    console.log("🔄 PROCESANDO VOTO...");
    
    const nominees = category.nominees || [];
    
    if (!appData.currentUser.votes) appData.currentUser.votes = {};
    if (!nominee.voters) nominee.voters = [];
    if (!nominee.frases) nominee.frases = {};
    
    // 1. ELIMINAR VOTO ANTERIOR (si existe)
    if (appData.currentUser.votes[category.id]) {
        const previousVote = appData.currentUser.votes[category.id];
        console.log("🗑️ Eliminando voto anterior:", previousVote);
        
        const previousNominee = nominees.find(n => n && n.name === previousVote.nomineeName);
        if (previousNominee) {
            // Restar voto
            previousNominee.votes = Math.max(0, (previousNominee.votes || 1) - 1);
            // Eliminar de votantes
            previousNominee.voters = (previousNominee.voters || []).filter(v => v !== appData.currentUser.id);
            // Eliminar frase si existe
            if (previousNominee.frases && previousNominee.frases[appData.currentUser.id]) {
                delete previousNominee.frases[appData.currentUser.id];
                console.log("🗑️ Frase anterior eliminada");
            }
        }
    }
    
    // 2. GUARDAR NUEVO VOTO
    appData.currentUser.votes[category.id] = {
        nomineeName: nomineeName,
        frase: fraseUsuario || null,
        timestamp: new Date().toISOString()
    };
    
    // 3. ACTUALIZAR NOMINADO
    nominee.votes = (nominee.votes || 0) + 1;
    
    if (!nominee.voters.includes(appData.currentUser.id)) {
        nominee.voters.push(appData.currentUser.id);
    }
    
    // 4. GUARDAR FRASE (si existe y es válida)
    if (fraseUsuario && fraseUsuario.trim() !== '') {
        nominee.frases[appData.currentUser.id] = {
            frase: fraseUsuario,
            voter: appData.currentUser.name,
            timestamp: new Date().toISOString(),
            tipo: category.id === 6 ? 'duo' : 'frase' // Identificar tipo de frase
        };
        console.log("💾 Frase guardada:", fraseUsuario.substring(0, 50));
    }
    
    console.log("✅ Voto completado para", nomineeName, "- Votos totales:", nominee.votes);
    
    // 5. GUARDAR EN BASE DE DATOS
    (async () => {
        try {
            console.log("💾 Guardando voto completo...");
            
            // Primero guardar en localStorage
            localStorage.setItem('premiosData', JSON.stringify({
                categories: appData.categories,
                phase: appData.phase,
                photoUrls: appData.photoUrls
            }));
            
            localStorage.setItem('premiosUsers', JSON.stringify(appData.users || []));
            
            console.log("✅ Voto guardado en localStorage");
            
            // Luego intentar guardar en Firebase
            if (typeof saveCompleteVote === 'function') {
                try {
                    await saveCompleteVote();
                    console.log("✅ Voto guardado en Firebase");
                } catch (firebaseError) {
                    console.warn("⚠️ Error en Firebase, pero voto guardado localmente:", firebaseError.message);
                }
            }
            
        } catch (error) {
            console.error("❌ Error crítico guardando:", error);
            alert("⚠️ Hubo un problema guardando el voto. Por favor, intenta de nuevo.");
        }
    })();
    
    // 6. MOSTRAR CONFIRMACIÓN ESPECÍFICA POR CATEGORÍA
    let mensajeConfirmacion = '';
    
    if (category.id === 6) {
        // Confirmación para Dúo Dinámico
        if (fraseUsuario && fraseUsuario.trim() !== '') {
            mensajeConfirmacion = `✅ ¡Voto registrado!\n\nHas votado a ${nomineeName} para "Mejor Dúo"\n\nDúo registrado:\n"${fraseUsuario}"`;
        } else {
            mensajeConfirmacion = `✅ ¡Voto registrado!\nHas votado a ${nomineeName} para "Mejor Dúo" (sin especificar dúo)`;
        }
    } else if (category.id === 17) {
        // Confirmación para Frase del Año
        if (fraseUsuario && fraseUsuario.trim() !== '') {
            mensajeConfirmacion = `✅ ¡Voto registrado!\n\nHas votado a ${nomineeName} para "Frase del Año"\n\nFrase añadida:\n"${fraseUsuario}"`;
        } else {
            mensajeConfirmacion = `✅ ¡Voto registrado!\nHas votado a ${nomineeName} para "Frase del Año" (sin frase)`;
        }
    } else {
        mensajeConfirmacion = `✅ ¡Voto registrado!\nHas votado por ${nomineeName} en "${category.name}"`;
    }
    
    alert(mensajeConfirmacion);
    
    // 7. ACTUALIZAR INTERFAZ
    renderCategories();
    openVoteModal(currentCategoryId); // Recargar modal
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
    const modal = document.getElementById('voteModal');
    const votingContainer = document.getElementById('votingContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const addSection = document.querySelector('.add-nominee-section');
    
    if (modal) {
        modal.classList.remove('results-mode');
        modal.style.display = 'none';
    }
    
    // Resetear contenedores
    if (votingContainer) {
        votingContainer.style.display = 'block';
        votingContainer.classList.add('active');
        votingContainer.innerHTML = `
            <div class="nominees-grid" id="nomineesList">
                <!-- Se recargará cuando sea necesario -->
            </div>
        `;
    }
    
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.classList.remove('active');
        // LIMPIAR TODO el contenido
        resultsContainer.innerHTML = `
            <div id="resultsList"></div>
        `;
    }
    
    if (addSection) {
        addSection.style.display = 'block';
    }
    
    // Resetear variables de revelación
    currentRevelationStep = 0;
    categoryForRevelation = null;
    top3Nominees = [];
    window.allVotesData = null;
    
    // Eliminar elementos creados dinámicamente
    const elementsToRemove = [
        '.confetti-container',
        '.firework',
        '.spotlight',
        '.curtain-container',
        '.buttons-container-final',
        '#detailsContainer',
        '#allVotesContainer',
        '#backToWinnersButton',
        '#winnerCurtain', // <-- Añade esto
        '#finalCountdown' // <-- Y esto
    ];
    
    elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    });
}

function updatePhaseBanner() {
    const banner = document.getElementById('phaseBanner');
    const text = document.getElementById('phaseText');
    const resultsButton = document.getElementById('resultsButton');
    
    if (!banner || !text) return;
    
    switch(appData.phase) {
        case 'nominations':
            banner.style.background = 'linear-gradient(90deg, #FF416C, #FF4B2B)';
            text.textContent = '🎯 FASE DE NOMINACIONES - Vota por tus amigos';
            if (resultsButton) resultsButton.style.display = 'none';
            break;
        case 'voting':
            banner.style.background = 'linear-gradient(90deg, #2196F3, #21CBF3)';
            text.textContent = '⭐ FASE FINAL - Vota entre los 3 más nominados';
            if (resultsButton) resultsButton.style.display = 'none';
            break;
        case 'results':
            banner.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            text.textContent = '🏆 RESULTADOS FINALES - ¡Haz clic en una categoría para ver resultados!';
            document.body.classList.add('phase-results');
            if (resultsButton) {
                resultsButton.style.display = 'flex';
                // Añadir clase para animación
                banner.classList.add('phase-results');
            }
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

// ===== VER RESULTADOS (PARA USUARIOS NORMALES) =====
function verResultadosUsuarios() {
    if (appData.phase !== 'results') {
        alert('⚠️ Los resultados aún no están disponibles.\n\nEstamos en fase de ' + 
              (appData.phase === 'nominations' ? 'nominaciones' : 'votación final') + 
              '.\n\nEspera a que el admin active los resultados finales.');
        return;
    }
    
    showResults();
}


// ===== VERSIÓN CENTRADA - RESULTADOS POR CATEGORÍA =====
function showCategoryResults(categoryId) {
    console.log("🎯 Mostrando resultados para categoría:", categoryId);
    
    const category = appData.categories.find(c => c && c.id === categoryId);
    if (!category) return;
    
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const resultsList = document.getElementById('resultsList');
    const votingContainer = document.getElementById('votingContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!modal || !modalCategory || !resultsList) return;
    
    // Configurar modo RESULTADOS
    modal.classList.add('results-mode');
    votingContainer.classList.remove('active');
    resultsContainer.classList.add('active');
    votingContainer.style.display = 'none';
    resultsContainer.style.display = 'flex';
    
    // PANTALLA DE REVELACIÓN INICIAL
    resultsList.innerHTML = `
        <div class="reveal-screen">
            <div class="reveal-trophy">🏆</div>
            <h1 class="reveal-title">¡REVELACIÓN DE GANADORES!</h1>
            <p class="reveal-subtitle">
                ${category.name}<br>
                <small>${category.description || ''}</small>
            </p>
            
            <div class="reveal-progress">
                <div class="reveal-progress-bar" id="revealProgress"></div>
            </div>
            
            <button class="btn-reveal" id="revealButton" onclick="revealWinners(${categoryId})">
                <i class="fas fa-play-circle"></i> REVELAR GANADORES
            </button>
            
            <div id="detailsContainer" class="details-container">
                <!-- Aquí irán los detalles después de la revelación -->
            </div>
        </div>
    `;
    
    // Mostrar modal
    modal.style.display = 'block';
    
    console.log("🎯 Pantalla de revelación preparada");
}

// ===== NUEVA FUNCIÓN: REVELAR GANADORES =====
async function revealWinners(categoryId) {
    console.log("🎉 Revelando ganadores...");
    
    const category = appData.categories.find(c => c && c.id === categoryId);
    if (!category) return;
    
    const revealButton = document.getElementById('revealButton');
    const revealProgress = document.getElementById('revealProgress');
    const resultsList = document.getElementById('resultsList');
    
    if (!revealButton || !resultsList) return;
    
    // Deshabilitar botón y mostrar progreso
    revealButton.disabled = true;
    revealButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PREPARANDO...';
    
    // Animación de progreso
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        revealProgress.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            startRevelation(category);
        }
    }, 150);
}

// ===== FUNCIÓN PARA LA REVELACIÓN ESPECTACULAR =====
let currentRevelationStep = 0;
let categoryForRevelation = null;
let top3Nominees = [];

// ===== FUNCIÓN MODIFICADA CON TELÓN DOBLE =====
async function startRevelation(category) {
    console.log("✨ Iniciando revelación escalonada...");
    
    categoryForRevelation = category;
    
    // Obtener top 3 y ORDENARLOS CORRECTAMENTE (3º, 2º, 1º)
    const nominees = category.nominees || [];
    
    // Primero ordenar de mayor a menor votos
    const sortedByVotes = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    // Preparar lista completa de votos para mostrar después
    const allNomineesWithVotes = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .map((nominee, index) => ({
            ...nominee,
            position: index + 1,
            medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯'
        }));
    
    // Guardar para usar después
    window.allVotesData = allNomineesWithVotes;
    
    // Para revelación: 3º, 2º, 1º
    top3Nominees = [
        sortedByVotes[2], // Tercer lugar
        sortedByVotes[1], // Segundo lugar  
        sortedByVotes[0]  // Primer lugar
    ].filter(n => n); // Filtrar en caso de que no haya 3
    
    console.log("🎯 Orden de revelación:", 
        top3Nominees.map((n, i) => `${['3º', '2º', '1º'][i]} - ${n.name} (${n.votes} votos)`));
    
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;
    
    // 1. CREAR ESCENARIO CON TELÓN DOBLE
    resultsList.innerHTML = `
        <div class="stage">
            <!-- Luces del escenario -->
            <div class="stage-lights">
                ${Array.from({length: 15}).map((_, i) => 
                    `<div class="stage-light" style="animation-delay: ${i * 0.2}s"></div>`
                ).join('')}
            </div>
            
            <!-- TELÓN DOBLE -->
            <div class="curtain-container" id="stageCurtain">
                <div class="curtain-left">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 3rem; color: var(--gold); margin-bottom: 20px;">🎭</div>
                        <div style="color: white; font-size: 1.5rem; font-weight: bold;">IZQUIERDA</div>
                    </div>
                </div>
                <div class="curtain-right">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 3rem; color: var(--gold); margin-bottom: 20px;">🎭</div>
                        <div style="color: white; font-size: 1.5rem; font-weight: bold;">DERECHA</div>
                    </div>
                </div>
            </div>
            
            <!-- Contenido principal DEL ESCENARIO (detrás del telón) -->
            <div style="position: relative; z-index: 1; width: 100%; min-height: 500px; padding: 40px 20px;">
                <!-- Contador dramático -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="reveal-counter" id="dramaticCounter">3</div>
                    <h1 class="dramatic-text">¡EL ESPECTÁCULO VA A COMENZAR!</h1>
                    <p class="reveal-message" id="curtainMessage">
                        El telón se abrirá en...
                    </p>
                </div>
                
                <!-- Área principal para los ganadores -->
                <div id="mainContentArea" style="display: none;">
                    <!-- Mensaje actual -->
                    <div class="reveal-message" id="currentMessage">
                        ¿Estás listo para descubrir el TERCER lugar?
                    </div>
                    
                    <!-- Contenedor del ganador actual -->
                    <div id="currentWinnerContainer" style="
                        min-height: 300px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        margin: 30px 0;
                    ">
                        <!-- Aquí aparecerá cada ganador en orden: 3º, 2º, 1º -->
                    </div>
                    
                    <!-- Botón para siguiente revelación -->
                    <button class="btn-next-reveal" id="nextRevealButton" onclick="revealNextWinner()">
                        <i class="fas fa-play-circle"></i> REVELAR TERCER LUGAR
                    </button>
                    
                    <!-- Indicador de progreso -->
                    <div style="margin-top: 40px; display: flex; justify-content: center; gap: 15px;">
                        ${top3Nominees.map((_, index) => `
                            <div class="progress-step" style="
                                width: 30px;
                                height: 30px;
                                border-radius: 50%;
                                background: rgba(255,255,255,0.1);
                                border: 3px solid var(--gold);
                                transition: all 0.5s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: var(--silver);
                                font-weight: bold;
                                font-size: 0.9rem;
                            ">${['3º', '2º', '1º'][index]}</div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Contenedor para TODOS los votos (inicialmente oculto) -->
                <div id="allVotesContainer" class="all-votes-container" style="display: none; margin-top: 50px;">
                    <!-- Aquí se cargarán todos los votos después -->
                </div>
            </div>
        </div>
    `;
    
    // Iniciar cuenta regresiva dramática
    await startDramaticCountdown();
}

// ===== CUENTA REGRESIVA DRAMÁTICA CON TELÓN DOBLE =====
async function startDramaticCountdown() {
    const counter = document.getElementById('dramaticCounter');
    const curtainContainer = document.getElementById('stageCurtain');
    const curtainMessage = document.getElementById('curtainMessage');
    const mainContentArea = document.getElementById('mainContentArea');
    
    if (!counter || !curtainContainer) return;
    
    // Cuenta regresiva 3, 2, 1...
    for (let i = 3; i > 0; i--) {
        counter.textContent = i;
        curtainMessage.textContent = `El telón se abrirá en ${i}...`;
        
        // Agregar efecto de golpe de tambor visual
        counter.style.animation = 'drumRoll 0.3s ease-out';
        
        // Crear sonido de tambor visual
        createDrumEffect();
        
        await delay(800);
        
        // Resetear animación
        counter.style.animation = '';
    }
    
    // ¡CERO!
    counter.textContent = '🎭';
    counter.style.fontSize = '6rem';
    curtainMessage.textContent = '¡ABRIENDO TELÓN!';
    
    // Efectos especiales
    createMultipleFireworks();
    createConfettiRain();
    
    // ABRIR TELÓN DOBLE
    curtainContainer.classList.add('open');
    
    // Esperar a que se abra el telón
    await delay(1800);
    
    // Ocultar telón después de abrirse
    curtainContainer.style.display = 'none';
    
    // Mostrar contenido principal
    if (mainContentArea) {
        mainContentArea.style.display = 'block';
        mainContentArea.style.animation = 'fadeInUp 1s ease-out forwards';
    }
    
    // Ocultar contador
    counter.style.display = 'none';
    curtainMessage.style.display = 'none';
    
    // Preparar primer paso
    currentRevelationStep = 0;
    updateRevelationStep();
}

// ===== REVELAR SIGUIENTE GANADOR CON TELÓN PARA EL 1º LUGAR =====
async function revealNextWinner() {
    if (currentRevelationStep >= top3Nominees.length) {
        showDetailsButtonAfterRevelation();
        return;
    }
    
    const nextButton = document.getElementById('nextRevealButton');
    const message = document.getElementById('currentMessage');
    const winnerContainer = document.getElementById('currentWinnerContainer');
    
    if (!nextButton || !message || !winnerContainer) return;
    
    // Deshabilitar botón temporalmente
    nextButton.disabled = true;
    nextButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REVELANDO...';
    
    // Definir orden: 0=3º, 1=2º, 2=1º
    const positions = ['TERCER', 'SEGUNDO', 'PRIMER'];
    const positionNames = ['TERCER LUGAR', 'SEGUNDO LUGAR', '¡GANADOR ABSOLUTO!'];
    const emojis = ['🥉', '🥈', '🥇'];
    const colors = ['var(--bronze)', 'var(--silver)', 'var(--gold)'];
    
    const currentPosition = currentRevelationStep;
    
    // Mensaje dramático
    message.innerHTML = `
        <span style="color: ${colors[currentPosition]}; font-weight: bold; font-size: 1.8rem;">
            ${positionNames[currentPosition]}
        </span>
        <div style="color: var(--silver); margin-top: 10px; font-size: 1.2rem;">
            ¡El ${positions[currentPosition].toLowerCase()} puesto va para...!
        </div>
    `;
    
    // Crear efectos visuales según el puesto
    if (currentPosition === 0) {
        // Tercer lugar - confeti suave
        createGentleConfetti();
        await delay(500);
        
        nextButton.innerHTML = `<i class="fas fa-forward"></i> REVELAR SEGUNDO LUGAR`;
        
    } else if (currentPosition === 1) {
        // Segundo lugar - confeti abundante
        createAbundantConfetti();
        await delay(700);
        
        nextButton.innerHTML = `<i class="fas fa-crown"></i> ¡REVELAR GANADOR!`;
        
    } else if (currentPosition === 2) {
        // Primer lugar - ESPECTÁCULO COMPLETO CON TELÓN
        message.innerHTML = `
            <div class="dramatic-text" style="font-size: 2.5rem;">
                🏆 ¡EL MOMENTO MÁS ESPERADO! 🏆
            </div>
            <div style="color: var(--silver); margin-top: 15px; font-size: 1.3rem;">
                El primer lugar, el ganador absoluto...
            </div>
        `;
        
        // Pausa dramática
        await delay(1500);
        
        // APAGAR LUCES para crear suspense
        document.querySelectorAll('.stage-light').forEach(light => {
            light.style.opacity = '0.1';
            light.style.animationPlayState = 'paused';
        });
        
        // Mensaje de suspense
        message.innerHTML = `
            <div style="text-align: center; margin: 40px 0;">
                <div style="font-size: 4rem; color: var(--gold); animation: pulseGold 1s infinite;">⏳</div>
                <div style="color: var(--silver); font-size: 1.5rem; margin-top: 20px;">
                    Preparando la gran revelación...
                </div>
            </div>
        `;
        
        await delay(2000);
        
        // CREAR TELÓN PARA EL GANADOR
        createWinnerCurtain();
        
        // Esperar a que se cree el telón
        await delay(1000);
        
        // Mensaje final antes de abrir
        message.innerHTML = `
            <div class="dramatic-text" style="font-size: 3rem;">
                ¡ABRIENDO TELÓN!
            </div>
        `;
        
        // Contador dramático
        const countdownDiv = document.createElement('div');
        countdownDiv.style.cssText = `
            font-size: 5rem;
            font-weight: bold;
            color: var(--gold);
            margin: 30px 0;
            animation: drumRoll 0.5s infinite;
        `;
        countdownDiv.id = 'finalCountdown';
        message.parentNode.insertBefore(countdownDiv, message.nextSibling);
        
        // Cuenta regresiva 3, 2, 1...
        for (let i = 3; i > 0; i--) {
            countdownDiv.textContent = i;
            createDrumEffect();
            await delay(800);
        }
        
        countdownDiv.textContent = '🎭';
        
        // ABRIR TELÓN
        openWinnerCurtain();
        
        // Efectos especiales MÁXIMOS
        createEpicFireworks();
        createSpotlight();
        createConfettiRain();
        
        // Reactivar luces
        setTimeout(() => {
            document.querySelectorAll('.stage-light').forEach(light => {
                light.style.opacity = '1';
                light.style.animationPlayState = 'running';
                light.style.animationDuration = '0.3s';
            });
        }, 500);
        
        await delay(2000);
        
        nextButton.innerHTML = `<i class="fas fa-trophy"></i> VER DETALLES COMPLETOS`;
    }
    
    // Revelar el ganador
    const nominee = top3Nominees[currentPosition];
    
    if (!nominee) return;
    
    winnerContainer.innerHTML = `
        <div class="winner-card" id="winnerCard${currentPosition}" 
             style="transform: scale(0); opacity: 0;">
            <div class="trophy-icon-large" style="color: ${colors[currentPosition]};">
                ${emojis[currentPosition]}
            </div>
            
            <div class="winner-name" style="
                font-size: ${currentPosition === 2 ? '3.5rem' : '2.5rem'};
                color: ${colors[currentPosition]};
                font-weight: bold;
                margin: 20px 0;
                text-shadow: 0 0 30px ${colors[currentPosition]}80;
            ">
                ${nominee.name.toUpperCase()}
            </div>
            
            <div style="
                font-size: ${currentPosition === 2 ? '3rem' : '2.2rem'};
                color: ${colors[currentPosition]};
                font-weight: bold;
                margin: 15px 0;
                background: rgba(255,255,255,0.1);
                padding: 10px 30px;
                border-radius: 50px;
                border: 2px solid ${colors[currentPosition]};
            ">
                ${nominee.votes || 0} VOTOS
            </div>
            
            <div style="
                color: ${colors[currentPosition]};
                font-weight: bold;
                font-size: 1.3rem;
                text-transform: uppercase;
                letter-spacing: 3px;
                margin-top: 15px;
                padding: 10px 25px;
                background: linear-gradient(45deg, 
                    ${colors[currentPosition]}20, 
                    ${colors[currentPosition]}10);
                border-radius: 10px;
                border: 1px solid ${colors[currentPosition]}40;
            ">
                ${positionNames[currentPosition]}
            </div>
            
            ${currentPosition === 2 ? `
                <div style="
                    margin-top: 40px;
                    padding: 20px 40px;
                    background: linear-gradient(45deg, 
                        rgba(255, 215, 0, 0.3), 
                        rgba(212, 175, 55, 0.2));
                    border: 3px solid var(--gold);
                    border-radius: 20px;
                    font-size: 1.8rem;
                    color: var(--gold);
                    font-weight: bold;
                    animation: pulseGold 2s infinite;
                ">
                    🎉 ¡FELICIDADES AL GANADOR! 🎉
                </div>
            ` : ''}
        </div>
    `;
    
    // Animación de revelación
    await delay(300);
    
    const winnerCard = document.getElementById(`winnerCard${currentPosition}`);
    const trophyIcon = winnerCard.querySelector('.trophy-icon-large');
    const winnerName = winnerCard.querySelector('.winner-name');
    
    if (winnerCard) {
        winnerCard.classList.add('revealed');
        
        setTimeout(() => {
            if (trophyIcon) {
                trophyIcon.classList.add('revealed');
                if (currentPosition === 2) {
                    trophyIcon.style.animation = 'trophyDrop 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulseGold 2s infinite 1.5s';
                }
            }
        }, 400);
        
        setTimeout(() => {
            if (winnerName) {
                winnerName.classList.add('revealed');
                if (currentPosition === 2) {
                    winnerName.style.animation = 'nameReveal 1.5s 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, textGlow 2s infinite 2s';
                }
            }
        }, 800);
    }
    
    // Actualizar progreso
    updateProgressSteps();
    
    // Preparar siguiente paso
    currentRevelationStep++;
    
    await delay(2000);
    
    if (currentRevelationStep < top3Nominees.length) {
        nextButton.disabled = false;
        const nextPosition = positions[currentRevelationStep];
        message.innerHTML = `
            <div style="text-align: center;">
                <div style="color: ${colors[currentRevelationStep]}; font-size: 1.5rem; font-weight: bold;">
                    ${currentRevelationStep === 1 ? '¡INCREÍBLE!' : '¡GENIAL!'}
                </div>
                <div style="color: var(--silver); margin-top: 15px;">
                    ¿Listo para descubrir el <span style="color: ${colors[currentRevelationStep]}; font-weight: bold;">
                    ${nextPosition} LUGAR</span>?
                </div>
            </div>
        `;
    } else {
        nextButton.disabled = false;
        nextButton.onclick = () => showDetails(categoryForRevelation.id);
        message.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin: 20px 0; color: var(--gold);">🏆🎊🏆</div>
                <div class="dramatic-text" style="font-size: 2rem;">
                    ¡REVELACIÓN COMPLETADA!
                </div>
            </div>
        `;
        
        // Eliminar contador si existe
        const countdownDiv = document.getElementById('finalCountdown');
        if (countdownDiv) countdownDiv.remove();
    }
}

// ===== ACTUALIZAR PASOS DE PROGRESO =====
function updateProgressSteps() {
    const progressSteps = document.querySelectorAll('.progress-step');
    const positionNames = ['3º', '2º', '1º'];
    const positionColors = ['var(--bronze)', 'var(--silver)', 'var(--gold)'];
    
    progressSteps.forEach((step, index) => {
        // Limpiar contenido anterior
        step.innerHTML = positionNames[index];
        step.style.cssText = `
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid var(--gold);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--silver);
            font-weight: bold;
            font-size: 0.9rem;
            transition: all 0.5s ease;
            position: relative;
        `;
        
        if (index < currentRevelationStep) {
            // Paso ya revelado
            step.style.background = positionColors[index];
            step.style.color = 'white';
            step.style.borderColor = positionColors[index];
            step.style.boxShadow = `0 0 15px ${positionColors[index]}`;
            step.style.transform = 'scale(1.2)';
            
        } else if (index === currentRevelationStep) {
            // Paso actual (próximo a revelar)
            step.style.background = 'rgba(255,255,255,0.9)';
            step.style.color = positionColors[index];
            step.style.borderColor = positionColors[index];
            step.style.animation = 'pulseGold 1s infinite';
            
        } else {
            // Paso futuro
            step.style.background = 'rgba(255,255,255,0.1)';
            step.style.color = 'var(--silver)';
            step.style.borderColor = 'var(--gold)';
            step.style.boxShadow = 'none';
            step.style.animation = 'none';
            step.style.transform = 'scale(1)';
        }
    });
}

// ===== MOSTRAR BOTÓN DE DETALLES DESPUÉS DE REVELACIÓN =====
function showDetailsButtonAfterRevelation() {
    const nextButton = document.getElementById('nextRevealButton');
    const message = document.getElementById('currentMessage');
    
    if (!nextButton || !message) return;
    
    // Ocultar botón original
    nextButton.style.display = 'none';
    
    // ELIMINAR contenedores anteriores si existen
    const existingButtonsContainer = document.querySelector('.buttons-container-final');
    if (existingButtonsContainer) {
        existingButtonsContainer.remove();
    }
    
    const existingAllVotesContainer = document.getElementById('allVotesContainer');
    if (existingAllVotesContainer) {
        existingAllVotesContainer.style.display = 'none';
    }
    
    // Crear NUEVO contenedor para botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container-final';
    buttonsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        margin-top: 30px;
        width: 100%;
    `;
    
    // 1. Botón para ver detalles estadísticos
    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn-next-reveal';
    detailsButton.innerHTML = '<i class="fas fa-chart-bar"></i> VER ESTADÍSTICAS DETALLADAS';
    detailsButton.onclick = () => {
        // Ocultar otros contenedores
        const allVotesContainer = document.getElementById('allVotesContainer');
        if (allVotesContainer) allVotesContainer.style.display = 'none';
        
        // Mostrar detalles
        showDetails(categoryForRevelation.id);
    };
    
    // 2. Botón para ver todos los votos
    const allVotesButton = document.createElement('button');
    allVotesButton.className = 'btn-show-all-votes';
    allVotesButton.innerHTML = '<i class="fas fa-list-ol"></i> VER CLASIFICACIÓN COMPLETA';
    allVotesButton.onclick = () => {
        // Ocultar detalles si están visibles
        const detailsContainer = document.getElementById('detailsContainer');
        if (detailsContainer) detailsContainer.style.display = 'none';
        
        // Mostrar votos
        showAllVotes();
        allVotesButton.style.display = 'none';
        
        // Mostrar botón para volver
        if (backToWinnersButton) backToWinnersButton.style.display = 'inline-flex';
    };
    
    // 3. Botón para volver a ver ganadores
    const backToWinnersButton = document.createElement('button');
    backToWinnersButton.className = 'btn-show-all-votes';
    backToWinnersButton.innerHTML = '<i class="fas fa-trophy"></i> VOLVER A GANADORES';
    backToWinnersButton.onclick = () => {
        // Ocultar contenedores de datos
        const allVotesContainer = document.getElementById('allVotesContainer');
        const detailsContainer = document.getElementById('detailsContainer');
        
        if (allVotesContainer) allVotesContainer.style.display = 'none';
        if (detailsContainer) detailsContainer.style.display = 'none';
        
        // Mostrar botones principales
        allVotesButton.style.display = 'inline-flex';
        backToWinnersButton.style.display = 'none';
    };
    backToWinnersButton.style.display = 'none';
    
    // Añadir botones al contenedor
    buttonsContainer.appendChild(detailsButton);
    buttonsContainer.appendChild(allVotesButton);
    buttonsContainer.appendChild(backToWinnersButton);
    
    // Añadir al DOM
    nextButton.parentNode.appendChild(buttonsContainer);
    
    // Actualizar mensaje
    message.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin: 20px 0; color: var(--gold);">🏆🎊🏆</div>
            <div class="dramatic-text" style="font-size: 2rem;">
                ¡REVELACIÓN COMPLETADA!
            </div>
            <p style="color: var(--silver); margin-top: 20px; font-size: 1.2rem;">
                Todos los ganadores han sido revelados
            </p>
        </div>
    `;
}

// ===== FUNCIONES DE EFECTOS VISUALES =====
function createDrumEffect() {
    const stage = document.querySelector('.stage');
    if (!stage) return;
    
    const drum = document.createElement('div');
    drum.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, 
            rgba(255, 215, 0, 0.3) 0%,
            transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: scaleUp 0.5s ease-out forwards;
        pointer-events: none;
        z-index: 5;
    `;
    
    stage.appendChild(drum);
    
    setTimeout(() => {
        if (drum.parentNode) drum.parentNode.removeChild(drum);
    }, 500);
}

function createGentleConfetti() {
    createConfettiEffect(50, 1.5, ['#CD7F32', '#FF8E53']);
}

function createAbundantConfetti() {
    createConfettiEffect(100, 2, ['#C0C0C0', '#FFD700', '#FF8E53']);
}

function createEpicFireworks() {
    // Crear múltiples fuegos artificiales
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            createFireworkEffect();
        }, i * 200);
    }
    
    // Confeti masivo
    createConfettiEffect(200, 3, ['#FFD700', '#C0C0C0', '#FF6B6B', '#4ECDC4', '#FF8E53']);
}

function createConfettiRain() {
    createConfettiEffect(80, 2.5, ['#FFD700', '#C0C0C0', '#CD7F32']);
}

function createConfettiEffect(count, duration, colors) {
    const stage = document.querySelector('.stage');
    if (!stage) return;
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.animationDuration = Math.random() * 1 + duration + 's';
            
            stage.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) confetti.parentNode.removeChild(confetti);
            }, (duration + 1) * 1000);
        }, i * 20);
    }
}

function createFireworkEffect() {
    const stage = document.querySelector('.stage');
    if (!stage) return;
    
    const firework = document.createElement('div');
    firework.className = 'firework';
    
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 60 + 20;
    
    firework.style.cssText = `
        --x: ${Math.random() * 100 - 50}px;
        --y: ${Math.random() * 100 - 50}px;
        left: ${x}%;
        top: ${y}%;
        background: ${['#FFD700', '#FF6B6B', '#4ECDC4', '#FF8E53'][Math.floor(Math.random() * 4)]};
        animation: firework 0.8s ease-out forwards;
    `;
    
    stage.appendChild(firework);
    
    setTimeout(() => {
        if (firework.parentNode) firework.parentNode.removeChild(firework);
    }, 800);
}

function createMultipleFireworks() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFireworkEffect();
        }, i * 300);
    }
}

function createSpotlight() {
    const winnerContainer = document.getElementById('currentWinnerContainer');
    if (!winnerContainer) return;
    
    const spotlight = document.createElement('div');
    spotlight.className = 'spotlight active';
    
    const rect = winnerContainer.getBoundingClientRect();
    const stageRect = document.querySelector('.stage').getBoundingClientRect();
    
    spotlight.style.left = (rect.left + rect.width/2 - stageRect.left - 150) + 'px';
    spotlight.style.top = (rect.top + rect.height/2 - stageRect.top - 150) + 'px';
    
    document.querySelector('.stage').appendChild(spotlight);
    
    setTimeout(() => {
        if (spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
    }, 3000);
}

// ===== FUNCIÓN AUXILIAR ACTUALIZADA =====
function updateRevelationStep() {
    const nextButton = document.getElementById('nextRevealButton');
    const message = document.getElementById('currentMessage');
    
    if (nextButton && message) {
        const stepNames = ['TERCER', 'SEGUNDO', 'PRIMER'];
        const colors = ['var(--bronze)', 'var(--silver)', 'var(--gold)'];
        
        if (currentRevelationStep < stepNames.length) {
            nextButton.disabled = false;
            nextButton.innerHTML = `
                <i class="fas fa-play-circle"></i> 
                REVELAR ${stepNames[currentRevelationStep]} LUGAR
            `;
            
            message.innerHTML = `
                <div style="text-align: center;">
                    <div style="color: ${colors[currentRevelationStep]}; font-weight: bold; font-size: 1.5rem;">
                        ${stepNames[currentRevelationStep]} LUGAR
                    </div>
                    <div style="color: var(--silver); margin-top: 10px;">
                        ¿Listo para descubrir el ${stepNames[currentRevelationStep].toLowerCase()} puesto?
                    </div>
                </div>
            `;
        }
    }
    
    updateProgressSteps();
}

// ===== FUNCIÓN AUXILIAR PARA CREAR TARJETAS DE GANADORES =====
function createWinnerCard(nominee, emoji, title, type) {
    const colors = {
        gold: ['var(--gold)', '#FFEE80'],
        silver: ['var(--silver)', '#d8d8d8'],
        bronze: ['var(--bronze)', '#e6a65c']
    };
    
    const color = colors[type] || colors.gold;
    
    const div = document.createElement('div');
    div.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding: 25px;
        background: linear-gradient(145deg, 
            rgba(${type === 'gold' ? '255,215,0' : type === 'silver' ? '192,192,192' : '205,127,50'}, 0.2), 
            rgba(${type === 'gold' ? '212,175,55' : type === 'silver' ? '150,150,150' : '180,110,40'}, 0.1));
        border: ${type === 'gold' ? '4px' : '3px'} solid ${color[0]};
        border-radius: 20px;
        min-width: ${type === 'gold' ? '250px' : '200px'};
        min-height: ${type === 'gold' ? '320px' : '280px'};
        position: relative;
        opacity: 0;
        transform: scale(0);
    `;
    
    div.innerHTML = `
        <div style="font-size: ${type === 'gold' ? '4.5rem' : '3.5rem'}; 
                   margin-bottom: 15px; 
                   animation: float 3s ease-in-out infinite;">
            ${emoji}
        </div>
        <div style="background: linear-gradient(45deg, ${color[0]}, ${color[1]}); 
                   -webkit-background-clip: text; 
                   background-clip: text; 
                   color: transparent; 
                   font-weight: bold; 
                   font-size: ${type === 'gold' ? '1.8rem' : '1.5rem'}; 
                   margin: 10px 0; 
                   text-align: center;">
            ${nominee.name}
        </div>
        <div style="color: ${color[0]}; 
                   font-size: ${type === 'gold' ? '2.5rem' : '2rem'}; 
                   font-weight: bold; 
                   margin: 15px 0;">
            ${nominee.votes || 0}
        </div>
        <div style="color: ${color[0]}; 
                   font-weight: bold; 
                   margin-top: 5px; 
                   font-size: ${type === 'gold' ? '1rem' : '0.9rem'}; 
                   text-transform: uppercase;">
            ${title}
        </div>
    `;
    
    return div;
}

// ===== FUNCIÓN PARA MOSTRAR DETALLES CON PODIO COMPLETO =====
function showDetails(categoryId) {
    console.log("📊 Mostrando detalles con podio completo...");
    
    const category = appData.categories.find(c => c && c.id === categoryId);
    if (!category) return;
    
    const resultsList = document.getElementById('resultsList');
    const detailsButton = document.getElementById('showDetailsButton');
    
    if (!resultsList) return;
    
    // Ocultar botón de detalles si existe
    if (detailsButton) {
        detailsButton.style.display = 'none';
    }
    
    // ELIMINAR contenedor de detalles existente si hay
    const existingDetails = document.getElementById('detailsContainer');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    // Obtener TODOS los nominados ordenados
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    const totalVotes = sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0);
    const totalParticipants = sortedNominees.length;
    const receivedVotes = sortedNominees.filter(n => (n.votes || 0) > 0).length;
    
    // Crear contenedor de detalles
    const detailsContainer = document.createElement('div');
    detailsContainer.id = 'detailsContainer';
    detailsContainer.className = 'details-container active';
    detailsContainer.style.animation = 'fadeInUp 0.8s ease-out forwards';
    detailsContainer.style.marginTop = '40px';
    detailsContainer.style.width = '100%';
    
    // ===== PODIO COMPLETO =====
    let podiumHTML = `
        <h3 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.8rem;">
            <i class="fas fa-medal"></i> PODIO COMPLETO
        </h3>
        
        <!-- PODIO DE 3 PRIMEROS -->
        <div style="display: flex; justify-content: center; align-items: flex-end; gap: 30px; margin-bottom: 50px; flex-wrap: wrap;">
    `;
    
    // Segundo lugar (izquierda)
    if (sortedNominees[1]) {
        podiumHTML += `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 25px;
                background: linear-gradient(145deg, rgba(192, 192, 192, 0.15), rgba(150, 150, 150, 0.1));
                border: 3px solid var(--silver);
                border-radius: 20px;
                min-width: 200px;
                position: relative;
                animation: fadeInUp 0.6s ease-out 0.2s both;
            ">
                <div style="font-size: 3.5rem; margin-bottom: 15px; animation: float 3s ease-in-out infinite;">🥈</div>
                <div style="
                    background: linear-gradient(45deg, var(--silver), #d8d8d8); 
                    -webkit-background-clip: text; 
                    background-clip: text; 
                    color: transparent; 
                    font-weight: bold; 
                    font-size: 1.5rem; 
                    margin: 10px 0;
                    text-align: center;
                ">
                    ${sortedNominees[1].name}
                </div>
                <div style="color: var(--silver); font-size: 2rem; font-weight: bold; margin: 15px 0;">
                    ${sortedNominees[1].votes || 0}
                </div>
                <div style="color: var(--silver); font-weight: bold; margin-top: 5px; font-size: 0.9rem;">
                    SEGUNDO LUGAR
                </div>
            </div>
        `;
    }
    
    // Primer lugar (centro)
    if (sortedNominees[0]) {
        podiumHTML += `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 30px;
                background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(212, 175, 55, 0.15));
                border: 4px solid var(--gold);
                border-radius: 25px;
                min-width: 250px;
                transform: translateY(-20px);
                position: relative;
                animation: fadeInUp 0.8s ease-out both;
                box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
            ">
                <div style="font-size: 4.5rem; margin-bottom: 20px; animation: goldGlow 2s infinite alternate;">🥇</div>
                <div style="
                    background: linear-gradient(45deg, var(--gold), #FFEE80); 
                    -webkit-background-clip: text; 
                    background-clip: text; 
                    color: transparent; 
                    font-weight: bold; 
                    font-size: 1.8rem; 
                    margin: 15px 0;
                    text-align: center;
                ">
                    ${sortedNominees[0].name}
                </div>
                <div style="color: var(--gold); font-size: 2.5rem; font-weight: bold; margin: 20px 0;">
                    ${sortedNominees[0].votes || 0}
                </div>
                <div style="color: var(--gold); font-weight: bold; margin-top: 10px; font-size: 1rem; text-transform: uppercase;">
                    ¡GANADOR/A!
                </div>
            </div>
        `;
    }
    
    // Tercer lugar (derecha)
    if (sortedNominees[2]) {
        podiumHTML += `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 25px;
                background: linear-gradient(145deg, rgba(205, 127, 50, 0.15), rgba(180, 110, 40, 0.1));
                border: 3px solid var(--bronze);
                border-radius: 20px;
                min-width: 200px;
                position: relative;
                animation: fadeInUp 0.6s ease-out 0.4s both;
            ">
                <div style="font-size: 3rem; margin-bottom: 15px; animation: rotateBronze 3s ease-in-out infinite;">🥉</div>
                <div style="
                    background: linear-gradient(45deg, var(--bronze), #e6a65c); 
                    -webkit-background-clip: text; 
                    background-clip: text; 
                    color: transparent; 
                    font-weight: bold; 
                    font-size: 1.5rem; 
                    margin: 10px 0;
                    text-align: center;
                ">
                    ${sortedNominees[2].name}
                </div>
                <div style="color: var(--bronze); font-size: 2rem; font-weight: bold; margin: 15px 0;">
                    ${sortedNominees[2].votes || 0}
                </div>
                <div style="color: var(--bronze); font-weight: bold; margin-top: 5px; font-size: 0.9rem;">
                    TERCER LUGAR
                </div>
            </div>
        `;
    }
    
    podiumHTML += `</div>`;
    
    // ===== LISTA COMPLETA DE PARTICIPANTES (4º en adelante) =====
    if (sortedNominees.length > 3) {
        podiumHTML += `
            <div style="margin-top: 40px; padding: 25px; background: rgba(255, 255, 255, 0.05); border-radius: 15px;">
                <h4 style="color: var(--silver); margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-users"></i> RESTO DE PARTICIPANTES
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
        `;
        
        // Mostrar desde el 4º en adelante
        sortedNominees.slice(3).forEach((nominee, index) => {
            const position = index + 4; // Empezamos desde el puesto 4
            const percentage = totalVotes > 0 ? ((nominee.votes || 0) / totalVotes * 100).toFixed(1) : 0;
            
            podiumHTML += `
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 215, 0, 0.1);
                    text-align: center;
                    transition: all 0.3s ease;
                    animation: fadeInUp 0.5s ease-out ${index * 0.1}s both;
                ">
                    <div style="
                        font-size: 1.2rem;
                        color: #667eea;
                        font-weight: bold;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <span style="
                            background: #667eea;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.9rem;
                        ">${position}º</span>
                        ${nominee.name}
                    </div>
                    <div style="color: var(--silver); font-size: 1.8rem; font-weight: bold; margin: 10px 0;">
                        ${nominee.votes || 0}
                    </div>
                    <div style="color: #aaa; font-size: 0.9rem;">
                        ${percentage}% de los votos
                    </div>
                    <div class="vote-bar" style="margin-top: 10px; height: 8px;">
                        <div class="vote-fill position-other" 
                             style="width: ${percentage}%; height: 100%; border-radius: 4px; background: linear-gradient(90deg, #667eea, #764ba2);">
                        </div>
                    </div>
                </div>
            `;
        });
        
        podiumHTML += `
                </div>
            </div>
        `;
    }
    
    // ===== ESTADÍSTICAS RESUMEN =====
    const statsHTML = `
        <div style="margin-top: 40px; padding: 25px; background: rgba(255, 255, 255, 0.05); border-radius: 15px;">
            <h3 style="color: var(--gold); text-align: center; margin-bottom: 25px; font-size: 1.8rem;">
                <i class="fas fa-chart-pie"></i> ESTADÍSTICAS DE LA CATEGORÍA
            </h3>
            
            <div class="stats-grid">
                <div class="stat-card animate-fadeInUp" style="animation-delay: 0.1s;">
                    <div class="label">VOTOS TOTALES</div>
                    <div class="value">${totalVotes}</div>
                    <small style="color: var(--silver);">en esta categoría</small>
                </div>
                
                <div class="stat-card animate-fadeInUp" style="animation-delay: 0.2s;">
                    <div class="label">PARTICIPANTES</div>
                    <div class="value">${totalParticipants}</div>
                    <small style="color: var(--silver);">personas nominadas</small>
                </div>
                
                <div class="stat-card animate-fadeInUp" style="animation-delay: 0.3s;">
                    <div class="label">RECIBIERON VOTOS</div>
                    <div class="value">${receivedVotes}</div>
                    <small style="color: var(--silver);">de ${totalParticipants}</small>
                </div>
                
                <div class="stat-card animate-fadeInUp" style="animation-delay: 0.4s;">
                    <div class="label">PROMEDIO</div>
                    <div class="value">${totalParticipants > 0 ? (totalVotes / totalParticipants).toFixed(1) : 0}</div>
                    <small style="color: var(--silver);">votos por persona</small>
                </div>
            </div>
            
            <!-- Distribución de votos -->
            <div style="margin-top: 30px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 10px;">
                <h4 style="color: var(--silver); margin-bottom: 15px; text-align: center;">
                    <i class="fas fa-chart-bar"></i> DISTRIBUCIÓN DE VOTOS
                </h4>
                <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                    <div style="color: var(--gold); font-weight: bold; min-width: 100px;">🥇 Ganador:</div>
                    <div style="flex: 1;">
                        <div class="vote-bar" style="height: 10px;">
                            <div class="vote-fill position-1" 
                                 style="width: ${sortedNominees[0] ? ((sortedNominees[0].votes || 0) / totalVotes * 100).toFixed(1) : 0}%;">
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--silver); min-width: 80px; text-align: right;">
                        ${sortedNominees[0] ? ((sortedNominees[0].votes || 0) / totalVotes * 100).toFixed(1) : 0}%
                    </div>
                </div>
                
                ${sortedNominees[1] ? `
                <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                    <div style="color: var(--silver); font-weight: bold; min-width: 100px;">🥈 2º Lugar:</div>
                    <div style="flex: 1;">
                        <div class="vote-bar" style="height: 10px;">
                            <div class="vote-fill position-2" 
                                 style="width: ${(sortedNominees[1].votes || 0) / totalVotes * 100}%;">
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--silver); min-width: 80px; text-align: right;">
                        ${((sortedNominees[1].votes || 0) / totalVotes * 100).toFixed(1)}%
                    </div>
                </div>
                ` : ''}
                
                ${sortedNominees[2] ? `
                <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                    <div style="color: var(--bronze); font-weight: bold; min-width: 100px;">🥉 3º Lugar:</div>
                    <div style="flex: 1;">
                        <div class="vote-bar" style="height: 10px;">
                            <div class="vote-fill position-3" 
                                 style="width: ${(sortedNominees[2].votes || 0) / totalVotes * 100}%;">
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--silver); min-width: 80px; text-align: right;">
                        ${((sortedNominees[2].votes || 0) / totalVotes * 100).toFixed(1)}%
                    </div>
                </div>
                ` : ''}
                
                <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                    <div style="color: #667eea; font-weight: bold; min-width: 100px;">🎯 Resto:</div>
                    <div style="flex: 1;">
                        <div class="vote-bar" style="height: 10px;">
                            <div class="vote-fill position-other" 
                                 style="width: ${sortedNominees.length > 3 ? 
                                 (sortedNominees.slice(3).reduce((sum, n) => sum + (n.votes || 0), 0) / totalVotes * 100).toFixed(1) : 0}%;">
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--silver); min-width: 80px; text-align: right;">
                        ${sortedNominees.length > 3 ? 
                          (sortedNominees.slice(3).reduce((sum, n) => sum + (n.votes || 0), 0) / totalVotes * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // ===== FRASES (solo para categoría 17) =====
    const frasesSectionHTML = `
        <div id="frasesSection" style="margin-top: 40px; display: none;"></div>
    `;
    
    // Unir todo
    detailsContainer.innerHTML = podiumHTML + statsHTML + frasesSectionHTML;
    
    // Añadir al DOM
    resultsList.appendChild(detailsContainer);
    
    // Animar barras de progreso
    setTimeout(() => {
        document.querySelectorAll('.vote-fill').forEach(bar => {
            const currentWidth = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = currentWidth;
            }, 50);
        });
    }, 500);
    
    // Solo para categoría 17 (Frase del Año), mostrar frases
    if (category.id === 17) {
        setTimeout(() => {
            const frasesSection = document.getElementById('frasesSection');
            if (frasesSection) {
                frasesSection.style.display = 'block';
                showFrasesDetails(category, detailsContainer);
            }
        }, 800);
    }
    
    // Añadir botón para volver
    setTimeout(() => {
        if (!document.getElementById('backToWinnersButton')) {
            const backButton = document.createElement('button');
            backButton.id = 'backToWinnersButton';
            backButton.className = 'btn-reveal';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> VOLVER A GANADORES';
            backButton.onclick = () => {
                detailsContainer.remove();
                if (detailsButton) detailsButton.style.display = 'flex';
            };
            backButton.style.marginTop = '30px';
            backButton.style.marginLeft = 'auto';
            backButton.style.marginRight = 'auto';
            backButton.style.display = 'block';
            detailsContainer.appendChild(backButton);
        }
    }, 1000);
}

// ===== FUNCIÓN PARA MOSTRAR FRASES DETALLADAS =====
function showFrasesDetails(category, container) {
    const nominees = category.nominees || [];
    const todasLasFrases = [];
    const todosLosDuos = [];
    
    // Recoger todas las frases y dúos
    nominees.forEach(nominee => {
        if (nominee.frases && Object.keys(nominee.frases).length > 0) {
            Object.values(nominee.frases).forEach(fraseData => {
                if (fraseData.tipo === 'duo') {
                    // Es un dúo
                    todosLosDuos.push({
                        persona: nominee.name,
                        duo: fraseData.frase,
                        votante: fraseData.voter,
                        timestamp: fraseData.timestamp,
                        votos: nominee.votes || 0
                    });
                } else {
                    // Es una frase normal
                    todasLasFrases.push({
                        persona: nominee.name,
                        frase: fraseData.frase,
                        votante: fraseData.voter,
                        timestamp: fraseData.timestamp,
                        votos: nominee.votes || 0
                    });
                }
            });
        }
    });
    
    const frasesSection = document.getElementById('frasesSection');
    if (!frasesSection) return;
    
    // Limpiar contenido anterior
    frasesSection.innerHTML = '';
    
    // ===== SECCIÓN DE DÚOS (solo para categoría 6) =====
    if (category.id === 6 && todosLosDuos.length > 0) {
        const duosSection = document.createElement('div');
        duosSection.style.marginBottom = '40px';
        
        duosSection.innerHTML = `
            <h4 style="color: #667eea; text-align: center; margin-bottom: 25px; font-size: 1.5rem;">
                <i class="fas fa-users"></i> DÚOS REGISTRADOS
            </h4>
            <div id="duosList" style="max-height: 300px; overflow-y: auto; padding: 10px;">
                <!-- Dúos se añadirán aquí -->
            </div>
        `;
        
        frasesSection.appendChild(duosSection);
        
        const duosList = document.getElementById('duosList');
        
        // Ordenar dúos por fecha (más reciente primero)
        todosLosDuos.sort((a, b) => {
            if (b.timestamp && a.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return 0;
        });
        
        todosLosDuos.forEach((duoData, index) => {
            setTimeout(() => {
                const duoItem = document.createElement('div');
                duoItem.className = 'duo-item';
                duoItem.style.animationDelay = `${index * 0.1}s`;
                
                const fecha = duoData.timestamp ? 
                    new Date(duoData.timestamp).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Fecha desconocida';
                
                duoItem.innerHTML = `
                    <div class="duo-text">
                        ${duoData.duo}
                    </div>
                    <div class="duo-meta">
                        <span><strong>${duoData.persona}</strong> (${duoData.votos} votos)</span>
                        <span>Propuesto por ${duoData.votante} - ${fecha}</span>
                    </div>
                `;
                
                duosList.appendChild(duoItem);
            }, index * 100);
        });
    }
    
    // ===== SECCIÓN DE FRASES (solo para categoría 17) =====
    if (category.id === 17 && todasLasFrases.length > 0) {
        const frasesListSection = document.createElement('div');
        
        frasesListSection.innerHTML = `
            <h4 style="color: var(--gold); text-align: center; margin-bottom: 25px; font-size: 1.5rem;">
                <i class="fas fa-quote-left"></i> FRASES ICÓNICAS <i class="fas fa-quote-right"></i>
            </h4>
            <div id="frasesList" style="max-height: 300px; overflow-y: auto; padding: 10px;">
                <!-- Frases se añadirán aquí -->
            </div>
        `;
        
        frasesSection.appendChild(frasesListSection);
        
        const frasesList = document.getElementById('frasesList');
        
        // Ordenar frases por fecha (más reciente primero)
        todasLasFrases.sort((a, b) => {
            if (b.timestamp && a.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return 0;
        });
        
        todasLasFrases.forEach((fraseData, index) => {
            setTimeout(() => {
                const fraseItem = document.createElement('div');
                fraseItem.className = 'frase-item';
                fraseItem.style.animationDelay = `${index * 0.1}s`;
                
                const fecha = fraseData.timestamp ? 
                    new Date(fraseData.timestamp).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Fecha desconocida';
                
                fraseItem.innerHTML = `
                    <div class="frase-text">
                        ${fraseData.frase}
                    </div>
                    <div class="frase-meta">
                        <span><strong>${fraseData.persona}</strong> (${fraseData.votos} votos)</span>
                        <span>Añadida por ${fraseData.votante} - ${fecha}</span>
                    </div>
                `;
                
                frasesList.appendChild(fraseItem);
            }, index * 100);
        });
    }
    
    // Si no hay contenido, mostrar mensaje
    if (todosLosDuos.length === 0 && todasLasFrases.length === 0) {
        frasesSection.innerHTML = `
            <div style="text-align: center; color: var(--silver); padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">
                    ${category.id === 6 ? '👯‍♂️' : '📝'}
                </div>
                <p>Aún no hay ${category.id === 6 ? 'dúos' : 'frases'} registrados</p>
            </div>
        `;
    }
}

// ===== FUNCIONES AUXILIARES =====
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.getElementById('resultsList').appendChild(confettiContainer);
    
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#FF6B6B', '#4ECDC4', '#FF8E53'];
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 15 + 5 + 'px';
            confetti.style.height = Math.random() * 15 + 5 + 'px';
            confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
            confetti.style.animationDelay = Math.random() * 1 + 's';
            
            confettiContainer.appendChild(confetti);
            
            // Eliminar después de la animación
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }, i * 10);
    }
    
    // Eliminar contenedor después de un tiempo
    setTimeout(() => {
        if (confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
    }, 4000);
}


// ===== FUNCIÓN COMPLETA PARA MOSTRAR TODOS LOS VOTOS =====
function showAllVotes() {
    console.log("📊 Mostrando todos los votos...");
    
    // Ocultar detalles si están visibles
    const detailsContainer = document.getElementById('detailsContainer');
    if (detailsContainer) {
        detailsContainer.style.display = 'none';
    }
    
    const allVotesContainer = document.getElementById('allVotesContainer');
    if (!allVotesContainer) return;
    
    // LIMPIAR contenido anterior
    allVotesContainer.innerHTML = '';
    
    // Obtener TODOS los nominados de la categoría actual
    if (!categoryForRevelation || !categoryForRevelation.nominees) {
        allVotesContainer.innerHTML = `
            <div style="text-align: center; color: var(--silver); padding: 40px;">
                <div style="font-size: 3rem;">📊</div>
                <p>No hay datos de votos disponibles</p>
            </div>
        `;
        allVotesContainer.style.display = 'block';
        return;
    }
    
    const nominees = categoryForRevelation.nominees || [];
    
    // Ordenar TODOS los nominados por votos
    const allNomineesWithVotes = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .map((nominee, index) => ({
            name: nominee.name,
            votes: nominee.votes || 0,
            position: index + 1,
            medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯',
            photo: nominee.photo || null,
            positionClass: index === 0 ? 'position-1' : 
                          index === 1 ? 'position-2' : 
                          index === 2 ? 'position-3' : 'position-other'
        }));
    
    const totalVotes = allNomineesWithVotes.reduce((sum, n) => sum + (n.votes || 0), 0);
    const maxVotes = Math.max(...allNomineesWithVotes.map(n => n.votes || 0), 1);
    
    console.log("📋 Mostrando", allNomineesWithVotes.length, "participantes");
    console.log("🏆 Máximo de votos:", maxVotes);
    
    // ===== MINI PODIO VISUAL =====
    let votesHTML = `
        <h3 style="color: var(--gold); text-align: center; margin-bottom: 25px; font-size: 1.8rem;">
            <i class="fas fa-trophy"></i> PODIO COMPLETO - ${categoryForRevelation.name}
        </h3>
        
        <!-- Mini Podio Visual -->
        <div style="margin-bottom: 40px; padding: 25px; background: rgba(255, 255, 255, 0.03); border-radius: 15px;">
            <h4 style="color: var(--silver); margin-bottom: 20px; text-align: center;">
                <i class="fas fa-medal"></i> LOS TRES PRIMEROS
            </h4>
            <div style="display: flex; justify-content: center; align-items: flex-end; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
    `;
    
    // Añadir los 3 primeros al podio visual
    allNomineesWithVotes.slice(0, 3).forEach((nominee, index) => {
        const colors = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];
        const emojis = ['🥇', '🥈', '🥉'];
        const heights = ['160px', '130px', '110px'];
        const positions = ['1º', '2º', '3º'];
        
        votesHTML += `
            <div style="
                width: 110px;
                height: ${heights[index]};
                background: linear-gradient(180deg, 
                    ${colors[index]} 0%, 
                    ${colors[index]}80 100%);
                border-radius: 10px 10px 0 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                animation: fadeInUp 0.6s ease-out ${index * 0.2}s both;
                box-shadow: 0 5px 20px ${colors[index]}40;
            ">
                <div style="font-size: 2.5rem; margin-bottom: 10px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                    ${emojis[index]}
                </div>
                <div style="
                    color: white;
                    font-weight: bold;
                    font-size: 0.9rem;
                    text-align: center;
                    padding: 5px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                ">
                    ${nominee.name}
                </div>
                <div style="
                    position: absolute;
                    bottom: -30px;
                    color: ${colors[index]};
                    font-weight: bold;
                    font-size: 1.5rem;
                    text-shadow: 0 2px 5px rgba(0,0,0,0.2);
                ">
                    ${nominee.votes}
                </div>
                <div style="
                    position: absolute;
                    bottom: -50px;
                    color: ${colors[index]};
                    font-weight: bold;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                ">
                    ${positions[index]} LUGAR
                </div>
            </div>
        `;
    });
    
    votesHTML += `
            </div>
            
            <!-- Información detallada del podio -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 60px;">
    `;
    
    // Información detallada de los 3 primeros
    allNomineesWithVotes.slice(0, 3).forEach((nominee, index) => {
        const colors = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];
        const positions = ['PRIMER', 'SEGUNDO', 'TERCER'];
        const percentage = totalVotes > 0 ? ((nominee.votes / totalVotes) * 100).toFixed(1) : 0;
        
        votesHTML += `
            <div style="
                text-align: center;
                background: rgba(255, 255, 255, 0.05);
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid ${colors[index]};
                animation: fadeInUp 0.6s ease-out ${0.6 + (index * 0.1)}s both;
            ">
                <div style="color: ${colors[index]}; font-weight: bold; font-size: 1.3rem; margin-bottom: 10px;">
                    ${positions[index]} LUGAR
                </div>
                <div style="color: white; font-weight: bold; font-size: 1.4rem; margin: 10px 0;">${nominee.name}</div>
                <div style="color: var(--silver); font-size: 1.1rem;">${nominee.votes} votos</div>
                <div style="color: ${colors[index]}; font-weight: bold; margin-top: 10px;">${percentage}%</div>
                <div class="vote-bar" style="margin-top: 10px; height: 8px;">
                    <div class="vote-fill ${nominee.positionClass}" 
                         style="width: 0%; height: 100%; border-radius: 4px;">
                    </div>
                </div>
            </div>
        `;
    });
    
    votesHTML += `
            </div>
        </div>
        
        <!-- Tabla completa de clasificación -->
        <div style="margin-top: 30px;">
            <h4 style="color: var(--silver); margin-bottom: 25px; text-align: center; font-size: 1.5rem;">
                <i class="fas fa-list-ol"></i> CLASIFICACIÓN COMPLETA
            </h4>
            
            <div style="margin-bottom: 20px; text-align: center; color: var(--silver); padding: 10px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                <p>Mostrando todos los <strong>${allNomineesWithVotes.length}</strong> participantes</p>
            </div>
            
            <table class="votes-table">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">POS.</th>
                        <th>NOMINADO</th>
                        <th style="width: 100px; text-align: center;">VOTOS</th>
                        <th style="width: 150px; text-align: center;">PORCENTAJE</th>
                        <th style="width: 200px;">DISTRIBUCIÓN</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Tabla con TODOS los participantes
    allNomineesWithVotes.forEach((nominee, index) => {
        const votes = nominee.votes || 0;
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
        const barWidth = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
        
        const medalIcon = index === 0 ? '🥇' : 
                         index === 1 ? '🥈' : 
                         index === 2 ? '🥉' : `${index + 1}º`;
        
        votesHTML += `
            <tr class="${nominee.positionClass}">
                <td style="font-weight: bold; text-align: center; vertical-align: middle;">
                    <span class="medal-icon" style="font-size: ${index < 3 ? '1.5rem' : '1.2rem'};">${medalIcon}</span>
                </td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${nominee.photo ? 
                            `<img src="${nominee.photo}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid var(--gold); object-fit: cover;">` : 
                            `<div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(45deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user" style="color: white; font-size: 1.2rem;"></i>
                            </div>`
                        }
                        <span style="font-weight: ${index < 3 ? 'bold' : 'normal'}; font-size: ${index < 3 ? '1.1rem' : '1rem'}">
                            ${nominee.name}
                        </span>
                    </div>
                </td>
                <td style="text-align: center; font-weight: bold; vertical-align: middle; font-size: ${index < 3 ? '1.3rem' : '1.1rem'}">
                    ${votes}
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <span style="color: ${index < 3 ? nominee.positionClass === 'position-1' ? 'var(--gold)' : 
                                                      nominee.positionClass === 'position-2' ? 'var(--silver)' : 
                                                      'var(--bronze)' : 'var(--silver)'}; 
                                 font-weight: ${index < 3 ? 'bold' : 'normal'}">
                        ${percentage}%
                    </span>
                </td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; min-width: 100px;">
                            <div class="vote-bar" style="height: 12px; margin: 5px 0;">
                                <div class="vote-fill ${nominee.positionClass}" 
                                     style="width: 0%; height: 100%; border-radius: 6px;">
                                </div>
                            </div>
                        </div>
                        <span style="min-width: 40px; text-align: right; font-size: 0.9em; color: var(--silver);">
                            ${votes} ${votes === 1 ? 'voto' : 'votos'}
                        </span>
                    </div>
                </td>
            </tr>
        `;
    });
    
    votesHTML += `
                </tbody>
            </table>
            
            <!-- Resumen estadístico -->
            <div style="margin-top: 40px; padding: 25px; background: rgba(255, 255, 255, 0.05); border-radius: 15px;">
                <h4 style="color: var(--gold); margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-chart-line"></i> RESUMEN ESTADÍSTICO
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div style="text-align: center; padding: 20px; background: rgba(255, 215, 0, 0.1); border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="color: var(--gold); font-size: 2.5rem; font-weight: bold;">${totalVotes}</div>
                        <div style="color: var(--silver); font-size: 0.9rem; margin-top: 5px;">VOTOS TOTALES</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: rgba(192, 192, 192, 0.1); border-radius: 10px; border: 1px solid rgba(192, 192, 192, 0.2);">
                        <div style="color: var(--silver); font-size: 2.5rem; font-weight: bold;">${allNomineesWithVotes.length}</div>
                        <div style="color: var(--silver); font-size: 0.9rem; margin-top: 5px;">PARTICIPANTES</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: rgba(76, 175, 80, 0.1); border-radius: 10px; border: 1px solid rgba(76, 175, 80, 0.2);">
                        <div style="color: #4CAF50; font-size: 2.5rem; font-weight: bold;">${allNomineesWithVotes.filter(n => n.votes > 0).length}</div>
                        <div style="color: var(--silver); font-size: 0.9rem; margin-top: 5px;">RECIBIERON VOTOS</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: rgba(255, 142, 83, 0.1); border-radius: 10px; border: 1px solid rgba(255, 142, 83, 0.2);">
                        <div style="color: #FF8E53; font-size: 2.5rem; font-weight: bold;">${(totalVotes / allNomineesWithVotes.length).toFixed(1)}</div>
                        <div style="color: var(--silver); font-size: 0.9rem; margin-top: 5px;">PROMEDIO VOTOS</div>
                    </div>
                </div>
                
                <!-- Distribución detallada -->
                <div style="margin-top: 30px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 10px;">
                    <h5 style="color: var(--silver); margin-bottom: 15px; text-align: center;">
                        <i class="fas fa-percentage"></i> DISTRIBUCIÓN POR PUESTO
                    </h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
    `;
    
    // Distribución por puestos (grupos)
    const groups = [
        { name: '🥇 Ganador', range: [0], color: 'var(--gold)' },
        { name: '🥈 2º Lugar', range: [1], color: 'var(--silver)' },
        { name: '🥉 3º Lugar', range: [2], color: 'var(--bronze)' },
        { name: '🏅 Puestos 4-6', range: [3, 4, 5], color: '#667eea' },
        { name: '🎖️ Puestos 7-9', range: [6, 7, 8], color: '#4CAF50' },
        { name: '🎯 Puestos 10+', range: [9, 10, 11, 12], color: '#FF8E53' }
    ];
    
    groups.forEach((group, index) => {
        const groupVotes = group.range.reduce((sum, pos) => {
            return sum + (allNomineesWithVotes[pos]?.votes || 0);
        }, 0);
        
        const groupPercentage = totalVotes > 0 ? ((groupVotes / totalVotes) * 100).toFixed(1) : 0;
        
        votesHTML += `
            <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid ${group.color};">
                <div style="color: ${group.color}; font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">
                    ${group.name}
                </div>
                <div style="color: white; font-size: 1.3rem; font-weight: bold;">${groupVotes}</div>
                <div style="color: var(--silver); font-size: 0.9rem;">${groupPercentage}%</div>
            </div>
        `;
    });
    
    votesHTML += `
                    </div>
                </div>
            </div>
            
            <!-- Botón para descargar datos -->
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="exportCategoryData()" class="btn-show-all-votes" style="background: linear-gradient(90deg, rgba(76, 201, 240, 0.8), rgba(29, 209, 161, 0.8)) !important;">
                    <i class="fas fa-download"></i> DESCARGAR DATOS COMPLETOS
                </button>
            </div>
        </div>
    `;
    
    allVotesContainer.innerHTML = votesHTML;
    allVotesContainer.style.display = 'block';
    
    // Animar las barras de progreso con retraso escalonado
    setTimeout(() => {
        document.querySelectorAll('.vote-fill').forEach((bar, index) => {
            setTimeout(() => {
                const row = bar.closest('tr');
                if (row) {
                    const votesText = row.querySelector('td:nth-child(3)').textContent.trim();
                    const votes = parseInt(votesText) || 0;
                    const width = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                    
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width + '%';
                        bar.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    }, 100);
                }
            }, index * 30); // Efecto escalonado
        });
        
        // También animar las barras del podio
        document.querySelectorAll('#allVotesContainer .vote-fill').forEach((bar, index) => {
            setTimeout(() => {
                const container = bar.closest('div[style*="text-align: center"]');
                if (container) {
                    const votesText = container.querySelector('div:nth-child(3)').textContent;
                    const votes = parseInt(votesText) || 0;
                    const width = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                    
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width + '%';
                    }, 50);
                }
            }, index * 100);
        });
    }, 500);
}

// ===== FUNCIÓN PARA EXPORTAR DATOS (OPCIONAL) =====
function exportCategoryData() {
    if (!categoryForRevelation) return;
    
    const dataToExport = {
        categoria: categoryForRevelation.name,
        descripcion: categoryForRevelation.description || '',
        fecha: new Date().toISOString(),
        participantes: []
    };
    
    const nominees = categoryForRevelation.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    sortedNominees.forEach((nominee, index) => {
        dataToExport.participantes.push({
            posicion: index + 1,
            nombre: nominee.name,
            votos: nominee.votes || 0,
            porcentaje: ((nominee.votes || 0) / sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0) * 100).toFixed(1)
        });
    });
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `pteros_${categoryForRevelation.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    
    alert(`✅ Datos de "${categoryForRevelation.name}" exportados`);
}

// ===== FUNCIONES PARA EL TELÓN DEL GANADOR =====
function createWinnerCurtain() {
    const winnerContainer = document.getElementById('currentWinnerContainer');
    if (!winnerContainer) return;
    
    // Crear telón que cubra al ganador
    const curtain = document.createElement('div');
    curtain.id = 'winnerCurtain';
    curtain.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
            rgba(139, 0, 0, 0.95) 0%,
            rgba(178, 34, 34, 0.95) 100%);
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 0 50px rgba(139, 0, 0, 0.8);
    `;
    
    // Añadir pomos de telón
    const leftKnob = document.createElement('div');
    leftKnob.style.cssText = `
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, 
            rgba(255, 215, 0, 0.9) 0%,
            rgba(212, 175, 55, 0.7) 70%);
        border-radius: 50%;
        animation: curtainKnobGlow 1.5s infinite alternate;
    `;
    
    const rightKnob = document.createElement('div');
    rightKnob.style.cssText = `
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, 
            rgba(255, 215, 0, 0.9) 0%,
            rgba(212, 175, 55, 0.7) 70%);
        border-radius: 50%;
        animation: curtainKnobGlow 1.5s infinite alternate 0.5s;
    `;
    
    // Mensaje en el telón
    const curtainMessage = document.createElement('div');
    curtainMessage.style.cssText = `
        text-align: center;
        color: white;
        font-size: 2rem;
        font-weight: bold;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        z-index: 21;
    `;
    curtainMessage.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">🎭</div>
        <div>¡EL GANADOR ESTÁ DETRÁS!</div>
        <div style="font-size: 1.2rem; margin-top: 10px; opacity: 0.8;">
        Prepárate para la gran revelación
        </div>
    `;
    
    curtain.appendChild(leftKnob);
    curtain.appendChild(rightKnob);
    curtain.appendChild(curtainMessage);
    
    // Añadir al contenedor del ganador
    winnerContainer.style.position = 'relative';
    winnerContainer.appendChild(curtain);
}

function openWinnerCurtain() {
    const curtain = document.getElementById('winnerCurtain');
    if (!curtain) return;
    
    // Crear dos mitades del telón
    const leftHalf = document.createElement('div');
    leftHalf.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, 
            rgba(139, 0, 0, 0.95) 0%,
            rgba(178, 34, 34, 0.95) 100%);
        transform-origin: left center;
        transition: transform 1.5s cubic-bezier(0.86, 0, 0.07, 1);
        z-index: 22;
    `;
    
    const rightHalf = document.createElement('div');
    rightHalf.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, 
            rgba(178, 34, 34, 0.95) 0%,
            rgba(139, 0, 0, 0.95) 100%);
        transform-origin: right center;
        transition: transform 1.5s cubic-bezier(0.86, 0, 0.07, 1);
        z-index: 22;
    `;
    
    // Reemplazar el telón completo por las dos mitades
    curtain.innerHTML = '';
    curtain.appendChild(leftHalf);
    curtain.appendChild(rightHalf);
    
    // Animar apertura
    setTimeout(() => {
        leftHalf.style.transform = 'translateX(-100%) rotateY(-20deg)';
        rightHalf.style.transform = 'translateX(100%) rotateY(20deg)';
    }, 100);
    
    // Eliminar el telón después de la animación
    setTimeout(() => {
        if (curtain.parentNode) {
            curtain.parentNode.removeChild(curtain);
        }
    }, 1600);
}

// ===== FUNCIÓN PARA FORZAR SINCRONIZACIÓN =====
async function forzarSincronizacion() {
    console.log("🔄 Sincronizando (solo descarga desde Firebase)...");
    
    if (!confirm('¿Sincronizar datos desde Firebase?\n\nEsto SOLO descargará datos desde Firebase (no subirá nada).\n\n¿Continuar?')) {
        return;
    }
    
    const boton = event.target;
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
    boton.disabled = true;
    
    try {
        let funcionDescarga;
        
        // Intentar usar la nueva función primero
        if (typeof soloDescargarDesdeFirebase === 'function') {
            funcionDescarga = soloDescargarDesdeFirebase;
            console.log("Usando función específica de solo descarga");
        } else if (typeof loadDataFromFirebase === 'function') {
            funcionDescarga = loadDataFromFirebase;
            console.log("Usando función general de carga");
        } else {
            throw new Error("No hay funciones de descarga disponibles");
        }
        
        const exito = await funcionDescarga();
        
        if (exito) {
            // Guardar en localStorage
            try {
                localStorage.setItem('premiosData', JSON.stringify({
                    categories: appData.categories,
                    phase: appData.phase,
                    photoUrls: appData.photoUrls
                }));
                localStorage.setItem('premiosUsers', JSON.stringify(appData.users || []));
                console.log("💾 Datos guardados en localStorage");
            } catch (e) {
                console.warn("⚠️ Error guardando localStorage:", e);
            }
            
            // Actualizar UI
            if (updateVotersList) updateVotersList();
            if (renderCategories) renderCategories();
            if (updateStats) updateStats();
            if (updatePhaseBanner) updatePhaseBanner();
            
            alert("✅ Sincronización completada\n\nDatos descargados desde Firebase:\n• Categorías: " + (appData.categories?.length || 0) + "\n• Usuarios: " + (appData.users?.length || 0));
            
        } else {
            alert("ℹ️ No había datos nuevos en Firebase o ya estaban sincronizados");
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
        alert("❌ Error sincronizando: " + error.message);
        
    } finally {
        // Restaurar botón
        boton.innerHTML = textoOriginal;
        boton.disabled = false;
    }
}
// ===== FUNCIÓN PARA LIMPIAR LOCALSTORAGE MANUALMENTE =====
function limpiarLocalStorage() {
    if (confirm('⚠️ ¿LIMPIAR CACHE LOCAL (localStorage)?\n\nEsto borrará:\n• Datos locales\n• Usuarios locales\n• Fotos locales\n\nLos datos se recargarán desde Firebase.\n\n¿Continuar?')) {
        console.log("🧹 Limpiando localStorage manualmente...");
        
        // Guardar el usuario actual si existe
        const currentUser = appData.currentUser;
        
        // Limpiar todo excepto la última sesión
        const keysToKeep = ['lastUserId', 'lastUserName'];
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!keysToKeep.includes(key)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Eliminado: ${key}`);
        });
        
        // Restablecer appData
        appData.categories = [];
        appData.users = [];
        appData.photoUrls = {};
        
        console.log("✅ localStorage limpiado");
        
        // Recargar desde Firebase
        if (typeof loadDataFromFirebase === 'function') {
            loadDataFromFirebase().then(() => {
                // Restaurar usuario si estaba logueado
                if (currentUser) {
                    appData.currentUser = currentUser;
                    showUserInfo();
                }
                
                renderCategories();
                updateVotersList();
                updateStats();
                
                alert("✅ Cache local limpiado. Datos recargados desde Firebase.");
            }).catch(error => {
                console.error("Error recargando:", error);
                alert("⚠️ Cache limpiado pero error al recargar desde Firebase.");
            });
        } else {
            // Crear categorías por defecto si no hay Firebase
            appData.categories = createDefaultCategories();
            renderCategories();
            alert("✅ Cache local limpiado. Usando datos por defecto.");
        }
    }
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
    
    // CORRECCIÓN: Solo cerrar modales específicos
    window.onclick = function(event) {
        const modal = document.getElementById('voteModal');
        if (event.target == modal) closeModal();
        
        // NO cerrar adminPanel aquí - el adminPanel debe cerrarse solo con su botón X
    };
    
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
});
