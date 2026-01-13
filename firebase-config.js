// ===== CONFIGURACIÓN FIREBASE V12 =====

let database;

// Función para inicializar Firebase
async function initializeFirebase() {
    try {
        // Esperar a que Firebase se cargue
        if (typeof initializeApp === 'undefined') {
            console.log("⚠️ Firebase v12 aún no está cargado");
            return false;
        }
        
        console.log("✅ Firebase v12 está disponible");
        
        // Verificar si ya tenemos la base de datos global
        if (window.firebaseDatabase) {
            database = window.firebaseDatabase;
            console.log("✅ Base de datos obtenida de window.firebaseDatabase");
            return true;
        }
        
        // Si no, intentar obtenerla de otra manera
        const { getDatabase } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        if (window.firebaseApp && getDatabase) {
            database = getDatabase(window.firebaseApp);
            console.log("✅ Base de datos creada con getDatabase");
            return true;
        }
        
        console.error("❌ No se pudo obtener la base de datos");
        return false;
        
    } catch (error) {
        console.error("❌ Error inicializando Firebase v12:", error);
        return false;
    }
}

// ===== FUNCIONES PARA FIREBASE V12 =====

// Guardar datos en Firebase
async function saveDataToFirebase() {
    try {
        // Inicializar Firebase si no está listo
        if (!database) {
            const initialized = await initializeFirebase();
            if (!initialized) {
                throw new Error("Firebase no está disponible");
            }
        }
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        const dataToSave = {
            categories: appData.categories,
            phase: appData.phase,
            photoUrls: appData.photoUrls,
            lastUpdated: new Date().toISOString()
        };
        
        await set(ref(database, 'appData'), dataToSave);
        console.log("✅ Datos guardados en Firebase v12");
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase v12:", error);
        // Guardar en localStorage como backup
        localStorage.setItem('premiosData', JSON.stringify(appData.categories));
    }
}

// Cargar datos desde Firebase
async function loadDataFromFirebase() {
    try {
        // Inicializar Firebase si no está listo
        if (!database) {
            const initialized = await initializeFirebase();
            if (!initialized) {
                throw new Error("Firebase no está disponible");
            }
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        const snapshot = await get(ref(database, 'appData'));
        const firebaseData = snapshot.val();
        
        if (firebaseData) {
            appData.categories = firebaseData.categories || [];
            appData.phase = firebaseData.phase || 'nominations';
            appData.photoUrls = firebaseData.photoUrls || {};
            
            console.log("✅ Datos cargados desde Firebase v12");
        } else {
            // Si no hay datos en Firebase, usar defaults
            console.log("⚠️ No hay datos en Firebase, usando defaults");
            appData.categories = createDefaultCategories();
        }
        
    } catch (error) {
        console.error("❌ Error cargando de Firebase v12:", error);
        // Intentar cargar de localStorage
        const savedData = localStorage.getItem('premiosData');
        if (savedData) {
            appData.categories = JSON.parse(savedData);
        }
    }
}

// Guardar usuarios en Firebase
async function saveUsersToFirebase() {
    try {
        if (!database) {
            const initialized = await initializeFirebase();
            if (!initialized) {
                throw new Error("Firebase no está disponible");
            }
        }
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        await set(ref(database, 'users'), appData.users);
        console.log("✅ Usuarios guardados en Firebase v12");
        
    } catch (error) {
        console.error("❌ Error guardando usuarios en Firebase v12:", error);
        localStorage.setItem('premiosUsers', JSON.stringify(appData.users));
    }
}

// Cargar usuarios desde Firebase
async function loadUsersFromFirebase() {
    try {
        if (!database) {
            const initialized = await initializeFirebase();
            if (!initialized) {
                throw new Error("Firebase no está disponible");
            }
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        const snapshot = await get(ref(database, 'users'));
        const firebaseUsers = snapshot.val();
        
        if (firebaseUsers) {
            appData.users = firebaseUsers;
        } else {
            appData.users = [];
        }
        
    } catch (error) {
        console.error("❌ Error cargando usuarios de Firebase v12:", error);
        const savedUsers = localStorage.getItem('premiosUsers');
        appData.users = savedUsers ? JSON.parse(savedUsers) : [];
    }
}

// Escuchar cambios en tiempo real
function setupRealtimeListeners() {
    try {
        if (!database) {
            console.error("Firebase no está inicializado");
            return;
        }
        
        const { onValue, ref } = require('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
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

// Inicializar Firebase cuando se cargue la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🔥 Inicializando Firebase...");
    await initializeFirebase();
});