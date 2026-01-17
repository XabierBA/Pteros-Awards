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

// ===== ABRIR MODAL DE VOTACIÓN =====
function openVoteModal(categoryId) {
    // Si estamos en fase resultados, mostrar resultados en vez de votación
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
    
    if (!category) {
        alert('Error: Categoría no encontrada');
        return;
    }
    
    // Mostrar sección de añadir nominado (solo en fases de votación)
    const addSection = document.querySelector('.add-nominee-section');
    if (addSection) {
        addSection.style.display = 'block';
    }
    
    modalCategory.innerHTML = `${category.name}<br><small>${category.description || ''}</small>`;
    nomineesList.innerHTML = '';
    
    const userVotes = appData.currentUser.votes || {};
    const userVote = userVotes[categoryId];
    
    const nominees = category.nominees || [];
    // Ordenar alfabéticamente para NO mostrar quién va ganando
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
        
        // Contenido SIN mostrar votos individuales
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
            
            // Mostrar máximo 2 frases
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
    const addSection = document.querySelector('.add-nominee-section');
    
    if (modal) modal.style.display = 'none';
    if (addSection) addSection.style.display = 'block'; // Restaurar visibilidad
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


// ===== MOSTRAR RESULTADOS CON ANIMACIÓN POR CLICS =====
function showCategoryResults(categoryId) {
    const category = appData.categories.find(c => c && c.id === categoryId);
    if (!category) return;
    
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    if (!modal || !modalCategory || !nomineesList) return;
    
    // Configurar modal para resultados
    modalCategory.innerHTML = `🏆 ${category.name || 'Categoría'}<br><small>${category.description || ''}</small>`;
    nomineesList.innerHTML = '';
    
    const nominees = category.nominees || [];
    
    // Ordenar por votos (de mayor a menor)
    const sortedNominees = [...nominees]
        .filter(n => n)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    // Obtener top 3
    const winner = sortedNominees[0];
    const second = sortedNominees[1];
    const third = sortedNominees[2];
    
    // Estado de revelación
    let revealedStep = 0;
    
    // FUNCIÓN AUXILIAR PARA CENTRAR CONTENIDO
    function crearContenedorCentrado() {
        const container = document.createElement('div');
        container.className = 'centered-animation-container';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 600px;
            width: 100%;
            text-align: center;
            padding: 30px;
        `;
        return container;
    }
    
    // Función para revelar siguiente paso
    function revealNextStep() {
        revealedStep++;
        
        // Limpiar y mostrar según el paso
        nomineesList.innerHTML = '';
        
        const container = crearContenedorCentrado();
        
        // Paso 0: Instrucciones iniciales
        if (revealedStep === 0) {
            container.innerHTML = `
                <div style="max-width: 800px; margin: 0 auto;">
                    <h3 style="color: var(--gold); font-size: 2.2rem; margin-bottom: 40px; text-align: center;">
                        🎉 ¡REVELACIÓN DE RESULTADOS!
                    </h3>
                    
                    <div style="font-size: 6rem; margin: 40px 0; animation: pulse 2s infinite;">
                        👇
                    </div>
                    
                    <div style="font-size: 1.5rem; color: var(--gold); margin-bottom: 20px; font-weight: bold;">
                        ¡Descubre quién ganó!
                    </div>
                    
                    <div style="color: var(--silver); font-size: 1.2rem; line-height: 1.6; margin-bottom: 50px;">
                        Haz clic para revelar los ganadores<br>
                        de menos a más votos
                    </div>
                    
                    <button class="btn-reveal" style="margin: 20px auto; display: block;">
                        <i class="fas fa-play-circle"></i> EMPEZAR REVELACIÓN
                    </button>
                </div>
            `;
            
            // Agregar evento al botón
            container.querySelector('.btn-reveal').onclick = (e) => {
                e.stopPropagation();
                revealNextStep();
                updateClickZone();
            };
        }
        
        // Paso 1: Revelar 3er lugar (bronce) - CENTRADO
        else if (revealedStep === 1 && third) {
            container.innerHTML = `
                <div style="max-width: 800px; margin: 0 auto;">
                    <h3 style="color: var(--bronze); font-size: 2.2rem; margin-bottom: 40px; text-align: center;">
                        🥉 TERCER LUGAR
                    </h3>
                    
                    <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
                        <div style="text-align: center; width: 100%; opacity: 0; transform: translateY(50px); animation: slideUpFade 0.8s ease forwards 0.3s;">
                            <div style="margin: 40px 0;">
                                <div style="font-size: 8rem; animation: bounceIn 0.6s ease 0.5s forwards, rotateBronze 2s ease-in-out 1s infinite;">
                                    🥉
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(145deg, rgba(205, 127, 50, 0.3), rgba(205, 127, 50, 0.1)); 
                                        padding: 35px 25px; 
                                        border-radius: 20px; 
                                        border: 4px solid var(--bronze);
                                        max-width: 400px;
                                        margin: 0 auto;
                                        box-shadow: 0 10px 30px rgba(205, 127, 50, 0.3);">
                                <div style="font-weight: bold; font-size: 2rem; margin: 20px 0; color: var(--bronze);">
                                    ${third.name || 'Sin nombre'}
                                </div>
                                <div style="color: var(--bronze); font-size: 1.8rem; font-weight: bold; margin-bottom: 15px;">
                                    ${third.votes || 0} votos
                                </div>
                                <div style="color: var(--silver); font-size: 1.3rem; font-style: italic;">
                                    Tercer lugar
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Paso 2: Revelar 2do lugar (plata) - CENTRADO
        else if (revealedStep === 2 && second) {
            container.innerHTML = `
                <div style="max-width: 900px; margin: 0 auto;">
                    <h3 style="color: var(--silver); font-size: 2.2rem; margin-bottom: 40px; text-align: center;">
                        🥈 SEGUNDO LUGAR
                    </h3>
                    
                    <div style="display: flex; justify-content: center; align-items: flex-end; gap: 50px; margin: 40px 0;">
                        <!-- 3er lugar (más pequeño) -->
                        <div style="text-align: center; width: 200px; opacity: 0.8; transform: scale(0.9);">
                            <div style="height: 120px; display: flex; align-items: flex-end; justify-content: center;">
                                <div style="font-size: 4rem;">🥉</div>
                            </div>
                            <div style="background: linear-gradient(145deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05)); 
                                        padding: 20px 15px; 
                                        border-radius: 15px; 
                                        margin-top: 20px; 
                                        border: 2px solid var(--bronze);">
                                <div style="font-weight: bold; font-size: 1.3rem; color: var(--bronze); margin-bottom: 8px;">
                                    ${third.name || 'Sin nombre'}
                                </div>
                                <div style="color: var(--bronze); font-size: 1.1rem;">
                                    ${third.votes || 0} votos
                                </div>
                            </div>
                        </div>
                        
                        <!-- 2do lugar (centro, más grande) -->
                        <div style="text-align: center; width: 250px; opacity: 0; transform: translateY(50px); animation: slideUpFade 0.8s ease forwards 0.3s;">
                            <div style="margin: 30px 0;">
                                <div style="font-size: 9rem; animation: bounceIn 0.6s ease 0.5s forwards, rotateSilver 2s ease-in-out 1s infinite;">
                                    🥈
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(145deg, rgba(192, 192, 192, 0.3), rgba(192, 192, 192, 0.1)); 
                                        padding: 35px 25px; 
                                        border-radius: 20px; 
                                        border: 4px solid var(--silver);
                                        box-shadow: 0 10px 30px rgba(192, 192, 192, 0.3);">
                                <div style="font-weight: bold; font-size: 2rem; margin: 20px 0; color: var(--silver);">
                                    ${second.name || 'Sin nombre'}
                                </div>
                                <div style="color: var(--silver); font-size: 1.8rem; font-weight: bold; margin-bottom: 15px;">
                                    ${second.votes || 0} votos
                                </div>
                                <div style="color: var(--silver); font-size: 1.3rem; font-style: italic;">
                                    Segundo lugar
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Paso 3: Revelar 1er lugar (oro) - CENTRADO
        else if (revealedStep === 3 && winner) {
            container.innerHTML = `
                <div style="max-width: 1000px; margin: 0 auto;">
                    <h3 style="color: var(--gold); font-size: 2.5rem; margin-bottom: 40px; text-align: center; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
                        🥇 ¡PRIMER LUGAR!
                    </h3>
                    
                    <div style="display: flex; justify-content: center; align-items: flex-end; gap: 40px; margin: 40px 0;">
                        <!-- 3er lugar -->
                        <div style="text-align: center; width: 200px; opacity: 0.8; transform: scale(0.9);">
                            <div style="height: 120px; display: flex; align-items: flex-end; justify-content: center;">
                                <div style="font-size: 4rem;">🥉</div>
                            </div>
                            <div style="background: linear-gradient(145deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05)); 
                                        padding: 20px 15px; 
                                        border-radius: 15px; 
                                        margin-top: 20px; 
                                        border: 2px solid var(--bronze);">
                                <div style="font-weight: bold; font-size: 1.3rem; color: var(--bronze); margin-bottom: 8px;">
                                    ${third.name || 'Sin nombre'}
                                </div>
                                <div style="color: var(--bronze); font-size: 1.1rem;">
                                    ${third.votes || 0} votos
                                </div>
                            </div>
                        </div>
                        
                        <!-- 1er lugar (GRANDE, CENTRO) -->
                        <div style="text-align: center; width: 300px; opacity: 0; transform: translateY(50px); animation: slideUpFade 0.8s ease forwards 0.3s;">
                            <div style="margin: 40px 0;">
                                <div style="font-size: 12rem; 
                                            animation: bounceIn 0.6s ease 0.5s forwards, 
                                                       goldGlow 2s ease-in-out infinite, 
                                                       float 3s ease-in-out infinite;
                                            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.7));">
                                    🥇
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(145deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1)); 
                                        padding: 40px 30px; 
                                        border-radius: 25px; 
                                        border: 5px solid var(--gold);
                                        box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4),
                                                    inset 0 0 30px rgba(255, 215, 0, 0.2);">
                                <div style="font-weight: bold; font-size: 2.5rem; margin: 25px 0; color: var(--gold); 
                                            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
                                    ${winner.name || 'Sin nombre'}
                                </div>
                                <div style="color: var(--gold); font-size: 2rem; font-weight: bold; margin-bottom: 20px;
                                            text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);">
                                    ${winner.votes || 0} votos
                                </div>
                                <div style="color: var(--gold); font-weight: bold; font-size: 1.5rem; 
                                            padding: 10px 20px;
                                            background: rgba(255, 215, 0, 0.2);
                                            border-radius: 10px;
                                            display: inline-block;">
                                    ¡GANADOR/A!
                                </div>
                            </div>
                        </div>
                        
                        <!-- 2do lugar -->
                        <div style="text-align: center; width: 200px; opacity: 0.8; transform: scale(0.9);">
                            <div style="height: 140px; display: flex; align-items: flex-end; justify-content: center;">
                                <div style="font-size: 5rem;">🥈</div>
                            </div>
                            <div style="background: linear-gradient(145deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.05)); 
                                        padding: 20px 15px; 
                                        border-radius: 15px; 
                                        margin-top: 20px; 
                                        border: 2px solid var(--silver);">
                                <div style="font-weight: bold; font-size: 1.3rem; color: var(--silver); margin-bottom: 8px;">
                                    ${second.name || 'Sin nombre'}
                                </div>
                                <div style="color: var(--silver); font-size: 1.1rem;">
                                    ${second.votes || 0} votos
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Confeti -->
                    <div style="margin: 50px 0; text-align: center;">
                        <div style="font-size: 3rem; animation: pulse 1s infinite; color: var(--gold);">
                            🎉 🎊 🏆 🎉 🎊
                        </div>
                    </div>
                    
                    <!-- Botón para ver resultados completos -->
                    <div style="text-align: center; margin-top: 30px;">
                        <button class="btn-reveal" style="font-size: 1.2rem; padding: 18px 35px;">
                            <i class="fas fa-chart-bar"></i> VER RESULTADOS COMPLETOS
                        </button>
                    </div>
                </div>
            `;
            
            // Agregar evento al botón
            container.querySelector('.btn-reveal').onclick = (e) => {
                e.stopPropagation();
                showFullResults(category, sortedNominees);
            };
        }
        
        // Paso 4: Mostrar todos los resultados
        else if (revealedStep >= 4) {
            showFullResults(category, sortedNominees);
            return;
        }
        
        // Añadir zona de clic para siguiente paso (excepto en último)
        if (revealedStep < 3) {
            updateClickZone(container);
        }
        
        nomineesList.appendChild(container);
    }
    
    // Función para actualizar zona de clic
    function updateClickZone(container) {
        setTimeout(() => {
            // Instrucción centrada
            const clickHint = document.createElement('div');
            clickHint.innerHTML = `
                <div style="margin-top: 50px; color: var(--gold); font-size: 1.2rem; 
                            animation: pulse 2s infinite; text-align: center;">
                    👇 Haz clic en cualquier lugar para continuar
                </div>
            `;
            
            if (container) {
                container.appendChild(clickHint);
            }
            
            // Hacer toda el área clickeable
            nomineesList.style.cursor = 'pointer';
            nomineesList.title = 'Haz clic para revelar el siguiente lugar';
            nomineesList.onclick = null;
            nomineesList.onclick = revealNextStep;
        }, 500);
    }
    

    // Función para mostrar resultados completos en 3 COLUMNAS (VERSIÓN COMPLETA)
    function showFullResults(category, sortedNominees) {
        nomineesList.innerHTML = '';
        
        // Crear contenedor principal
        const mainContainer = document.createElement('div');
        mainContainer.style.cssText = `
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        `;
        
        // Título
        const title = document.createElement('h3');
        title.innerHTML = `🏆 ${category.name || 'Categoría'} - Resultados Completos`;
        title.style.cssText = `
            color: var(--gold);
            text-align: center;
            margin-bottom: 40px;
            font-size: 2rem;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        `;
        mainContainer.appendChild(title);
        
        // Contenedor de 3 columnas
        const threeColumns = document.createElement('div');
        threeColumns.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 25px;
            width: 100%;
            min-height: 600px;
        `;
        
        // ===== COLUMNA IZQUIERDA: PODIO =====
        const leftColumn = document.createElement('div');
        leftColumn.style.cssText = `
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.8), rgba(15, 15, 25, 0.9));
            padding: 25px;
            border-radius: 20px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        let podiumHTML = '<h4 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.4rem;">🏆 PODIO OFICIAL</h4>';
        
        if (sortedNominees.length >= 3) {
            podiumHTML += `
                <div style="display: flex; flex-direction: column; gap: 25px;">
                    <!-- 1er lugar -->
                    <div style="background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(212, 175, 55, 0.1)); 
                                padding: 25px; 
                                border-radius: 15px; 
                                border: 3px solid var(--gold);
                                text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                            <div style="font-size: 3rem;">🥇</div>
                            <div>
                                <div style="font-weight: bold; color: var(--gold); font-size: 1.5rem;">${sortedNominees[0].name}</div>
                                <div style="color: var(--gold); font-weight: bold; font-size: 1.3rem;">${sortedNominees[0].votes || 0} votos</div>
                            </div>
                        </div>
                        <div style="color: var(--gold); font-size: 1.1rem; font-weight: bold;">¡GANADOR/A!</div>
                    </div>
                    
                    <!-- 2do lugar -->
                    <div style="background: linear-gradient(145deg, rgba(192, 192, 192, 0.2), rgba(169, 169, 169, 0.1)); 
                                padding: 22px; 
                                border-radius: 15px; 
                                border: 2px solid var(--silver);
                                text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                            <div style="font-size: 2.5rem;">🥈</div>
                            <div>
                                <div style="font-weight: bold; color: var(--silver); font-size: 1.4rem;">${sortedNominees[1].name}</div>
                                <div style="color: var(--silver); font-weight: bold; font-size: 1.2rem;">${sortedNominees[1].votes || 0} votos</div>
                            </div>
                        </div>
                        <div style="color: var(--silver); font-size: 1rem;">Segundo lugar</div>
                    </div>
                    
                    <!-- 3er lugar -->
                    <div style="background: linear-gradient(145deg, rgba(205, 127, 50, 0.2), rgba(180, 110, 40, 0.1)); 
                                padding: 20px; 
                                border-radius: 15px; 
                                border: 2px solid var(--bronze);
                                text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                            <div style="font-size: 2rem;">🥉</div>
                            <div>
                                <div style="font-weight: bold; color: var(--bronze); font-size: 1.3rem;">${sortedNominees[2].name}</div>
                                <div style="color: var(--bronze); font-weight: bold; font-size: 1.1rem;">${sortedNominees[2].votes || 0} votos</div>
                            </div>
                        </div>
                        <div style="color: var(--bronze); font-size: 1rem;">Tercer lugar</div>
                    </div>
                </div>
            `;
        } else if (sortedNominees.length >= 2) {
            podiumHTML += `
                <div style="display: flex; flex-direction: column; gap: 25px;">
                    <div style="background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(212, 175, 55, 0.1)); 
                                padding: 25px; 
                                border-radius: 15px; 
                                border: 3px solid var(--gold);
                                text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 10px;">🥇</div>
                        <div style="font-weight: bold; color: var(--gold); font-size: 1.5rem;">${sortedNominees[0].name}</div>
                        <div style="color: var(--gold); font-weight: bold; font-size: 1.3rem;">${sortedNominees[0].votes || 0} votos</div>
                    </div>
                    
                    <div style="background: linear-gradient(145deg, rgba(192, 192, 192, 0.2), rgba(169, 169, 169, 0.1)); 
                                padding: 22px; 
                                border-radius: 15px; 
                                border: 2px solid var(--silver);
                                text-align: center;">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;">🥈</div>
                        <div style="font-weight: bold; color: var(--silver); font-size: 1.4rem;">${sortedNominees[1].name}</div>
                        <div style="color: var(--silver); font-weight: bold; font-size: 1.2rem;">${sortedNominees[1].votes || 0} votos</div>
                    </div>
                </div>
            `;
        } else if (sortedNominees.length >= 1) {
            podiumHTML += `
                <div style="text-align: center;">
                    <div style="background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(212, 175, 55, 0.1)); 
                                padding: 30px; 
                                border-radius: 15px; 
                                border: 3px solid var(--gold);
                                display: inline-block;
                                min-width: 200px;">
                        <div style="font-size: 4rem; margin-bottom: 15px;">🏆</div>
                        <div style="font-weight: bold; color: var(--gold); font-size: 1.8rem;">${sortedNominees[0].name}</div>
                        <div style="color: var(--gold); font-weight: bold; font-size: 1.5rem; margin: 10px 0;">${sortedNominees[0].votes || 0} votos</div>
                        <div style="color: var(--gold); font-weight: bold; font-size: 1.2rem;">¡Único participante!</div>
                    </div>
                </div>
            `;
        } else {
            podiumHTML += '<div style="text-align: center; color: var(--silver); padding: 40px;">No hay votos registrados</div>';
        }
        
        // Estadísticas del podio
        const totalVotes = sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0);
        const totalVoters = sortedNominees.reduce((sum, n) => sum + ((n.voters || []).length), 0);
        
        podiumHTML += `
            <div style="margin-top: 30px; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 12px;">
                <div style="color: var(--silver); font-size: 1.1rem; margin-bottom: 10px; text-align: center;">
                    <strong>📊 Estadísticas:</strong>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="color: var(--silver); font-size: 0.95rem;">Total votos:</div>
                    <div style="color: var(--gold); font-weight: bold; text-align: right;">${totalVotes}</div>
                    
                    <div style="color: var(--silver); font-size: 0.95rem;">Votantes únicos:</div>
                    <div style="color: var(--silver); text-align: right;">${totalVoters}</div>
                    
                    <div style="color: var(--silver); font-size: 0.95rem;">Participantes:</div>
                    <div style="color: var(--silver); text-align: right;">${sortedNominees.length}</div>
                </div>
            </div>
        `;
        
        leftColumn.innerHTML = podiumHTML;
        
        // ===== COLUMNA CENTRAL: CLASIFICACIÓN COMPLETA =====
        const centerColumn = document.createElement('div');
        centerColumn.style.cssText = `
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.8), rgba(15, 15, 25, 0.9));
            padding: 25px;
            border-radius: 20px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
            max-height: 700px;
        `;
        
        let rankingHTML = '<h4 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.4rem;">📋 CLASIFICACIÓN COMPLETA</h4>';
        
        if (sortedNominees.length > 0) {
            rankingHTML += `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                    ${sortedNominees.map((nominee, index) => {
                        const position = index + 1;
                        const isTop3 = position <= 3;
                        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🎯';
                        const color = position === 1 ? 'var(--gold)' : 
                                    position === 2 ? 'var(--silver)' : 
                                    position === 3 ? 'var(--bronze)' : 'var(--silver)';
                        const bgColor = position === 1 ? 'rgba(255, 215, 0, 0.1)' : 
                                      position === 2 ? 'rgba(192, 192, 192, 0.1)' : 
                                      position === 3 ? 'rgba(205, 127, 50, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                        
                        return `
                            <div style="background: ${bgColor}; 
                                        padding: 20px; 
                                        border-radius: 15px; 
                                        border: 2px solid ${isTop3 ? color : 'rgba(255, 215, 0, 0.2)'};
                                        text-align: center;
                                        transition: all 0.3s ease;
                                        cursor: pointer;"
                                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 30px rgba(0,0,0,0.4)';"
                                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
                                 onclick="alert('${nominee.name}: ${nominee.votes || 0} votos\\nPosición: ${position}º\\nVotantes: ${(nominee.voters || []).length}')">
                                <div style="font-size: 2.5rem; margin-bottom: 10px; color: ${color};">
                                    ${medal}
                                </div>
                                <div style="font-weight: bold; font-size: 1.3rem; color: ${color}; margin-bottom: 8px; word-break: break-word;">
                                    ${nominee.name}
                                </div>
                                <div style="color: ${color}; font-size: 1.5rem; font-weight: bold; margin: 10px 0;">
                                    ${nominee.votes || 0}
                                </div>
                                <div style="color: var(--silver); font-size: 0.9rem;">
                                    ${position}º lugar
                                </div>
                                <div style="color: #aaa; font-size: 0.8rem; margin-top: 5px;">
                                    ${(nominee.voters || []).length} votante${(nominee.voters || []).length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            rankingHTML += '<div style="text-align: center; color: var(--silver); padding: 60px;">No hay participantes en esta categoría</div>';
        }
        
        centerColumn.innerHTML = rankingHTML;
        
        // ===== COLUMNA DERECHA: FRASES O INFORMACIÓN ADICIONAL =====
        const rightColumn = document.createElement('div');
        rightColumn.style.cssText = `
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.8), rgba(15, 15, 25, 0.9));
            padding: 25px;
            border-radius: 20px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
            max-height: 700px;
        `;
        
        // Verificar si es categoría 17 (Frase del Año)
        if (category.id === 17) {
            const todasLasFrases = [];
            
            // Recoger todas las frases de todos los nominados
            sortedNominees.forEach(nominee => {
                if (nominee.frases && Object.keys(nominee.frases).length > 0) {
                    Object.values(nominee.frases).forEach(fraseData => {
                        todasLasFrases.push({
                            persona: nominee.name,
                            frase: fraseData.frase,
                            votante: fraseData.voter,
                            votos: nominee.votes || 0,
                            posicion: sortedNominees.findIndex(n => n.name === nominee.name) + 1
                        });
                    });
                }
            });
            
            // Ordenar frases por votos (las más votadas primero)
            todasLasFrases.sort((a, b) => b.votos - a.votos);
            
            let frasesHTML = '<h4 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.4rem;">💬 FRASES ICÓNICAS</h4>';
            
            if (todasLasFrases.length > 0) {
                frasesHTML += `
                    <div style="max-height: 600px; overflow-y: auto; padding-right: 10px;">
                        ${todasLasFrases.map((item, index) => {
                            const positionColor = item.posicion === 1 ? 'var(--gold)' : 
                                                item.posicion === 2 ? 'var(--silver)' : 
                                                item.posicion === 3 ? 'var(--bronze)' : 'var(--primary)';
                            
                            return `
                                <div style="margin-bottom: 20px; 
                                            padding: 20px; 
                                            background: rgba(0, 0, 0, 0.2); 
                                            border-radius: 12px; 
                                            border-left: 5px solid ${positionColor};
                                            transition: all 0.3s ease;"
                                     onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)';"
                                     onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                                    <div style="font-style: italic; 
                                                color: white; 
                                                margin-bottom: 15px; 
                                                font-size: 1.1rem; 
                                                line-height: 1.4;
                                                word-break: break-word;
                                                overflow-wrap: break-word;
                                                white-space: normal;">
                                        "${item.frase}"
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                        <div>
                                            <div style="font-weight: bold; color: ${positionColor}; font-size: 1.1rem;">
                                                ${item.persona}
                                            </div>
                                            <div style="color: var(--silver); font-size: 0.85rem;">
                                                Posición: ${item.posicion}º (${item.votos} votos)
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="color: var(--silver); font-size: 0.85rem;">Añadida por:</div>
                                            <div style="font-weight: bold; color: var(--silver); font-size: 0.9rem;">
                                                ${item.votante}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        
                        ${todasLasFrases.length > 10 ? `
                            <div style="text-align: center; margin-top: 20px; padding: 15px; color: var(--silver); 
                                        background: rgba(255, 215, 0, 0.1); border-radius: 10px; font-size: 0.9rem;">
                                Mostrando ${todasLasFrases.length} frases icónicas
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                frasesHTML += `
                    <div style="text-align: center; padding: 60px 20px; color: var(--silver);">
                        <div style="font-size: 3rem; margin-bottom: 20px;">💭</div>
                        <div style="font-size: 1.2rem; margin-bottom: 15px;">No hay frases añadidas</div>
                        <div style="color: #aaa; font-size: 0.9rem;">
                            Los votantes no añadieron frases<br>en esta categoría
                        </div>
                    </div>
                `;
            }
            
            rightColumn.innerHTML = frasesHTML;
        } else {
            // Para otras categorías, mostrar información adicional
            const totalVotes = sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0);
            const uniqueVoters = new Set();
            sortedNominees.forEach(n => (n.voters || []).forEach(v => uniqueVoters.add(v)));
            const participationRate = appData.users ? ((uniqueVoters.size / appData.users.length) * 100).toFixed(1) : 0;
            
            rightColumn.innerHTML = `
                <h4 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.4rem;">📈 INFORMACIÓN ADICIONAL</h4>
                
                <div style="padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 15px; margin-bottom: 25px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                        <div style="color: var(--silver);">Categoría:</div>
                        <div style="color: var(--gold); font-weight: bold; text-align: right;">${category.name}</div>
                        
                        <div style="color: var(--silver);">Total votos:</div>
                        <div style="color: var(--gold); font-weight: bold; text-align: right;">${totalVotes}</div>
                        
                        <div style="color: var(--silver);">Participantes:</div>
                        <div style="color: var(--silver); text-align: right;">${sortedNominees.length}</div>
                        
                        <div style="color: var(--silver);">Votantes únicos:</div>
                        <div style="color: var(--silver); text-align: right;">${uniqueVoters.size}</div>
                        
                        <div style="color: var(--silver);">Tasa participación:</div>
                        <div style="color: ${participationRate > 50 ? '#4CAF50' : '#FFD700'}; font-weight: bold; text-align: right;">
                            ${participationRate}%
                        </div>
                    </div>
                </div>
                
                <div style="padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 15px;">
                    <h5 style="color: var(--silver); margin-bottom: 15px; font-size: 1.1rem;">🏅 Distribución de votos:</h5>
                    ${sortedNominees.slice(0, 5).map((nominee, index) => {
                        const percentage = totalVotes > 0 ? ((nominee.votes / totalVotes) * 100).toFixed(1) : 0;
                        return `
                            <div style="margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="color: var(--silver); font-size: 0.9rem;">${index + 1}. ${nominee.name}</span>
                                    <span style="color: var(--gold); font-size: 0.9rem; font-weight: bold;">${percentage}%</span>
                                </div>
                                <div style="height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, var(--gold), var(--gold-dark));"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${sortedNominees.length > 5 ? `
                        <div style="text-align: center; margin-top: 15px; color: var(--silver); font-size: 0.9rem;">
                            + ${sortedNominees.length - 5} participantes más
                        </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                    <div style="color: var(--silver); font-size: 0.9rem; margin-bottom: 10px;">
                        Fase actual: <span style="color: var(--gold); font-weight: bold;">Resultados</span>
                    </div>
                    <div style="color: #aaa; font-size: 0.8rem;">
                        Actualizado: ${new Date().toLocaleString()}
                    </div>
                </div>
            `;
        }
        
        // Añadir columnas al contenedor
        threeColumns.appendChild(leftColumn);
        threeColumns.appendChild(centerColumn);
        threeColumns.appendChild(rightColumn);
        
        mainContainer.appendChild(threeColumns);
        nomineesList.appendChild(mainContainer);
        
        // Ocultar sección de añadir nuevo nominado
        const addSection = document.querySelector('.add-nominee-section');
        if (addSection) {
            addSection.style.display = 'none';
        }
        
        // Restaurar cursor normal
        nomineesList.style.cursor = 'default';
        nomineesList.onclick = null;
    }
    
    // Empezar con paso 0
    revealNextStep();
    
    // Mostrar modal
    modal.style.display = 'block';
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