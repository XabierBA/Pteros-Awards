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
    
    try {
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
    
    // ===== SISTEMA DE FRASES (SOLO CATEGORÍA 17) =====
    let fraseUsuario = '';
    
    // VERIFICACIÓN EXPLÍCITA
    console.log("🔍 CATEGORÍA ID:", category.id, "¿Es 17?", category.id === 17);
    
    if (category.id === 17) {
        console.log("📝 MOSTRANDO PROMPT PARA FRASE...");
        
        fraseUsuario = prompt(
            `📝 FRASE DEL AÑO\n\nEstás votando a ${nomineeName}.\n\nPor favor, escribe la frase icónica que dijo (o por la que es famoso/a):\n\nEjemplo: "Mejor me voy a mi casa"`,
            ""
        );
        
        console.log("📝 RESPUESTA DEL PROMPT:", fraseUsuario);
        
        // Si cancela el prompt
        if (fraseUsuario === null) {
            console.log("❌ Usuario canceló el prompt");
            return;
        }
        
        // Limpiar
        fraseUsuario = fraseUsuario.trim();
        
        // Validar
        if (!fraseUsuario) {
            const confirmar = confirm("⚠️ ¿Votar sin añadir frase?\n\n(Puedes votar sin frase, pero es más divertido con una)");
            if (!confirmar) {
                console.log("❌ Usuario no confirmó voto sin frase");
                return;
            }
        }
    }
    
    // ===== PROCESAR EL VOTO =====
    console.log("🔄 PROCESANDO VOTO...");
    
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
    
    // 4. GUARDAR FRASE (si existe)
    if (fraseUsuario && fraseUsuario.trim() !== '') {
        nominee.frases[appData.currentUser.id] = {
            frase: fraseUsuario,
            voter: appData.currentUser.name,
            timestamp: new Date().toISOString()
        };
        console.log("💾 Frase guardada:", fraseUsuario.substring(0, 50));
    }
    
    console.log("✅ Voto completado para", nomineeName, "- Votos totales:", nominee.votes);
    
    // 5. GUARDAR EN BASE DE DATOS
    (async () => {
        try {
            await saveData();
            await saveUsers();
            console.log("💾 Datos guardados correctamente");
        } catch (error) {
            console.error("❌ Error guardando:", error);
        }
    })();
    
    // 6. MOSTRAR CONFIRMACIÓN
    if (category.id === 17) {
        if (fraseUsuario && fraseUsuario.trim() !== '') {
            alert(`✅ ¡Voto registrado!\n\nHas votado por ${nomineeName}\n\nFrase añadida:\n"${fraseUsuario}"`);
        } else {
            alert(`✅ ¡Voto registrado!\nHas votado por ${nomineeName} (sin frase)`);
        }
    } else {
        alert(`✅ ¡Voto registrado!\nHas votado por ${nomineeName} en "${category.name}"`);
    }
    
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
    }
    
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.classList.remove('active');
    }
    
    if (addSection) {
        addSection.style.display = 'block';
    }
    
    // Limpiar confetti si existe
    const confetti = document.querySelector('.confetti-container');
    if (confetti) confetti.remove();
    
    // Limpiar ambos contenedores
    const nomineesList = document.getElementById('nomineesList');
    const resultsList = document.getElementById('resultsList');
    
    if (nomineesList) nomineesList.innerHTML = '';
    if (resultsList) resultsList.innerHTML = '';
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
async function startRevelation(category) {
    console.log("✨ Iniciando revelación...");
    
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;
    
    // 1. CREAR CONFETI
    createConfetti();
    
    // 2. MOSTRAR CONTENIDO DE REVELACIÓN
    resultsList.innerHTML = `
        <div style="position: relative; z-index: 2;">
            <!-- CONFETI SE AÑADE POR JAVASCRIPT -->
            
            <div class="reveal-screen" style="min-height: 400px;">
                <h1 class="reveal-title" style="font-size: 2.5rem; margin-bottom: 40px;">
                    ¡Y LOS GANADORES SON...!
                </h1>
                
                <div id="winnersContainer" style="width: 100%;">
                    <!-- Los ganadores se añadirán aquí con animación -->
                </div>
                
                <button class="btn-reveal" id="showDetailsButton" onclick="showDetails(${category.id})" 
                        style="margin-top: 50px; display: none;">
                    <i class="fas fa-chart-bar"></i> VER DETALLES Y FRASES
                </button>
            </div>
        </div>
    `;
    
    const winnersContainer = document.getElementById('winnersContainer');
    
    // Obtener top 3 ordenados por votos
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    const top3 = sortedNominees.slice(0, 3);
    const hasVotes = sortedNominees.some(n => (n.votes || 0) > 0);
    
    if (!hasVotes) {
        winnersContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; animation: fadeInUp 1s ease-out;">
                <div style="font-size: 4rem; color: var(--silver); margin-bottom: 20px;">📊</div>
                <h3 style="color: var(--silver); margin-bottom: 15px;">Sin votos aún</h3>
                <p style="color: var(--silver); opacity: 0.8;">No hay votos registrados en esta categoría</p>
            </div>
        `;
        return;
    }
    
    // 3. REVELAR GANADORES CON ANIMACIÓN ESCALONADA
    await delay(500); // Pequeña pausa dramática
    
    // Contenedor para los 3 ganadores
    const winnersRow = document.createElement('div');
    winnersRow.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: flex-end;
        gap: 30px;
        flex-wrap: wrap;
        margin-bottom: 30px;
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
    `;
    
    // Animación para 2do lugar
    if (top3[1]) {
        await delay(300);
        const secondDiv = createWinnerCard(top3[1], '🥈', 'SECUNDO LUGAR', 'silver');
        secondDiv.style.animation = 'scaleUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulseGold 2s infinite 0.8s';
        winnersRow.appendChild(secondDiv);
    }
    
    // Animación para 1er lugar (más espectacular)
    if (top3[0]) {
        await delay(500);
        const firstDiv = createWinnerCard(top3[0], '🥇', '¡GANADOR/A!', 'gold');
        firstDiv.style.cssText += `
            transform: translateY(-20px);
            animation: scaleUp 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, 
                       pulseGold 2s infinite 1s;
            box-shadow: 0 20px 50px rgba(255, 215, 0, 0.5);
        `;
        winnersRow.appendChild(firstDiv);
        
        // Sonido imaginario (podrías añadir un sonido real)
        console.log("🎺 ¡FANFARRIA! 🎺");
    }
    
    // Animación para 3er lugar
    if (top3[2]) {
        await delay(300);
        const thirdDiv = createWinnerCard(top3[2], '🥉', 'TERCER LUGAR', 'bronze');
        thirdDiv.style.animation = 'scaleUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulseGold 2s infinite 1.2s';
        winnersRow.appendChild(thirdDiv);
    }
    
    winnersContainer.appendChild(winnersRow);
    
    // Mostrar botón de detalles después de las animaciones
    await delay(1500);
    const detailsButton = document.getElementById('showDetailsButton');
    if (detailsButton) {
        detailsButton.style.display = 'flex';
        detailsButton.style.animation = 'fadeInUp 0.8s ease-out forwards';
    }
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

// ===== FUNCIÓN PARA MOSTRAR DETALLES =====
function showDetails(categoryId) {
    console.log("📊 Mostrando detalles...");
    
    const category = appData.categories.find(c => c && c.id === categoryId);
    if (!category) return;
    
    const resultsList = document.getElementById('resultsList');
    const detailsButton = document.getElementById('showDetailsButton');
    
    if (!resultsList) return;
    
    // Ocultar botón de detalles
    if (detailsButton) {
        detailsButton.style.display = 'none';
    }
    
    // Obtener todos los nominados ordenados
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    const totalVotes = sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0);
    const totalParticipants = sortedNominees.length;
    const receivedVotes = sortedNominees.filter(n => (n.votes || 0) > 0).length;
    
    // Crear contenedor de detalles
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'details-container active';
    detailsContainer.style.animation = 'fadeInUp 0.8s ease-out forwards';
    
    // Estadísticas
    detailsContainer.innerHTML = `
        <h3 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.8rem;">
            <i class="fas fa-chart-pie"></i> ESTADÍSTICAS DETALLADAS
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
        
        <div id="frasesSection" style="margin-top: 40px;">
            <!-- Las frases se añadirán aquí si es la categoría 17 -->
        </div>
    `;
    
    // Añadir al DOM
    resultsList.appendChild(detailsContainer);
    
    // Solo para categoría 17 (Frase del Año), mostrar frases
    if (category.id === 17) {
        setTimeout(() => {
            showFrasesDetails(category, detailsContainer);
        }, 500);
    }
    
    // Añadir botón para volver a los ganadores
    setTimeout(() => {
        const backButton = document.createElement('button');
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
    }, 1000);
}

// ===== FUNCIÓN PARA MOSTRAR FRASES DETALLADAS =====
function showFrasesDetails(category, container) {
    const nominees = category.nominees || [];
    const todasLasFrases = [];
    
    // Recoger todas las frases
    nominees.forEach(nominee => {
        if (nominee.frases && Object.keys(nominee.frases).length > 0) {
            Object.values(nominee.frases).forEach(fraseData => {
                todasLasFrases.push({
                    persona: nominee.name,
                    frase: fraseData.frase,
                    votante: fraseData.voter,
                    timestamp: fraseData.timestamp,
                    votos: nominee.votes || 0
                });
            });
        }
    });
    
    if (todasLasFrases.length === 0) return;
    
    // Ordenar por fecha (más reciente primero) o por votos
    todasLasFrases.sort((a, b) => {
        if (b.timestamp && a.timestamp) {
            return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return b.votos - a.votos;
    });
    
    const frasesSection = document.getElementById('frasesSection');
    if (!frasesSection) return;
    
    frasesSection.innerHTML = `
        <h4 style="color: var(--gold); text-align: center; margin-bottom: 25px; font-size: 1.5rem;">
            <i class="fas fa-quote-left"></i> FRASES ICÓNICAS <i class="fas fa-quote-right"></i>
        </h4>
        <div id="frasesList" style="max-height: 400px; overflow-y: auto; padding: 10px;">
            <!-- Frases se añadirán aquí -->
        </div>
    `;
    
    const frasesList = document.getElementById('frasesList');
    
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