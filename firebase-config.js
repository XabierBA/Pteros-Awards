// ===== CONFIGURACIÓN FIREBASE =====

let firebaseDB = null;
let firebaseReady = false;

// Función para esperar Firebase
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseDatabase) {
            firebaseDB = window.firebaseDatabase;
            firebaseReady = true;
            console.log("✅ Firebase Database disponible");
            resolve(true);
            return;
        }
        
        // Escuchar evento firebaseReady
        const onFirebaseReady = () => {
            if (window.firebaseDatabase) {
                firebaseDB = window.firebaseDatabase;
                firebaseReady = true;
                document.removeEventListener('firebaseReady', onFirebaseReady);
                console.log("✅ Firebase Database listo después del evento");
                resolve(true);
            }
        };
        
        document.addEventListener('firebaseReady', onFirebaseReady);
        
        // Timeout después de 5 segundos
        setTimeout(() => {
            if (!firebaseReady) {
                document.removeEventListener('firebaseReady', onFirebaseReady);
                console.log("⚠️ Firebase no se cargó después de timeout");
                resolve(false);
            }
        }, 5000);
    });
}

// ===== FUNCIONES PARA FIREBASE =====

// Cargar datos desde Firebase
async function loadDataFromFirebase() {
    try {
        console.log("📥 Intentando cargar datos de Firebase...");
        const ready = await waitForFirebase();
        
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const snapshot = await get(ref(firebaseDB, 'appData'));
        const data = snapshot.val();
        
        if (data) {
            appData.categories = data.categories || [];
            appData.phase = data.phase || 'nominations';
            appData.photoUrls = data.photoUrls || {};
            console.log("✅ Datos cargados de Firebase. Categorías:", appData.categories.length);
        } else {
            console.log("⚠️ No hay datos en Firebase");
        }
        
    } catch (error) {
        console.log("📂 Usando localStorage (error Firebase):", error.message);
        const saved = localStorage.getItem('premiosData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                appData.categories = parsed.categories || [];
                appData.phase = parsed.phase || 'nominations';
                appData.photoUrls = parsed.photoUrls || {};
                console.log("📂 Datos cargados de localStorage. Categorías:", appData.categories.length);
            } catch (e) {
                console.error("Error parseando localStorage:", e);
            }
        }
    }
}

// Guardar datos en Firebase
async function saveDataToFirebase() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const dataToSave = {
            categories: appData.categories || [],
            phase: appData.phase || 'nominations',
            photoUrls: appData.photoUrls || {},
            lastUpdated: new Date().toISOString()
        };
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        await set(ref(firebaseDB, 'appData'), dataToSave);
        console.log("💾 Datos guardados en Firebase");
        
    } catch (error) {
        console.log("📦 Guardando en localStorage:", error.message);
        localStorage.setItem('premiosData', JSON.stringify({
            categories: appData.categories || [],
            phase: appData.phase || 'nominations',
            photoUrls: appData.photoUrls || {}
        }));
    }
}

// Cargar usuarios desde Firebase
async function loadUsersFromFirebase() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            const saved = localStorage.getItem('premiosUsers');
            appData.users = saved ? JSON.parse(saved) : [];
            console.log("👥 Usuarios cargados de localStorage:", appData.users.length);
            return;
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const snapshot = await get(ref(firebaseDB, 'users'));
        const users = snapshot.val();
        appData.users = users || [];
        console.log("👥 Usuarios cargados de Firebase:", appData.users.length);
        
    } catch (error) {
        console.log("📂 Usuarios de localStorage (error Firebase):", error.message);
        const saved = localStorage.getItem('premiosUsers');
        appData.users = saved ? JSON.parse(saved) : [];
    }
}

// Guardar usuarios en Firebase
async function saveUsersToFirebase() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            localStorage.setItem('premiosUsers', JSON.stringify(appData.users || []));
            console.log("📦 Usuarios guardados en localStorage");
            return;
        }
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        await set(ref(firebaseDB, 'users'), appData.users || []);
        console.log("💾 Usuarios guardados en Firebase");
        
    } catch (error) {
        console.log("📦 Usuarios guardados en localStorage (error):", error.message);
        localStorage.setItem('premiosUsers', JSON.stringify(appData.users || []));
    }
}

// Setup listeners (solo para actualizaciones en tiempo real)
async function setupRealtimeListeners() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            console.log("🔕 Listeners de Firebase desactivados");
            return;
        }
        
        const { onValue, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Listener para datos de la app
        onValue(ref(firebaseDB, 'appData'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Actualizar solo si hay cambios
                appData.categories = data.categories || appData.categories;
                appData.phase = data.phase || appData.phase;
                appData.photoUrls = data.photoUrls || appData.photoUrls;
                
                // Actualizar UI si las funciones existen
                if (window.updatePhaseBanner) updatePhaseBanner();
                if (window.renderCategories) renderCategories();
                if (window.updateStats) updateStats();
            }
        });
        
        // Listener para usuarios
        onValue(ref(firebaseDB, 'users'), (snapshot) => {
            const users = snapshot.val();
            if (users) {
                appData.users = users;
                if (window.updateVotersList) updateVotersList();
            }
        });
        
        console.log("🔔 Listeners de Firebase activados");
        
    } catch (error) {
        console.error("❌ Error configurando listeners:", error);
    }
}