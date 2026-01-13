// ===== CONFIGURACIÓN FIREBASE =====
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    databaseURL: "https://TU_PROYECTO.firebasedatabase.app",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== FUNCIONES PARA FIREBASE =====

// Guardar datos en Firebase
async function saveDataToFirebase() {
    try {
        const dataToSave = {
            categories: appData.categories,
            phase: appData.phase,
            photoUrls: appData.photoUrls,
            lastUpdated: new Date().toISOString()
        };
        
        await database.ref('appData').set(dataToSave);
        console.log("✅ Datos guardados en Firebase");
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        // Guardar en localStorage como backup
        localStorage.setItem('premiosData', JSON.stringify(appData.categories));
    }
}

// Cargar datos desde Firebase
async function loadDataFromFirebase() {
    try {
        const snapshot = await database.ref('appData').once('value');
        const firebaseData = snapshot.val();
        
        if (firebaseData) {
            appData.categories = firebaseData.categories || [];
            appData.phase = firebaseData.phase || 'nominations';
            appData.photoUrls = firebaseData.photoUrls || {};
            
            console.log("✅ Datos cargados desde Firebase");
        } else {
            // Si no hay datos en Firebase, usar defaults
            console.log("⚠️ No hay datos en Firebase, usando defaults");
            appData.categories = createDefaultCategories();
        }
    } catch (error) {
        console.error("❌ Error cargando de Firebase:", error);
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
        await database.ref('users').set(appData.users);
        console.log("✅ Usuarios guardados en Firebase");
    } catch (error) {
        console.error("❌ Error guardando usuarios:", error);
        localStorage.setItem('premiosUsers', JSON.stringify(appData.users));
    }
}

// Cargar usuarios desde Firebase
async function loadUsersFromFirebase() {
    try {
        const snapshot = await database.ref('users').once('value');
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

// Escuchar cambios en tiempo real
function setupRealtimeListeners() {
    database.ref('appData').on('value', (snapshot) => {
        const newData = snapshot.val();
        if (newData) {
            appData.categories = newData.categories;
            appData.phase = newData.phase;
            appData.photoUrls = newData.photoUrls;
            
            // Actualizar UI
            updatePhaseBanner();
            renderCategories();
            updateStats();
        }
    });
    
    database.ref('users').on('value', (snapshot) => {
        const newUsers = snapshot.val();
        if (newUsers) {
            appData.users = newUsers;
            updateVotersList();
        }
    });
}