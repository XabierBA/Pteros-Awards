// firebase-config.js - VERSIÓN CORREGIDA
console.log("🔥 firebase-config.js cargado");

let firebaseDB = null;
let firebaseReady = false;

// ===== 1. ESPERAR FIREBASE =====
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseDatabase) {
            firebaseDB = window.firebaseDatabase;
            firebaseReady = true;
            console.log("✅ Firebase Database disponible");
            resolve(true);
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 20; // 10 segundos máximo
        
        const checkFirebase = () => {
            attempts++;
            
            if (window.firebaseDatabase) {
                firebaseDB = window.firebaseDatabase;
                firebaseReady = true;
                console.log(`✅ Firebase Database listo (${attempts} intentos)`);
                resolve(true);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.warn("⚠️ Firebase no se cargó después de 10 segundos");
                resolve(false);
                return;
            }
            
            setTimeout(checkFirebase, 500);
        };
        
        checkFirebase();
    });
}

// ===== 2. CARGAR DATOS DE FIREBASE =====
// ===== 2. CARGAR DATOS DE FIREBASE - VERSIÓN CORREGIDA =====
async function loadDataFromFirebase() {
    console.log("🔥 CARGANDO DATOS DE FIREBASE (VERSIÓN CORREGIDA)...");
    
    try {
        const ready = await waitForFirebase();
        
        if (!ready || !firebaseDB) {
            throw new Error("Firebase Database no disponible");
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // 1. PRIMERO: Cargar USUARIOS desde Firebase
        const usersRef = ref(firebaseDB, 'users');
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) {
            console.log("⚠️ No hay usuarios en Firebase");
            return false;
        }
        
        const firebaseUsers = usersSnapshot.val();
        console.log(`✅ ${firebaseUsers.length} usuarios cargados de Firebase`);
        
        // Actualizar usuarios en appData
        window.appData.users = firebaseUsers;
        localStorage.setItem('premiosUsers', JSON.stringify(firebaseUsers));
        
        // 2. SEGUNDO: Cargar CATEGORÍAS desde Firebase
        const premiosDataRef = ref(firebaseDB, 'premiosData');
        const premiosDataSnapshot = await get(premiosDataRef);
        
        let firebaseCategories = [];
        let firebasePhotoUrls = {};
        let firebasePhase = 'nominations';
        
        if (premiosDataSnapshot.exists()) {
            const premiosData = premiosDataSnapshot.val();
            firebaseCategories = premiosData.categories || [];
            firebasePhotoUrls = premiosData.photoUrls || {};
            firebasePhase = premiosData.phase || 'nominations';
            console.log(`✅ ${firebaseCategories.length} categorías cargadas de Firebase`);
        } else {
            console.log("⚠️ No hay premiosData, creando categorías por defecto");
            firebaseCategories = createDefaultCategories ? createDefaultCategories() : [];
        }
        
        // 3. TERCERO Y MÁS IMPORTANTE: TRANSFERIR VOTOS DE USUARIOS A CATEGORÍAS
        console.log("🔄 TRANSFIRIENDO VOTOS DE USUARIOS A CATEGORÍAS...");
        
        // A. Primero, limpiar todos los votos existentes en categorías
        firebaseCategories.forEach(categoria => {
            if (categoria.nominees) {
                categoria.nominees.forEach(nominado => {
                    if (nominado) {
                        nominado.votes = 0;
                        nominado.voters = [];
                        if (!nominado.frases) nominado.frases = {};
                    }
                });
            }
        });
        
        // B. Luego, transferir votos desde usuarios
        let totalVotosTransferidos = 0;
        let usuariosConVotos = 0;
        
        firebaseUsers.forEach(usuario => {
            if (!usuario || !usuario.votes || Object.keys(usuario.votes).length === 0) {
                return; // Usuario sin votos
            }
            
            usuariosConVotos++;
            
            Object.entries(usuario.votes).forEach(([categoriaId, voto]) => {
                // Buscar la categoría
                const categoria = firebaseCategories.find(c => c && c.id == categoriaId);
                if (!categoria || !categoria.nominees) return;
                
                // Buscar el nominado
                const nominado = categoria.nominees.find(n => n && n.name === voto.nomineeName);
                if (!nominado) return;
                
                // Inicializar arrays si no existen
                if (!nominado.voters) nominado.voters = [];
                if (!nominado.frases) nominado.frases = {};
                
                // Agregar voto si no existe
                if (!nominado.voters.includes(usuario.id)) {
                    nominado.voters.push(usuario.id);
                    nominado.votes = (nominado.votes || 0) + 1;
                    totalVotosTransferidos++;
                }
                
                // Agregar frase si existe
                if (voto.frase && voto.frase.trim() !== '') {
                    nominado.frases[usuario.id] = {
                        frase: voto.frase,
                        voter: usuario.name,
                        timestamp: voto.timestamp || new Date().toISOString(),
                        tipo: categoria.id === 6 ? 'duo' : 'frase'
                    };
                }
            });
        });
        
        console.log(`✅ ${totalVotosTransferidos} votos transferidos de ${usuariosConVotos} usuarios`);
        
        // 4. ACTUALIZAR appData CON LOS DATOS COMBINADOS
        window.appData.categories = firebaseCategories;
        window.appData.photoUrls = firebasePhotoUrls;
        window.appData.phase = firebasePhase;
        
        // 5. GUARDAR EN LOCALSTORAGE
        localStorage.setItem('premiosData', JSON.stringify({
            categories: window.appData.categories,
            phase: window.appData.phase,
            photoUrls: window.appData.photoUrls
        }));
        
        console.log("💾 Datos combinados guardados en localStorage");
        
        // 6. ACTUALIZAR premiosData EN FIREBASE CON LOS VOTOS CORRECTOS
        const { set } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        const premiosDataActualizado = {
            categories: window.appData.categories,
            phase: window.appData.phase,
            photoUrls: window.appData.photoUrls,
            totalUsers: window.appData.users.length,
            totalVotes: totalVotosTransferidos,
            lastUpdated: new Date().toISOString()
        };
        
        await set(premiosDataRef, premiosDataActualizado);
        console.log("✅ premiosData actualizado en Firebase con votos correctos");
        
        // 7. MOSTRAR ESTADÍSTICAS
        console.log("\n=== 📊 ESTADÍSTICAS FINALES ===");
        console.log("Usuarios:", window.appData.users.length);
        console.log("Categorías:", window.appData.categories.length);
        console.log("Votos totales:", totalVotosTransferidos);
        console.log("Fotos:", Object.keys(window.appData.photoUrls || {}).length);
        console.log("Fase:", window.appData.phase);
        
        // Mostrar ejemplo de categoría con votos
        const categoriaConVotos = window.appData.categories.find(cat => 
            cat.nominees?.some(n => n.votes > 0)
        );
        
        if (categoriaConVotos) {
            console.log(`\nEjemplo - ${categoriaConVotos.name}:`);
            categoriaConVotos.nominees.forEach(nom => {
                if (nom.votes > 0) {
                    console.log(`   ${nom.name}: ${nom.votes} votos`);
                }
            });
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ ERROR CARGANDO DE FIREBASE:", error);
        return false;
    }
}

// ===== 3. GUARDAR DATOS EN FIREBASE (MAIN) =====
async function saveDataToFirebase() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Calcular votos reales
        let totalVotes = 0;
        if (window.appData.categories) {
            window.appData.categories.forEach(categoria => {
                if (categoria.nominees) {
                    categoria.nominees.forEach(nominado => {
                        totalVotes += nominado.votes || 0;
                    });
                }
            });
        }
        
        // Preparar datos para Firebase CON VOTOS REALES
        const dataToSave = {
            categories: window.appData.categories || [],
            phase: window.appData.phase || 'nominations',
            photoUrls: window.appData.photoUrls || {},
            lastUpdated: new Date().toISOString(),
            totalVotes: totalVotes, // VOTOS REALES, NO 0
            totalUsers: window.appData.users?.length || 0
        };
        
        // Guardar en nodo principal
        await set(ref(firebaseDB, 'premiosData'), dataToSave);
        
        console.log(`💾 Datos principales guardados en Firebase (${totalVotes} votos)`);
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        return false;
    }
}

// ===== 4. GUARDAR USUARIOS EN FIREBASE =====
async function saveUsersToFirebase() {
    try {
        console.log("🔥 Intentando guardar usuarios en Firebase...");
        
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Preparar usuarios limpios para Firebase
        const usersToSave = (window.appData.users || []).map(user => ({
            id: user.id,
            name: user.name,
            votes: user.votes || {},
            votedAt: user.votedAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        }));
        
        // Guardar en nodo 'users'
        await set(ref(firebaseDB, 'users'), usersToSave);
        
        console.log(`✅ ${usersToSave.length} usuarios guardados en Firebase`);
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando usuarios en Firebase:", error);
        return false;
    }
}

// ===== 5. FUNCIONES AUXILIARES DE MEZCLA =====
function mergeCategories(localCats, firebaseCats) {
    if (!localCats || localCats.length === 0) return firebaseCats;
    if (!firebaseCats || firebaseCats.length === 0) return localCats;
    
    const result = [...localCats];
    
    firebaseCats.forEach(fbCat => {
        if (!fbCat || !fbCat.id) return;
        
        const existingIndex = result.findIndex(localCat => 
            localCat && localCat.id === fbCat.id
        );
        
        if (existingIndex !== -1) {
            // Actualizar categoría existente (Firebase tiene prioridad)
            result[existingIndex] = fbCat;
        } else {
            // Añadir nueva categoría
            result.push(fbCat);
        }
    });
    
    return result;
}

function mergeUsers(localUsers, firebaseUsers) {
    if (!localUsers || localUsers.length === 0) return Array.isArray(firebaseUsers) ? firebaseUsers : [];
    if (!firebaseUsers) return localUsers;
    
    // Convertir a array si es objeto
    const fbUsersArray = Array.isArray(firebaseUsers) ? firebaseUsers : Object.values(firebaseUsers);
    
    const result = [...localUsers];
    const localUserIds = new Set(localUsers.map(u => u?.id));
    
    fbUsersArray.forEach(fbUser => {
        if (!fbUser || !fbUser.id) return;
        
        if (!localUserIds.has(fbUser.id)) {
            // Usuario nuevo de Firebase
            result.push(fbUser);
        }
    });
    
    return result;
}

function getTotalVotes() {
    if (!window.appData || !window.appData.categories) return 0;
    
    return window.appData.categories.reduce((total, category) => {
        const nominees = category.nominees || [];
        return total + nominees.reduce((catTotal, nominee) => {
            return catTotal + (nominee.votes || 0);
        }, 0);
    }, 0);
}

// ===== 6. FUNCIÓN PARA GUARDAR VOTO COMPLETO =====
async function saveCompleteVote() {
    console.log("💾 Guardando voto completo en Firebase...");
    
    try {
        // Guardar datos principales
        await saveDataToFirebase();
        
        // Guardar usuarios
        await saveUsersToFirebase();
        
        console.log("✅ Voto completamente guardado en Firebase");
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando voto completo:", error);
        throw error;
    }
}

// ===== FUNCIÓN MEJORADA PARA SOLO DESCARGAR =====
async function soloDescargarDesdeFirebase() {
    try {
        const ready = await waitForFirebase();
        
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        console.log("📥 DESCARGANDO datos desde Firebase (sin subir)...");
        
        // 1. Datos principales
        const dataRef = ref(firebaseDB, 'premiosData');
        const dataSnapshot = await get(dataRef);
        
        // 2. Usuarios
        const usersRef = ref(firebaseDB, 'users');
        const usersSnapshot = await get(usersRef);
        
        let cambios = 0;
        
        // Actualizar appData con datos de Firebase
        if (dataSnapshot.exists()) {
            const firebaseData = dataSnapshot.val();
            
            // Reemplazar categorías completamente
            if (firebaseData.categories) {
                window.appData.categories = firebaseData.categories;
                cambios++;
                console.log(`📋 Categorías: ${firebaseData.categories.length}`);
            }
            
            // Actualizar fase
            if (firebaseData.phase) {
                window.appData.phase = firebaseData.phase;
                cambios++;
                console.log(`🔄 Fase: ${firebaseData.phase}`);
            }
            
            // Actualizar fotos
            if (firebaseData.photoUrls) {
                window.appData.photoUrls = firebaseData.photoUrls;
                cambios++;
                console.log(`🖼️ Fotos: ${Object.keys(firebaseData.photoUrls).length}`);
            }
        }
        
        // Actualizar usuarios
        if (usersSnapshot.exists()) {
            const firebaseUsers = usersSnapshot.val();
            window.appData.users = firebaseUsers;
            cambios++;
            console.log(`👥 Usuarios: ${firebaseUsers.length}`);
        }
        
        if (cambios > 0) {
            console.log(`✅ ${cambios} tipos de datos actualizados desde Firebase`);
            return true;
        } else {
            console.log("ℹ️ No había datos nuevos en Firebase");
            return false;
        }
        
    } catch (error) {
        console.error("❌ Error descargando desde Firebase:", error);
        throw error;
    }
}

// Exportar la nueva función
window.soloDescargarDesdeFirebase = soloDescargarDesdeFirebase;

// Función auxiliar para crear categorías por defecto
function createDefaultCategories() {
    const people = ["Brais", "Amalia", "Carlita", "Daniel", "Guille", "Iker", "Joel", "Jose", "Nico", "Ruchiti", "Sara", "Tiago", "Xabi"];
    
    return [
        { id: 1, name: "👑 Más Putero", description: "Puterismo de manual", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 2, name: "👑 Más Putera", description: "No me seais cabrones que nos conocemos", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 3, name: "🍻 Peor Borrachera", description: "La locura en persona cuando va borracha", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 4, name: "⏰ Más Impuntual", description: "Mmm, me cago en su puta estampa", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 5, name: "😂 Más Gracioso/a", description: "La vd es q dais pena todos", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 6, name: "👯‍♂️ Mejor Dúo", description: "El duo dinámico, creo q sabemos quienes son", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 7, name: "🎉 Mejor Evento del Año", description: "Esto votad persona y el evento", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 8, name: "🔊 Más Tocahuevos", description: "El/la que más insiste o molesta", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 9, name: "🥴 Más Borracho/a", description: "Quien se pasa más con el alcohol", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 10, name: "👀 El/La que más mira por el grupo", description: "Quien más se preocupa por todos", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 11, name: "👿 Peor Influencia", description: "Quien te mete en más líos", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 12, name: "🎭 El/La que más dramas monta", description: "Quien monta más drama por todo", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 13, name: "🏃‍♂️ El/La que más deja tirado al grupo", description: "Quien más falla o desaparece", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 14, name: "💀 El/La que suelta más bastadas", description: "Quien dice las cosas más brutales", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 15, name: "✅ Más Responsable", description: "Quien más se puede contar para lo importante", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 16, name: "😡 Mayor Cabreo del Año", description: "La mejor pataleta/enfado del año", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 17, name: "💬 Frase del Año", description: "La mejor frase/momento icónico", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 18, name: "🌟 Persona Revelación 2025", description: "Quien más ha sorprendido este año", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 19, name: "🏆 Balón de Oro Puteros Awards 2026", description: "El MVP absoluto del grupo", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 20, name: "🔒 El Correas", description: "Quien más está atado corto", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 21, name: "🔒 El que pone las correas", description: "Quien más controla", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 22, name: "👻 El Fantasma de la ESEI", description: "Quien menos se deja ver por la uni", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 23, name: "📚 El que menos va a clase", description: "Autodescriptivo", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 24, name: "😳 Momento más Humillante", description: "La situación más vergonzosa", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 25, name: "😭 Más Lloros", description: "Quien más se emociona o dramatiza", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 26, name: "🎲 Datos Random", description: "Quien dice/sabe cosas más random", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 27, name: "📉 El/La más Putilla Académicamente", description: "El peor compañero para estudiar", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 28, name: "💪 Tu Salvación Académica", description: "El mejor compañero en apuros", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 29, name: "🎮 Gamer del Año", description: "Ni pareja ni pollas, total esta jugando", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 30, name: "📱 Cerebro dopamínico de niño de tiktok", description: "Si deja el movil 10 segundos, se convierte", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 31, name: "🎤 Karaoke Star", description: "Se cree Bisbal o algo así", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) },
        { id: 32, name: "😴 Narcolepsico", description: "Quien es el subnormal que siempre se duerme", nominees: people.map(p => ({ name: p, votes: 0, voters: [], frases: {} })) }
    ];
}

// ===== FUNCIÓN PARA FORZAR SINCRONIZACIÓN COMPLETA =====
async function forzarSincronizacionCompleta() {
    console.log("🔄 FORZANDO SINCRONIZACIÓN COMPLETA...");
    
    if (!confirm("¿Forzar sincronización completa?\n\nEsto:\n1. Descargará usuarios desde Firebase\n2. Descargará categorías desde Firebase\n3. Transferirá votos de usuarios a categorías\n4. Actualizará Firebase con votos correctos\n\n¿Continuar?")) {
        return;
    }
    
    try {
        // Usar la función corregida
        const exito = await loadDataFromFirebase();
        
        if (exito) {
            // Actualizar UI
            if (typeof window.renderCategories === 'function') window.renderCategories();
            if (typeof window.updateVotersList === 'function') window.updateVotersList();
            if (typeof window.updateStats === 'function') window.updateStats();
            
            alert(`✅ Sincronización forzada completada\n\n• Usuarios: ${window.appData.users?.length || 0}\n• Categorías: ${window.appData.categories?.length || 0}\n• Votos: ${window.appData.categories?.reduce((total, cat) => total + (cat.nominees?.reduce((sum, nom) => sum + (nom.votes || 0), 0) || 0), 0) || 0}`);
            
            // Recargar página
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            alert("❌ No se pudo completar la sincronización");
        }
        
    } catch (error) {
        console.error("❌ Error en sincronización forzada:", error);
        alert("❌ Error: " + error.message);
    }
}

// Exportar


// Hacerla global si no existe
if (typeof window.createDefaultCategories === 'undefined') {
    window.createDefaultCategories = createDefaultCategories;
}

// ===== 8. EXPORTAR FUNCIONES =====
window.forzarSincronizacionCompleta = forzarSincronizacionCompleta;
window.waitForFirebase = waitForFirebase;
window.loadDataFromFirebase = loadDataFromFirebase;
window.saveDataToFirebase = saveDataToFirebase;
window.saveUsersToFirebase = saveUsersToFirebase;
window.saveCompleteVote = saveCompleteVote;
window.diagnosticarFirebase = diagnosticarFirebase;