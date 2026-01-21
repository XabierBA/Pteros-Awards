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
async function loadDataFromFirebase() {
    console.log("🔥 CARGANDO DATOS DE FIREBASE...");
    
    try {
        const ready = await waitForFirebase();
        
        if (!ready || !firebaseDB) {
            throw new Error("Firebase Database no disponible");
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Cargar TODOS los datos desde el nodo principal 'premiosData' (para mantener compatibilidad)
        const mainDataRef = ref(firebaseDB, 'premiosData');
        const mainDataSnapshot = await get(mainDataRef);
        
        // También cargar usuarios desde 'users' (estructura nueva)
        const usersRef = ref(firebaseDB, 'users');
        const usersSnapshot = await get(usersRef);
        
        console.log("📥 Resultados Firebase:");
        console.log("- premiosData:", mainDataSnapshot.exists() ? "✅" : "❌ Vacío");
        console.log("- users:", usersSnapshot.exists() ? `✅ ${Object.keys(usersSnapshot.val() || {}).length} usuarios` : "❌ Vacío");
        
        // ACTUALIZAR appData CON DATOS DE FIREBASE
        if (mainDataSnapshot.exists()) {
            const firebaseData = mainDataSnapshot.val();
            
            // Mezclar datos inteligentemente
            if (firebaseData.categories && Array.isArray(firebaseData.categories)) {
                window.appData.categories = mergeCategories(window.appData.categories, firebaseData.categories);
            }
            
            if (firebaseData.phase) {
                window.appData.phase = firebaseData.phase;
            }
            
            if (firebaseData.photoUrls) {
                window.appData.photoUrls = { ...window.appData.photoUrls, ...firebaseData.photoUrls };
            }
            
            console.log("✅ appData actualizado desde Firebase");
            console.log(`   - Categorías: ${window.appData.categories.length}`);
            console.log(`   - Fotos: ${Object.keys(window.appData.photoUrls || {}).length}`);
        }
        
        if (usersSnapshot.exists()) {
            const firebaseUsers = usersSnapshot.val();
            // Mezclar usuarios: Firebase tiene prioridad
            window.appData.users = mergeUsers(window.appData.users, firebaseUsers);
            console.log(`✅ Usuarios cargados: ${window.appData.users.length}`);
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
        
        // Preparar datos para Firebase
        const dataToSave = {
            categories: window.appData.categories || [],
            phase: window.appData.phase || 'nominations',
            photoUrls: window.appData.photoUrls || {},
            lastUpdated: new Date().toISOString(),
            totalVotes: getTotalVotes(),
            totalUsers: window.appData.users?.length || 0
        };
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Guardar en nodo principal para compatibilidad
        await set(ref(firebaseDB, 'premiosData'), dataToSave);
        
        console.log("💾 Datos principales guardados en Firebase");
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

// ===== 7. DIAGNÓSTICO =====
async function diagnosticarFirebase() {
    console.log("=== 🔍 DIAGNÓSTICO FIREBASE ===");
    console.log("Firebase listo:", firebaseReady);
    console.log("Firebase DB:", firebaseDB ? "✅ Disponible" : "❌ No disponible");
    
    if (window.appData) {
        console.log("=== 📊 DATOS LOCALES ===");
        console.log("Usuarios:", window.appData.users?.length || 0);
        console.log("Categorías:", window.appData.categories?.length || 0);
        
        if (window.appData.users && window.appData.users.length > 0) {
            console.log("=== 👥 USUARIOS DETALLADOS ===");
            window.appData.users.forEach((user, i) => {
                console.log(`${i+1}. ${user.name} - Votos: ${Object.keys(user.votes || {}).length}`);
            });
        }
    }
    
    // Test de conexión
    if (firebaseDB) {
        try {
            const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
            const testRef = ref(firebaseDB, 'test');
            await set(testRef, { timestamp: new Date().toISOString() });
            console.log("✅ Test de escritura exitoso");
        } catch (error) {
            console.error("❌ Test de escritura falló:", error);
        }
    }
    
    console.log("=== 🔚 FIN DIAGNÓSTICO ===");
}

// ===== 8. EXPORTAR FUNCIONES =====
window.waitForFirebase = waitForFirebase;
window.loadDataFromFirebase = loadDataFromFirebase;
window.saveDataToFirebase = saveDataToFirebase;
window.saveUsersToFirebase = saveUsersToFirebase;
window.saveCompleteVote = saveCompleteVote;
window.diagnosticarFirebase = diagnosticarFirebase;