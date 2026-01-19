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
        
        // Usar evento onclick CORRECTO
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        
        // HTML CORREGIDO - Estructura limpia
        nomineeItem.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                ${photoUrl ? 
                    `<img src="${photoUrl}" class="nominee-photo" alt="${nominee.name}" 
                         onerror="this.onerror=null; this.style.display='none'; 
                         this.parentElement.querySelector('.nominee-avatar').style.display='flex';">` : 
                    ''
                }
                ${!photoUrl ? `
                    <div class="nominee-avatar" style="display: ${photoUrl ? 'none' : 'flex'};">
                        <i class="fas fa-user"></i>
                    </div>
                ` : ''}
                
                <h4 class="nominee-name">${nominee.name}</h4>
                
                ${hasVoted ? 
                    '<div class="voted-check">⭐ Tú votaste aquí</div>' : 
                    ''
                }
                ${isVoted ? 
                    '<div class="voted-check">✅ Tu voto actual</div>' : 
                    ''
                }
                
                <div class="nominee-actions">
                    <button class="vote-btn ${isVoted ? 'voted' : ''}" 
                            onclick="voteForNominee('${nominee.name}')">
                        <i class="fas ${isVoted ? 'fa-check' : 'fa-vote-yea'}"></i>
                        ${isVoted ? 'Votado' : 'Votar'}
                    </button>
                </div>
            </div>
        `;
        
        // Añadir frases existentes (solo para Frase del Año)
        if (category.id === 17 && nominee.frases && Object.keys(nominee.frases).length > 0) {
            const frasesDiv = document.createElement('div');
            frasesDiv.className = 'existing-frases';
            frasesDiv.style.marginTop = '10px';
            
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
            nomineeItem.querySelector('div').appendChild(frasesDiv);
        }
        
        nomineesList.appendChild(nomineeItem);
    });
    
    // Limpiar preview de foto
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) photoPreview.innerHTML = '';
    const newNomineeName = document.getElementById('newNomineeName');
    if (newNomineeName) newNomineeName.value = '';
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


// ===== SISTEMA DRAMÁTICO CON CLICK Y POSICIONES VERTICALES =====
let currentRevealStep = 0;
let top3 = [];

async function showCategoryResults(categoryId) {
    console.log("🎭 Iniciando revelación dramática para categoría:", categoryId);
    
    const category = appData.categories.find(c => c && c.id === categoryId);
    if (!category) return;
    
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    if (!modal || !modalCategory || !nomineesList) return;
    
    // Resetear variables
    currentRevealStep = 0;
    
    // Obtener top 3
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    top3 = sortedNominees.slice(0, 3);
    const hasVotes = sortedNominees.some(n => (n.votes || 0) > 0);
    
    // Si no hay votos, mostrar mensaje
    if (!hasVotes) {
        nomineesList.innerHTML = `
            <div style="padding: 60px; text-align: center;">
                <div style="font-size: 5rem; color: var(--silver); margin-bottom: 20px;">📊</div>
                <h3 style="color: var(--silver); margin-bottom: 15px; font-size: 1.5rem;">Sin votos aún</h3>
                <p style="color: var(--silver); opacity: 0.8;">No hay votos registrados en esta categoría</p>
            </div>
        `;
        modal.style.display = 'block';
        return;
    }
    
    // ===== PANTALLA 1: CUENTA REGRESIVA (3-2-1) =====
    showCountdownScreen(category);
    
    // Mostrar modal
    modal.style.display = 'block';
}

// ===== PANTALLA DE CUENTA REGRESIVA =====
function showCountdownScreen(category) {
    const nomineesList = document.getElementById('nomineesList');
    const modalCategory = document.getElementById('modalCategory');
    
    modalCategory.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: var(--gold); margin-bottom: 10px; font-size: 2rem;">${category.name}</h2>
            ${category.description ? 
                `<p style="color: var(--silver); font-size: 1.1rem; max-width: 600px; margin: 0 auto;">${category.description}</p>` 
                : ''
            }
        </div>
    `;
    
    nomineesList.innerHTML = `
        <div id="countdownScreen" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            padding: 40px;
            text-align: center;
            width: 100%;
        ">
            <div class="countdown-container" style="max-width: 600px; margin: 0 auto;">
                <h3 style="color: var(--gold); font-size: 2rem; margin-bottom: 40px; letter-spacing: 3px;">
                    🎬 PREPARÁNDOSE PARA LA REVELACIÓN 🎬
                </h3>
                
                <!-- Contador principal -->
                <div id="countdownDisplay" style="
                    font-size: 8rem;
                    color: var(--gold);
                    font-weight: bold;
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 40px 0;
                    text-shadow: 0 0 30px currentColor;
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                ">
                    3
                </div>
                
                <div style="color: var(--silver); font-size: 1.3rem; margin-top: 30px;">
                    La revelación comenzará en...
                </div>
                
                <!-- Indicador de clic -->
                <div id="clickToContinue" style="
                    margin-top: 60px;
                    opacity: 0;
                    animation: fadeIn 1s ease-out 3.5s forwards;
                ">
                    <div style="color: var(--silver); margin-bottom: 20px; font-size: 1.1rem;">
                        <i class="fas fa-mouse-pointer" style="color: var(--gold);"></i>
                        Haz clic en cualquier parte para continuar
                    </div>
                    <div style="
                        width: 60px;
                        height: 60px;
                        border: 3px solid var(--gold);
                        border-radius: 50%;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: pulseClick 1.5s infinite;
                    ">
                        <i class="fas fa-hand-pointer" style="color: var(--gold); font-size: 1.5rem;"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Iniciar cuenta regresiva automática
    startCountdown();
}

// ===== CUENTA REGRESIVA AUTOMÁTICA 3-2-1 =====
function startCountdown() {
    const countdownDisplay = document.getElementById('countdownDisplay');
    let count = 3;
    
    const countdownInterval = setInterval(() => {
        // Efectos visuales y sonido
        countdownDisplay.style.transform = 'scale(1.3)';
        countdownDisplay.style.color = count === 3 ? '#FF6B6B' : count === 2 ? '#FFA726' : '#4CAF50';
        countdownDisplay.style.textShadow = `0 0 50px ${count === 3 ? '#FF6B6B' : count === 2 ? '#FFA726' : '#4CAF50'}`;
        
        // Sonido de tick
        playTickSound(count);
        
        setTimeout(() => {
            countdownDisplay.style.transform = 'scale(1)';
            countdownDisplay.style.color = 'var(--gold)';
            countdownDisplay.style.textShadow = '0 0 30px var(--gold)';
            
            count--;
            if (count >= 0) {
                countdownDisplay.textContent = count || '¡YA!';
            }
            
            if (count < 0) {
                clearInterval(countdownInterval);
                
                // Habilitar clic para continuar
                setTimeout(() => {
                    document.getElementById('countdownScreen').onclick = () => {
                        startVerticalReveal();
                    };
                }, 500);
            }
        }, 400);
    }, 1000);
}

// ===== INICIAR REVELACIÓN VERTICAL (al hacer clic) =====
function startVerticalReveal() {
    const nomineesList = document.getElementById('nomineesList');
    
    // Limpiar pantalla
    nomineesList.innerHTML = '';
    
    // Crear contenedor de revelación vertical
    const revealContainer = document.createElement('div');
    revealContainer.id = 'verticalRevealContainer';
    revealContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        min-height: 80vh;
        padding: 40px 20px 100px 20px;
        text-align: center;
        width: 100%;
        position: relative;
        overflow: hidden;
    `;
    
    // Línea vertical central
    const verticalLine = document.createElement('div');
    verticalLine.style.cssText = `
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        background: linear-gradient(to bottom, transparent, var(--gold), transparent);
        z-index: -1;
    `;
    revealContainer.appendChild(verticalLine);
    
    // Instrucciones
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        text-align: center;
        color: var(--silver);
        font-size: 1.1rem;
        z-index: 10;
    `;
    instructions.innerHTML = `
        <div style="margin-bottom: 10px;">
            <i class="fas fa-mouse-pointer" style="color: var(--gold);"></i>
            Haz clic para revelar cada posición
        </div>
        <div style="
            width: 40px;
            height: 40px;
            border: 2px solid var(--gold);
            border-radius: 50%;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulseClick 1.5s infinite;
        ">
            <i class="fas fa-hand-pointer" style="color: var(--gold); font-size: 1rem;"></i>
        </div>
    `;
    revealContainer.appendChild(instructions);
    
    // Contenedor para las posiciones (se llenará dinámicamente)
    const positionsContainer = document.createElement('div');
    positionsContainer.id = 'positionsContainer';
    positionsContainer.style.cssText = `
        display: flex;
        flex-direction: column-reverse; /* Orden inverso: 3, 2, 1 (de abajo arriba) */
        align-items: center;
        justify-content: flex-end;
        width: 100%;
        max-width: 500px;
        min-height: 500px;
        position: relative;
        margin-top: 60px;
    `;
    revealContainer.appendChild(positionsContainer);
    
    nomineesList.appendChild(revealContainer);
    
    // Configurar clic para avanzar
    revealContainer.onclick = () => {
        revealNextPosition();
    };
    
    // Inicializar estado
    currentRevealStep = 0;
}

// ===== REVELAR SIGUIENTE POSICIÓN (al hacer clic) =====
function revealNextPosition() {
    if (currentRevealStep >= top3.length) {
        // Si ya revelamos todos, mostrar botón para podio
        showPodiumButtonAfterReveal();
        return;
    }
    
    const positionsContainer = document.getElementById('positionsContainer');
    const currentPosition = currentRevealStep;
    const nominee = top3[currentPosition];
    
    // Determinar posición (3, 2, 1)
    const positionNumber = 3 - currentRevealStep; // 3, 2, 1
    const positionNames = ['TERCER LUGAR', 'SEGUNDO LUGAR', '¡PRIMER LUGAR!'];
    const medalTypes = ['bronze', 'silver', 'gold'];
    const medalEmojis = ['🥉', '🥈', '🥇'];
    
    // Crear elemento de posición
    const positionElement = document.createElement('div');
    positionElement.className = 'position-element';
    positionElement.style.cssText = `
        background: ${getMedalColor(medalTypes[currentPosition], 0.15)};
        border: 3px solid ${getMedalColor(medalTypes[currentPosition], 1)};
        border-radius: 20px;
        padding: 25px 30px;
        margin: 20px 0;
        width: 90%;
        max-width: 400px;
        transform: translateY(50px);
        opacity: 0;
        transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        z-index: ${10 - currentPosition};
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    // Contenido de la posición
    positionElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            <!-- Medalla -->
            <div style="
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: ${getMedalColor(medalTypes[currentPosition], 0.2)};
                border: 3px solid ${getMedalColor(medalTypes[currentPosition], 1)};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.2rem;
                flex-shrink: 0;
            ">
                ${medalEmojis[currentPosition]}
            </div>
            
            <!-- Información -->
            <div style="text-align: left; flex: 1;">
                <div style="
                    color: ${getMedalColor(medalTypes[currentPosition], 1)};
                    font-weight: bold;
                    font-size: 1.2rem;
                    margin-bottom: 5px;
                ">
                    ${positionNames[currentPosition]}
                </div>
                <div style="
                    color: white;
                    font-size: 1.8rem;
                    font-weight: bold;
                    margin: 5px 0;
                ">
                    ${nominee.name}
                </div>
                <div style="
                    color: ${getMedalColor(medalTypes[currentPosition], 1)};
                    font-size: 1.8rem;
                    font-weight: bold;
                    margin: 10px 0;
                ">
                    ${nominee.votes || 0} VOTOS
                </div>
            </div>
        </div>
        
        <!-- Efecto especial para el ganador -->
        ${currentPosition === 2 ? `
            <div style="
                margin-top: 15px;
                padding: 12px;
                background: rgba(255, 215, 0, 0.15);
                border-radius: 15px;
                border: 1px solid var(--gold);
                animation: pulse 2s infinite;
            ">
                <div style="
                    color: var(--gold);
                    font-size: 1.1rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">
                    🎊 ¡¡GANADOR/A ABSOLUTO/A!! 🎊
                </div>
            </div>
        ` : ''}
    `;
    
    // Añadir al contenedor (al principio para que se apilen de abajo arriba)
    positionsContainer.insertBefore(positionElement, positionsContainer.firstChild);
    
    // Animar entrada
    setTimeout(() => {
        positionElement.style.transform = 'translateY(0)';
        positionElement.style.opacity = '1';
        
        // Efectos especiales
        playRevealSound(currentPosition);
        
        // Efecto de confeti para el ganador
        if (currentPosition === 2) {
            setTimeout(() => {
                createConfetti();
                playVictorySound();
            }, 300);
        }
        
        // Actualizar paso actual
        currentRevealStep++;
        
        // Actualizar instrucciones
        updateRevealInstructions();
    }, 100);
}

// ===== ACTUALIZAR INSTRUCCIONES DURANTE LA REVELACIÓN =====
function updateRevealInstructions() {
    const instructions = document.querySelector('#verticalRevealContainer > div[style*="position: absolute; top: 20px"]');
    
    if (instructions && currentRevealStep < top3.length) {
        const remaining = top3.length - currentRevealStep;
        instructions.innerHTML = `
            <div style="margin-bottom: 10px;">
                <i class="fas fa-mouse-pointer" style="color: var(--gold);"></i>
                Haz clic para revelar ${remaining} posición${remaining > 1 ? 'es' : ''} más
            </div>
            <div style="
                width: 40px;
                height: 40px;
                border: 2px solid var(--gold);
                border-radius: 50%;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulseClick 1.5s infinite;
            ">
                <i class="fas fa-hand-pointer" style="color: var(--gold); font-size: 1rem;"></i>
            </div>
        `;
    }
}

// ===== MOSTRAR BOTÓN PARA PODIO DESPUÉS DE LA REVELACIÓN =====
function showPodiumButtonAfterReveal() {
    const revealContainer = document.getElementById('verticalRevealContainer');
    
    // Remover evento de clic anterior
    revealContainer.onclick = null;
    
    // Crear contenedor para el botón
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        position: absolute;
        bottom: 40px;
        left: 0;
        right: 0;
        text-align: center;
        animation: slideUpFade 0.8s ease-out;
    `;
    
    buttonContainer.innerHTML = `
        <h4 style="color: var(--gold); margin-bottom: 20px; font-size: 1.4rem;">
            ¡Revelación completada! 🎉
        </h4>
        <button id="viewFullPodiumBtn" style="
            background: linear-gradient(45deg, var(--gold), var(--gold-dark));
            color: black;
            border: none;
            padding: 20px 50px;
            font-size: 1.3rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            letter-spacing: 1px;
            animation: pulse 1.5s infinite;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
        ">
            <i class="fas fa-trophy"></i> VER PODIO COMPLETO
        </button>
        <p style="color: var(--silver); margin-top: 15px; font-size: 0.9rem;">
            Descubre todos los detalles y estadísticas
        </p>
    `;
    
    revealContainer.appendChild(buttonContainer);
    
    // Configurar botón
    document.getElementById('viewFullPodiumBtn').onclick = () => {
        showFullPodiumAfterReveal();
    };
}

// ===== MOSTRAR PODIO FINAL (1º arriba, 2º y 3º abajo) =====
function showFullPodiumAfterReveal() {
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    const category = appData.categories.find(c => c && top3[0] && c.nominees?.some(n => n.name === top3[0].name));
    
    if (!category) return;
    
    const nominees = category.nominees || [];
    const sortedNominees = [...nominees]
        .filter(n => n && n.name)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    // Limpiar pantalla
    nomineesList.innerHTML = '';
    
    // Contenedor principal del podio
    const podiumContainer = document.createElement('div');
    podiumContainer.style.cssText = `
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
    `;
    
    // Encabezado
    podiumContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: var(--gold); font-size: 2.2rem; margin-bottom: 10px;">
                🏆 PODIO OFICIAL
            </h2>
            <h3 style="color: var(--silver); font-size: 1.5rem; margin-bottom: 20px;">
                ${category.name}
            </h3>
            ${category.description ? 
                `<p style="color: var(--silver); font-size: 1.1rem; max-width: 800px; margin: 0 auto 30px auto;">
                    ${category.description}
                </p>` 
                : ''
            }
        </div>
    `;
    
    // ===== SECCIÓN 1: PODIO VERTICAL (1º arriba, 2º y 3º abajo) =====
    const podiumSection = document.createElement('div');
    podiumSection.style.cssText = `
        background: linear-gradient(145deg, rgba(30, 30, 50, 0.8), rgba(15, 15, 25, 0.9));
        border-radius: 25px;
        padding: 40px;
        margin-bottom: 40px;
        border: 2px solid var(--gold);
        box-shadow: 0 10px 40px rgba(255, 215, 0, 0.2);
        position: relative;
        min-height: 500px;
    `;
    
    // Líneas decorativas
    podiumSection.innerHTML = `
        <div style="
            position: absolute;
            top: 100px;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            background: linear-gradient(to bottom, var(--gold), transparent);
            z-index: 1;
        "></div>
    `;
    
    // Contenedor para el podio
    const podiumVisual = document.createElement('div');
    podiumVisual.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 500px;
        position: relative;
        z-index: 2;
    `;
    
    // 1er LUGAR (ARRIBA - EN EL CENTRO)
    if (sortedNominees[0]) {
        const firstPlace = document.createElement('div');
        firstPlace.style.cssText = `
            width: 100%;
            max-width: 400px;
            text-align: center;
            animation: float 3s ease-in-out infinite;
            margin-top: 30px;
        `;
        
        firstPlace.innerHTML = `
            <div style="
                background: linear-gradient(145deg, rgba(255, 215, 0, 0.25), rgba(212, 175, 55, 0.2));
                border: 4px solid var(--gold);
                border-radius: 25px;
                padding: 35px 25px;
                position: relative;
                box-shadow: 0 15px 40px rgba(255, 215, 0, 0.3);
            ">
                <div style="font-size: 5rem; margin-bottom: 20px; animation: goldGlow 2s infinite alternate;">🥇</div>
                <h4 style="
                    background: linear-gradient(45deg, var(--gold), #FFEE80);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    font-size: 2rem;
                    margin: 20px 0;
                    font-weight: bold;
                ">
                    ${sortedNominees[0].name}
                </h4>
                <div style="color: var(--gold); font-size: 3rem; font-weight: bold; margin: 20px 0;">
                    ${sortedNominees[0].votes || 0}
                </div>
                <div style="color: var(--gold); font-size: 1.1rem; font-weight: bold;">
                    VOTOS
                </div>
                <div style="
                    margin-top: 20px;
                    padding: 12px;
                    background: rgba(255, 215, 0, 0.15);
                    border-radius: 15px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                ">
                    <div style="color: var(--gold); font-weight: bold; font-size: 1rem;">
                        ¡¡GANADOR/A ABSOLUTO/A!!
                    </div>
                </div>
            </div>
        `;
        podiumVisual.appendChild(firstPlace);
    }
    
    // CONTENEDOR PARA 2º Y 3º (ABAJO - EN LÍNEA)
    const secondThirdContainer = document.createElement('div');
    secondThirdContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 60px;
        width: 100%;
        margin-top: auto;
        margin-bottom: 30px;
        flex-wrap: wrap;
    `;
    
    // 2do LUGAR (IZQUIERDA)
    if (sortedNominees[1]) {
        const secondPlace = document.createElement('div');
        secondPlace.style.cssText = `
            flex: 1;
            max-width: 300px;
            text-align: center;
            animation: slideInFromLeft 0.8s ease-out 0.2s both;
        `;
        
        secondPlace.innerHTML = `
            <div style="
                background: linear-gradient(145deg, rgba(192, 192, 192, 0.2), rgba(150, 150, 150, 0.1));
                border: 3px solid var(--silver);
                border-radius: 20px;
                padding: 30px 20px;
                position: relative;
            ">
                <div style="font-size: 4rem; margin-bottom: 20px;">🥈</div>
                <h4 style="color: var(--silver); font-size: 1.6rem; margin: 15px 0; font-weight: bold;">
                    ${sortedNominees[1].name}
                </h4>
                <div style="color: var(--silver); font-size: 2.5rem; font-weight: bold; margin: 15px 0;">
                    ${sortedNominees[1].votes || 0}
                </div>
                <div style="color: var(--silver); font-size: 1rem;">
                    VOTOS
                </div>
                <div style="
                    margin-top: 15px;
                    padding: 8px;
                    background: rgba(192, 192, 192, 0.1);
                    border-radius: 10px;
                    border: 1px solid rgba(192, 192, 192, 0.3);
                ">
                    <div style="color: var(--silver); font-weight: bold;">
                        SEGUNDO LUGAR
                    </div>
                </div>
            </div>
        `;
        secondThirdContainer.appendChild(secondPlace);
    }
    
    // 3er LUGAR (DERECHA)
    if (sortedNominees[2]) {
        const thirdPlace = document.createElement('div');
        thirdPlace.style.cssText = `
            flex: 1;
            max-width: 300px;
            text-align: center;
            animation: slideInFromRight 0.8s ease-out 0.4s both;
        `;
        
        thirdPlace.innerHTML = `
            <div style="
                background: linear-gradient(145deg, rgba(205, 127, 50, 0.2), rgba(180, 110, 40, 0.1));
                border: 3px solid var(--bronze);
                border-radius: 20px;
                padding: 30px 20px;
                position: relative;
            ">
                <div style="font-size: 3.5rem; margin-bottom: 20px;">🥉</div>
                <h4 style="color: var(--bronze); font-size: 1.6rem; margin: 15px 0; font-weight: bold;">
                    ${sortedNominees[2].name}
                </h4>
                <div style="color: var(--bronze); font-size: 2.5rem; font-weight: bold; margin: 15px 0;">
                    ${sortedNominees[2].votes || 0}
                </div>
                <div style="color: var(--bronze); font-size: 1rem;">
                    VOTOS
                </div>
                <div style="
                    margin-top: 15px;
                    padding: 8px;
                    background: rgba(205, 127, 50, 0.1);
                    border-radius: 10px;
                    border: 1px solid rgba(205, 127, 50, 0.3);
                ">
                    <div style="color: var(--bronze); font-weight: bold;">
                        TERCER LUGAR
                    </div>
                </div>
            </div>
        `;
        secondThirdContainer.appendChild(thirdPlace);
    }
    
    podiumVisual.appendChild(secondThirdContainer);
    podiumSection.appendChild(podiumVisual);
    podiumContainer.appendChild(podiumSection);
    
    // ===== SECCIÓN 2: TABLA DE TODOS LOS PARTICIPANTES =====
    const tableSection = document.createElement('div');
    tableSection.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 30px;
        margin-bottom: 40px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    let tableHTML = `
        <h3 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.8rem;">
            📊 CLASIFICACIÓN COMPLETA
        </h3>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                <thead>
                    <tr style="background: rgba(255, 215, 0, 0.1);">
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">POSICIÓN</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">PARTICIPANTE</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">VOTOS</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">PORCENTAJE</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">MEDALLA</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const totalVotes = sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0);
    
    sortedNominees.forEach((nominee, index) => {
        const percentage = totalVotes > 0 ? ((nominee.votes || 0) / totalVotes * 100).toFixed(1) : "0.0";
        let medal = "";
        
        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";
        
        const rowColor = index < 3 ? 
            index === 0 ? "rgba(255, 215, 0, 0.1)" : 
            index === 1 ? "rgba(192, 192, 192, 0.1)" : 
            "rgba(205, 127, 50, 0.1)" : "transparent";
        
        tableHTML += `
            <tr style="background: ${rowColor}; ${index < 3 ? 'font-weight: bold;' : ''}">
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
                          color: ${index < 3 ? getMedalColor(index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze', 1) : 'var(--silver)'}; 
                          font-size: ${index < 3 ? '1.2rem' : '1rem'}">
                    ${index + 1}
                </td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: white; font-size: ${index < 3 ? '1.1rem' : '1rem'}">
                    ${nominee.name}
                </td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
                          font-weight: bold; 
                          color: ${index < 3 ? getMedalColor(index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze', 1) : 'white'};
                          font-size: ${index < 3 ? '1.3rem' : '1rem'}">
                    ${nominee.votes || 0}
                </td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                            <div style="
                                height: 100%; 
                                width: ${percentage}%; 
                                background: ${index === 0 ? 'var(--gold)' : index === 1 ? 'var(--silver)' : index === 2 ? 'var(--bronze)' : '#667eea'};
                                border-radius: 4px;
                                transition: width 1s ease-in-out;
                            "></div>
                        </div>
                        <span style="color: var(--silver); min-width: 40px; font-size: ${index < 3 ? '1rem' : '0.9rem'}">${percentage}%</span>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: center; font-size: 1.2rem;">${medal}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; color: var(--silver); text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
            <p style="margin: 5px 0;">Total de votos: <strong style="color: var(--gold); font-size: 1.2rem;">${totalVotes}</strong></p>
            <p style="margin: 5px 0;">Participantes: <strong>${sortedNominees.length}</strong></p>
            <p style="margin: 5px 0;">Participantes con votos: <strong>${sortedNominees.filter(n => (n.votes || 0) > 0).length}</strong></p>
        </div>
    `;
    
    tableSection.innerHTML = tableHTML;
    podiumContainer.appendChild(tableSection);
    
    // ===== SECCIÓN 3: FRASES ICÓNICAS (solo categoría 17) =====
    if (category.id === 17) {
        const phrases = getAllPhrasesForCategory(sortedNominees);
        if (phrases.length > 0) {
            const phrasesSection = document.createElement('div');
            phrasesSection.style.cssText = `
                background: linear-gradient(145deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 30px;
                border: 1px solid rgba(102, 126, 234, 0.3);
            `;
            
            phrasesSection.innerHTML = `
                <h3 style="color: #667eea; text-align: center; margin-bottom: 30px; font-size: 1.8rem;">
                    💬 FRASES ICÓNICAS REGISTRADAS
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${phrases.map((phrase, index) => `
                        <div class="phrase-card" style="
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 15px;
                            padding: 20px;
                            border-left: 4px solid #667eea;
                            animation: slideUpFade 0.5s ease-out ${index * 0.1}s both;
                            transition: transform 0.3s ease;
                        ">
                            <div style="color: white; font-style: italic; font-size: 1.1rem; margin-bottom: 15px; line-height: 1.4;">
                                "${phrase.frase}"
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: #667eea; font-weight: bold; font-size: 0.9rem;">${phrase.persona}</div>
                                    <div style="color: var(--silver); font-size: 0.8rem;">Añadida por: ${phrase.votante}</div>
                                </div>
                                <div style="color: var(--silver); font-size: 0.8rem; font-weight: bold;">${phrase.votos} votos</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${phrases.length > 6 ? `
                    <div style="text-align: center; margin-top: 20px; color: var(--silver); font-style: italic;">
                        <i class="fas fa-ellipsis-h"></i> ${phrases.length} frases icónicas registradas
                    </div>
                ` : ''}
            `;
            
            podiumContainer.appendChild(phrasesSection);
        }
    }
    
    // Botones de navegación
    const navigationSection = document.createElement('div');
    navigationSection.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 40px;
        flex-wrap: wrap;
    `;
    
    navigationSection.innerHTML = `
        <button onclick="closeModal()" style="
            background: linear-gradient(45deg, rgba(255, 71, 87, 0.9), rgba(255, 0, 0, 0.9));
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.1rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <i class="fas fa-times"></i> CERRAR
        </button>
        
        <button onclick="showCategoryResults(${category.id})" style="
            background: linear-gradient(45deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.1rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <i class="fas fa-redo"></i> VER REVELACIÓN NUEVAMENTE
        </button>
        
        ${category.id === 17 ? `
            <button onclick="scrollToPhrases()" style="
                background: linear-gradient(45deg, rgba(76, 201, 240, 0.9), rgba(29, 209, 161, 0.9));
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 1.1rem;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-quote-right"></i> VER FRASES
            </button>
        ` : ''}
    `;
    
    podiumContainer.appendChild(navigationSection);
    
    // Añadir al DOM
    nomineesList.appendChild(podiumContainer);
}

// ===== FUNCIONES AUXILIARES =====
function playTickSound(number) {
    if (window.AudioContext) {
        try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Frecuencia diferente para cada número
            const frequencies = {3: 800, 2: 1000, 1: 1200, 0: 1500};
            oscillator.frequency.value = frequencies[number] || 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log("Audio no disponible");
        }
    }
}

function playRevealSound(position) {
    if (window.AudioContext) {
        try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Frecuencia ascendente para cada revelación
            const frequencies = [600, 900, 1200];
            oscillator.frequency.value = frequencies[position] || 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        } catch (e) {}
    }
}

function scrollToPhrases() {
    const phrasesSection = document.querySelector('[style*="background: linear-gradient(145deg, rgba(102, 126, 234, 0.1)"]');
    if (phrasesSection) {
        phrasesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Efecto visual
        phrasesSection.style.boxShadow = '0 0 30px rgba(102, 126, 234, 0.5)';
        setTimeout(() => {
            phrasesSection.style.boxShadow = 'none';
        }, 2000);
    }
}

// ===== FUNCIÓN: ANIMACIÓN DE CUENTA REGRESIVA =====
async function countdownAnimation() {
    return new Promise(resolve => {
        const count3 = document.getElementById('count3');
        const count2 = document.getElementById('count2');
        const count1 = document.getElementById('count1');
        
        // Sonido de tick (opcional - puedes añadir sonidos reales)
        const playTickSound = () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            } catch (e) {
                console.log("Audio no disponible");
            }
        };
        
        // Animación secuencial
        setTimeout(() => {
            count3.style.transform = 'scale(2)';
            count3.style.color = '#FF6B6B';
            count3.style.textShadow = '0 0 30px #FF6B6B';
            playTickSound();
            
            setTimeout(() => {
                count3.style.transform = 'scale(1)';
                count3.style.color = 'var(--silver)';
                
                setTimeout(() => {
                    count2.style.transform = 'scale(2)';
                    count2.style.color = '#FFA726';
                    count2.style.textShadow = '0 0 30px #FFA726';
                    playTickSound();
                    
                    setTimeout(() => {
                        count2.style.transform = 'scale(1)';
                        count2.style.color = 'var(--silver)';
                        
                        setTimeout(() => {
                            count1.style.transform = 'scale(2)';
                            count1.style.color = '#4CAF50';
                            count1.style.textShadow = '0 0 30px #4CAF50';
                            playTickSound();
                            
                            setTimeout(() => {
                                count1.style.transform = 'scale(1)';
                                count1.style.color = 'var(--silver)';
                                
                                // Esperar un momento y continuar
                                setTimeout(resolve, 500);
                            }, 800);
                        }, 500);
                    }, 800);
                }, 500);
            }, 800);
        }, 1000);
    });
}

// ===== FUNCIÓN: REVELACIÓN SECUENCIAL DE GANADORES =====
async function revealWinnersSequentially(top3, category) {
    const nomineesList = document.getElementById('nomineesList');
    
    // Limpiar pantalla de cuenta regresiva
    nomineesList.innerHTML = '';
    
    // Contenedor para revelaciones
    const revealContainer = document.createElement('div');
    revealContainer.id = 'revealContainer';
    revealContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        padding: 40px;
        text-align: center;
        width: 100%;
    `;
    
    revealContainer.innerHTML = `
        <h3 style="color: var(--gold); font-size: 1.8rem; margin-bottom: 30px;">
            🎉 ¡REVELANDO GANADORES! 🎉
        </h3>
        <div id="revelationStages" style="width: 100%; max-width: 800px;"></div>
    `;
    
    nomineesList.appendChild(revealContainer);
    const stagesContainer = document.getElementById('revelationStages');
    
    // Revelar 3er lugar
    if (top3[2]) {
        await revealPosition(top3[2], "🥉 TERCER LUGAR", "bronze", 3);
    }
    
    // Revelar 2do lugar
    if (top3[1]) {
        await revealPosition(top3[1], "🥈 SEGUNDO LUGAR", "silver", 2);
    }
    
    // Revelar 1er lugar (con más drama)
    if (top3[0]) {
        await revealPosition(top3[0], "🥇 ¡PRIMER LUGAR!", "gold", 1);
    }
}

// ===== FUNCIÓN: REVELAR UNA POSICIÓN =====
async function revealPosition(nominee, title, medalType, position) {
    return new Promise(resolve => {
        const stagesContainer = document.getElementById('revelationStages');
        
        const positionDiv = document.createElement('div');
        positionDiv.className = 'position-reveal';
        positionDiv.style.cssText = `
            margin: 30px 0;
            padding: 25px;
            background: ${getMedalColor(medalType, 0.1)};
            border: 3px solid ${getMedalColor(medalType, 1)};
            border-radius: 20px;
            transform: translateY(50px);
            opacity: 0;
            transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        
        // Contenido inicial (oculto)
        positionDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                <div class="medal-placeholder" style="
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: ${getMedalColor(medalType, 1)};
                ">
                    ?
                </div>
                <div style="text-align: left;">
                    <h4 style="color: ${getMedalColor(medalType, 1)}; margin: 0; font-size: 1.3rem;">
                        ${title}
                    </h4>
                    <p style="color: var(--silver); margin: 5px 0 0 0; font-style: italic;">
                        Preparando revelación...
                    </p>
                </div>
            </div>
        `;
        
        stagesContainer.appendChild(positionDiv);
        
        // Animación de entrada
        setTimeout(() => {
            positionDiv.style.transform = 'translateY(0)';
            positionDiv.style.opacity = '1';
            
            // Efecto de sonido (opcional)
            if (window.AudioContext) {
                try {
                    const audioContext = new AudioContext();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = position === 1 ? 1200 : 1000;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.8);
                } catch (e) {}
            }
            
            // Revelar contenido después de 1 segundo
            setTimeout(() => {
                positionDiv.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                        <div class="medal-revealed" style="
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            background: ${getMedalColor(medalType, 0.2)};
                            border: 3px solid ${getMedalColor(medalType, 1)};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 2.5rem;
                            animation: medalGlow 2s infinite alternate;
                        ">
                            ${getMedalEmoji(medalType)}
                        </div>
                        <div style="text-align: left; flex: 1;">
                            <h4 style="color: ${getMedalColor(medalType, 1)}; margin: 0 0 10px 0; font-size: 1.5rem;">
                                ${title}
                            </h4>
                            <div style="color: white; font-size: 1.8rem; font-weight: bold; margin: 5px 0;">
                                ${nominee.name}
                            </div>
                            <div style="color: ${getMedalColor(medalType, 1)}; font-size: 2rem; font-weight: bold; margin: 10px 0;">
                                ${nominee.votes || 0} VOTOS
                            </div>
                            <div style="color: var(--silver); font-size: 0.9rem; margin-top: 5px;">
                                ¡Felicidades!
                            </div>
                        </div>
                    </div>
                    ${position === 1 ? `
                        <div style="
                            margin-top: 20px;
                            padding: 15px;
                            background: rgba(255, 215, 0, 0.1);
                            border-radius: 15px;
                            border: 1px solid var(--gold);
                            animation: pulse 2s infinite;
                        ">
                            <div style="color: var(--gold); font-size: 1.2rem; font-weight: bold;">
                                🎊 ¡¡GANADOR/A ABSOLUTO/A!! 🎊
                            </div>
                        </div>
                    ` : ''}
                `;
                
                // Efectos especiales para el ganador
                if (position === 1) {
                    setTimeout(() => {
                        createConfetti();
                        playVictorySound();
                    }, 300);
                }
                
                resolve();
            }, 1000);
        }, position === 3 ? 500 : position === 2 ? 1500 : 2500);
    });
}

// ===== FUNCIÓN: MOSTRAR BOTÓN PARA VER PODIO COMPLETO =====
function showPodiumButton(category, sortedNominees) {
    const stagesContainer = document.getElementById('revelationStages');
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        margin-top: 50px;
        padding: 30px;
        text-align: center;
        animation: fadeIn 1s ease-out;
    `;
    
    buttonContainer.innerHTML = `
        <h4 style="color: var(--gold); margin-bottom: 20px; font-size: 1.4rem;">
            ¿Quieres ver el podio completo con todos los detalles?
        </h4>
        <button id="viewFullPodiumBtn" class="btn-reveal" style="
            background: linear-gradient(45deg, var(--gold), var(--gold-dark));
            color: black;
            border: none;
            padding: 20px 50px;
            font-size: 1.3rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            letter-spacing: 1px;
            animation: pulse 1.5s infinite;
            transition: all 0.3s ease;
        ">
            <i class="fas fa-trophy"></i> VER PODIO COMPLETO
        </button>
        <p style="color: var(--silver); margin-top: 15px; font-size: 0.9rem;">
            Incluye: 📊 Votos de todos • 💬 Frases icónicas • 🏆 Estadísticas
        </p>
    `;
    
    stagesContainer.appendChild(buttonContainer);
    
    // Configurar botón
    document.getElementById('viewFullPodiumBtn').onclick = () => {
        showFullPodium(category, sortedNominees);
    };
}

// ===== FUNCIÓN: MOSTRAR PODIO COMPLETO =====
function showFullPodium(category, sortedNominees) {
    const nomineesList = document.getElementById('nomineesList');
    
    // Limpiar pantalla de revelación
    nomineesList.innerHTML = '';
    
    // Contenedor principal del podio
    const podiumContainer = document.createElement('div');
    podiumContainer.style.cssText = `
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
    `;
    
    // Encabezado
    podiumContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: var(--gold); font-size: 2.2rem; margin-bottom: 10px;">
                🏆 PODIO COMPLETO
            </h2>
            <h3 style="color: var(--silver); font-size: 1.5rem; margin-bottom: 20px;">
                ${category.name}
            </h3>
            ${category.description ? 
                `<p style="color: var(--silver); font-size: 1.1rem; max-width: 800px; margin: 0 auto 30px auto;">
                    ${category.description}
                </p>` 
                : ''
            }
        </div>
    `;
    
    // Sección 1: PODIO CON LOS 3 GANADORES
    const podiumSection = document.createElement('div');
    podiumSection.style.cssText = `
        background: linear-gradient(145deg, rgba(30, 30, 50, 0.8), rgba(15, 15, 25, 0.9));
        border-radius: 25px;
        padding: 40px;
        margin-bottom: 40px;
        border: 2px solid var(--gold);
        box-shadow: 0 10px 40px rgba(255, 215, 0, 0.2);
    `;
    
    podiumSection.innerHTML = `
        <h3 style="color: var(--gold); text-align: center; margin-bottom: 40px; font-size: 1.8rem;">
            🎖️ LOS 3 GANADORES
        </h3>
        <div style="display: flex; justify-content: center; align-items: flex-end; gap: 40px; flex-wrap: wrap; min-height: 350px;">
            <!-- 2do lugar -->
            ${sortedNominees[1] ? `
                <div class="podium-step" style="
                    flex: 1;
                    min-width: 250px;
                    max-width: 300px;
                    text-align: center;
                    animation: slideUpFade 0.6s ease-out 0.1s both;
                ">
                    <div style="
                        background: linear-gradient(145deg, rgba(192, 192, 192, 0.2), rgba(150, 150, 150, 0.1));
                        border: 3px solid var(--silver);
                        border-radius: 20px 20px 0 0;
                        padding: 30px 20px 60px 20px;
                        min-height: 280px;
                        position: relative;
                        margin-bottom: 20px;
                    ">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🥈</div>
                        <h4 style="color: var(--silver); font-size: 1.6rem; margin: 15px 0; font-weight: bold;">
                            ${sortedNominees[1].name}
                        </h4>
                        <div style="
                            position: absolute;
                            bottom: 20px;
                            left: 0;
                            right: 0;
                            text-align: center;
                        ">
                            <div style="color: var(--silver); font-size: 2.5rem; font-weight: bold;">
                                ${sortedNominees[1].votes || 0}
                            </div>
                            <div style="color: var(--silver); font-size: 1rem;">
                                VOTOS
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--silver); font-weight: bold; padding: 10px;">
                        SEGUNDO LUGAR
                    </div>
                </div>
            ` : ''}
            
            <!-- 1er lugar -->
            ${sortedNominees[0] ? `
                <div class="podium-step" style="
                    flex: 1.2;
                    min-width: 300px;
                    max-width: 350px;
                    text-align: center;
                    animation: slideUpFade 0.8s ease-out both;
                    transform: translateY(-40px);
                ">
                    <div style="
                        background: linear-gradient(145deg, rgba(255, 215, 0, 0.25), rgba(212, 175, 55, 0.2));
                        border: 4px solid var(--gold);
                        border-radius: 25px 25px 0 0;
                        padding: 40px 25px 80px 25px;
                        min-height: 320px;
                        position: relative;
                        margin-bottom: 20px;
                        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                    ">
                        <div style="font-size: 5rem; margin-bottom: 20px; animation: goldGlow 2s infinite alternate;">🥇</div>
                        <h4 style="
                            background: linear-gradient(45deg, var(--gold), #FFEE80);
                            -webkit-background-clip: text;
                            background-clip: text;
                            color: transparent;
                            font-size: 1.8rem;
                            margin: 20px 0;
                            font-weight: bold;
                        ">
                            ${sortedNominees[0].name}
                        </h4>
                        <div style="
                            position: absolute;
                            bottom: 30px;
                            left: 0;
                            right: 0;
                            text-align: center;
                        ">
                            <div style="color: var(--gold); font-size: 3rem; font-weight: bold;">
                                ${sortedNominees[0].votes || 0}
                            </div>
                            <div style="color: var(--gold); font-size: 1.1rem;">
                                VOTOS
                            </div>
                        </div>
                    </div>
                    <div style="
                        color: var(--gold);
                        font-weight: bold;
                        padding: 15px;
                        background: rgba(255, 215, 0, 0.1);
                        border-radius: 10px;
                        border: 1px solid rgba(255, 215, 0, 0.3);
                    ">
                        ¡¡GANADOR/A ABSOLUTO/A!!
                    </div>
                </div>
            ` : ''}
            
            <!-- 3er lugar -->
            ${sortedNominees[2] ? `
                <div class="podium-step" style="
                    flex: 1;
                    min-width: 250px;
                    max-width: 300px;
                    text-align: center;
                    animation: slideUpFade 0.6s ease-out 0.2s both;
                ">
                    <div style="
                        background: linear-gradient(145deg, rgba(205, 127, 50, 0.2), rgba(180, 110, 40, 0.1));
                        border: 3px solid var(--bronze);
                        border-radius: 20px 20px 0 0;
                        padding: 30px 20px 60px 20px;
                        min-height: 250px;
                        position: relative;
                        margin-bottom: 20px;
                    ">
                        <div style="font-size: 3.5rem; margin-bottom: 20px;">🥉</div>
                        <h4 style="color: var(--bronze); font-size: 1.6rem; margin: 15px 0; font-weight: bold;">
                            ${sortedNominees[2].name}
                        </h4>
                        <div style="
                            position: absolute;
                            bottom: 20px;
                            left: 0;
                            right: 0;
                            text-align: center;
                        ">
                            <div style="color: var(--bronze); font-size: 2.5rem; font-weight: bold;">
                                ${sortedNominees[2].votes || 0}
                            </div>
                            <div style="color: var(--bronze); font-size: 1rem;">
                                VOTOS
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--bronze); font-weight: bold; padding: 10px;">
                        TERCER LUGAR
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    podiumContainer.appendChild(podiumSection);
    
    // Sección 2: TABLA DE TODOS LOS PARTICIPANTES
    const tableSection = document.createElement('div');
    tableSection.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 30px;
        margin-bottom: 40px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    let tableHTML = `
        <h3 style="color: var(--gold); text-align: center; margin-bottom: 30px; font-size: 1.8rem;">
            📊 VOTOS DE TODOS LOS PARTICIPANTES
        </h3>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                <thead>
                    <tr style="background: rgba(255, 215, 0, 0.1);">
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">#</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">PARTICIPANTE</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">VOTOS</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">PORCENTAJE</th>
                        <th style="padding: 15px; text-align: left; color: var(--gold); border-bottom: 2px solid var(--gold);">MEDALLA</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const totalVotes = sortedNominees.reduce((sum, n) => sum + (n.votes || 0), 0);
    
    sortedNominees.forEach((nominee, index) => {
        const percentage = totalVotes > 0 ? ((nominee.votes || 0) / totalVotes * 100).toFixed(1) : "0.0";
        let medal = "";
        
        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";
        
        const rowColor = index < 3 ? 
            index === 0 ? "rgba(255, 215, 0, 0.1)" : 
            index === 1 ? "rgba(192, 192, 192, 0.1)" : 
            "rgba(205, 127, 50, 0.1)" : "transparent";
        
        tableHTML += `
            <tr style="background: ${rowColor}; ${index < 3 ? 'font-weight: bold;' : ''}">
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: ${index < 3 ? getMedalColor(index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze', 1) : 'var(--silver)'};">${index + 1}</td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: white;">${nominee.name}</td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-weight: bold; color: ${index < 3 ? getMedalColor(index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze', 1) : 'white'};">${nominee.votes || 0}</td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                            <div style="
                                height: 100%; 
                                width: ${percentage}%; 
                                background: ${index === 0 ? 'var(--gold)' : index === 1 ? 'var(--silver)' : index === 2 ? 'var(--bronze)' : '#667eea'};
                                border-radius: 4px;
                            "></div>
                        </div>
                        <span style="color: var(--silver); min-width: 40px;">${percentage}%</span>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: center; font-size: 1.2rem;">${medal}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; color: var(--silver); text-align: center;">
            <p>Total de votos: <strong style="color: var(--gold);">${totalVotes}</strong> • Participantes: <strong>${sortedNominees.length}</strong></p>
        </div>
    `;
    
    tableSection.innerHTML = tableHTML;
    podiumContainer.appendChild(tableSection);
    
    // Sección 3: FRASES ICÓNICAS (solo para categoría 17)
    if (category.id === 17) {
        const phrases = getAllPhrasesForCategory(sortedNominees);
        if (phrases.length > 0) {
            const phrasesSection = document.createElement('div');
            phrasesSection.style.cssText = `
                background: linear-gradient(145deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 30px;
                border: 1px solid rgba(102, 126, 234, 0.3);
            `;
            
            phrasesSection.innerHTML = `
                <h3 style="color: #667eea; text-align: center; margin-bottom: 30px; font-size: 1.8rem;">
                    💬 FRASES ICÓNICAS DEL AÑO
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${phrases.map((phrase, index) => `
                        <div class="phrase-card" style="
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 15px;
                            padding: 20px;
                            border-left: 4px solid #667eea;
                            animation: slideUpFade 0.5s ease-out ${index * 0.1}s both;
                        ">
                            <div style="color: white; font-style: italic; font-size: 1.1rem; margin-bottom: 15px; line-height: 1.4;">
                                "${phrase.frase}"
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: #667eea; font-weight: bold; font-size: 0.9rem;">${phrase.persona}</div>
                                    <div style="color: var(--silver); font-size: 0.8rem;">Añadida por: ${phrase.votante}</div>
                                </div>
                                <div style="color: var(--silver); font-size: 0.8rem;">${phrase.votos} votos</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${phrases.length > 6 ? `
                    <div style="text-align: center; margin-top: 20px; color: var(--silver);">
                        <i class="fas fa-ellipsis-h"></i> ${phrases.length} frases icónicas registradas
                    </div>
                ` : ''}
            `;
            
            podiumContainer.appendChild(phrasesSection);
        }
    }
    
    // Botón para volver
    const backButton = document.createElement('div');
    backButton.style.cssText = 'text-align: center; margin-top: 30px;';
    backButton.innerHTML = `
        <button onclick="closeModal()" style="
            background: linear-gradient(45deg, rgba(255, 71, 87, 0.9), rgba(255, 0, 0, 0.9));
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.1rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        ">
            <i class="fas fa-times"></i> CERRAR PODIO
        </button>
        <p style="color: var(--silver); margin-top: 15px; font-size: 0.9rem;">
            Puedes volver a ver los resultados desde la página principal
        </p>
    `;
    
    podiumContainer.appendChild(backButton);
    
    nomineesList.appendChild(podiumContainer);
}

// ===== FUNCIONES AUXILIARES =====
function getMedalColor(type, opacity = 1) {
    const colors = {
        gold: opacity === 1 ? 'var(--gold)' : `rgba(255, 215, 0, ${opacity})`,
        silver: opacity === 1 ? 'var(--silver)' : `rgba(192, 192, 192, ${opacity})`,
        bronze: opacity === 1 ? 'var(--bronze)' : `rgba(205, 127, 50, ${opacity})`
    };
    return colors[type] || colors.gold;
}

function getMedalEmoji(type) {
    const emojis = {
        gold: '🥇',
        silver: '🥈',
        bronze: '🥉'
    };
    return emojis[type] || '🏅';
}

function getAllPhrasesForCategory(nominees) {
    const allPhrases = [];
    
    nominees.forEach(nominee => {
        if (nominee.frases && Object.keys(nominee.frases).length > 0) {
            Object.values(nominee.frases).forEach(fraseData => {
                allPhrases.push({
                    persona: nominee.name,
                    frase: fraseData.frase,
                    votante: fraseData.voter,
                    votos: nominee.votes || 0,
                    timestamp: fraseData.timestamp
                });
            });
        }
    });
    
    // Ordenar por votos (más votadas primero)
    return allPhrases.sort((a, b) => b.votos - a.votos);
}

// ===== EFECTOS ESPECIALES =====
function createConfetti() {
    const container = document.getElementById('revealContainer');
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#FF6B6B', '#4CAF50', '#2196F3'];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            top: -20px;
            left: ${Math.random() * 100}%;
            z-index: 1000;
            animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
        `;
        
        // Añadir estilo de animación de confeti si no existe
        if (!document.querySelector('#confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(confetti);
        
        // Eliminar después de la animación
        setTimeout(() => confetti.remove(), 5000);
    }
}

function playVictorySound() {
    // Esta función intenta reproducir un sonido de victoria
    // En un entorno real, podrías cargar un archivo de audio
    console.log("🎉 ¡Sonido de victoria!");
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