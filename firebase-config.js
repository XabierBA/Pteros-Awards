// ===== CONFIGURACIÓN FIREBASE V12 =====

let database;
let firebaseReady = false;

// Esperar a que Firebase esté listo
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseDatabase && window.firebaseInitialized) {
            database = window.firebaseDatabase;
            firebaseReady = true;
            console.log("✅ Firebase está listo");
            resolve(true);
            return;
        }
        
        // Escuchar el evento firebaseReady
        document.addEventListener('firebaseReady', () => {
            if (window.firebaseDatabase) {
                database = window.firebaseDatabase;
                firebaseReady = true;
                console.log("✅ Firebase listo después del evento");
                resolve(true);
            } else {
                resolve(false);
            }
        });
        
        // Timeout después de 3 segundos
        setTimeout(() => {
            if (!firebaseReady) {
                console.log("⚠️ Timeout esperando Firebase");
                resolve(false);
            }
        }, 3000);
    });
}

// ===== FUNCIONES PARA FIREBASE =====

// Guardar datos en Firebase
async function saveDataToFirebase() {
    if (!firebaseReady) {
        const ready = await waitForFirebase();
        if (!ready) {
            console.log("⚠️ Firebase no disponible, usando localStorage");
            localStorage.setItem('premiosData', JSON.stringify(appData.categories));
            return;
        }
    }
    
    try {
        // Importar funciones dinámicamente
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        const dataToSave = {
            categories: appData.categories,
            phase: appData.phase,
            photoUrls: appData.photoUrls,
            lastUpdated: new Date().toISOString()
        };
        
        await set(ref(database, 'appData'), dataToSave);
        console.log("✅ Datos guardados en Firebase");
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        // Guardar en localStorage como backup
        localStorage.setItem('premiosData', JSON.stringify(appData.categories));
    }
}

// Cargar datos desde Firebase
async function loadDataFromFirebase() {
    if (!firebaseReady) {
        const ready = await waitForFirebase();
        if (!ready) {
            console.log("⚠️ Firebase no disponible, cargando de localStorage");
            const savedData = localStorage.getItem('premiosData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                appData.categories = parsed.categories || [];
                appData.phase = parsed.phase || 'nominations';
            }
            return;
        }
    }
    
    try {
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        const snapshot = await get(ref(database, 'appData'));
        const firebaseData = snapshot.val();
        
        if (firebaseData) {
            appData.categories = firebaseData.categories || [];
            appData.phase = firebaseData.phase || 'nominations';
            appData.photoUrls = firebaseData.photoUrls || {};
            
            console.log("✅ Datos cargados desde Firebase");
        } else {
            // Si no hay datos en Firebase, usar defaults
            console.log("⚠️ No hay datos en Firebase, usando defaults");
        }
        
    } catch (error) {
        console.error("❌ Error cargando de Firebase:", error);
        // Intentar cargar de localStorage
        const savedData = localStorage.getItem('premiosData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            appData.categories = parsed.categories || [];
            appData.phase = parsed.phase || 'nominations';
        }
    }
}

// Guardar usuarios en Firebase
async function saveUsersToFirebase() {
    if (!firebaseReady) {
        const ready = await waitForFirebase();
        if (!ready) {
            localStorage.setItem('premiosUsers', JSON.stringify(appData.users));
            return;
        }
    }
    
    try {
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        await set(ref(database, 'users'), appData.users);
        console.log("✅ Usuarios guardados en Firebase");
        
    } catch (error) {
        console.error("❌ Error guardando usuarios:", error);
        localStorage.setItem('premiosUsers', JSON.stringify(appData.users));
    }
}

// Cargar usuarios desde Firebase
async function loadUsersFromFirebase() {
    if (!firebaseReady) {
        const ready = await waitForFirebase();
        if (!ready) {
            const savedUsers = localStorage.getItem('premiosUsers');
            appData.users = savedUsers ? JSON.parse(savedUsers) : [];
            return;
        }
    }
    
    try {
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const snapshot = await get(ref(database, 'users'));
        const firebaseUsers = snapshot.val();
        
        if (firebaseUsers) {
            appData.users = firebaseUsers;
        } else {
            appData.users = [];
        }
        
    } catch (error) {
        console.error("❌ Error cargando usuarios:", error);
        const savedUsers = localStorage.getItem('premiosUsers');
        appData.users = savedUsers ? JSON.parse(savedUsers) : [];
    }
}

// Escuchar cambios en tiempo real - CORREGIDO (quitar await de import)
async function setupRealtimeListeners() {
    if (!firebaseReady) {
        console.log("⚠️ Firebase no está listo para listeners");
        return;
    }
    
    try {
        // Importar funciones dinámicamente
        const firebaseModule = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const { onValue, ref } = firebaseModule;
        
        // Escuchar cambios en appData
        onValue(ref(database, 'appData'), (snapshot) => {
            const newData = snapshot.val();
            if (newData) {
                appData.categories = newData.categories;
                appData.phase = newData.phase;
                appData.photoUrls = newData.photoUrls;
                
                // Actualizar UI
                if (typeof updatePhaseBanner === 'function') updatePhaseBanner();
                if (typeof renderCategories === 'function') renderCategories();
                if (typeof updateStats === 'function') updateStats();
            }
        });
        
        // Escuchar cambios en users
        onValue(ref(database, 'users'), (snapshot) => {
            const newUsers = snapshot.val();
            if (newUsers) {
                appData.users = newUsers;
                if (typeof updateVotersList === 'function') updateVotersList();
            }
        });
        
        console.log("✅ Listeners de Firebase configurados");
        
    } catch (error) {
        console.error("❌ Error configurando listeners:", error);
    }
}