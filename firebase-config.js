// firebase-config.js - VERSIÓN MEJORADA

let firebaseDB = null;
let firebaseReady = false;
let firebaseError = null;

// ===== 1. FUNCIÓN MEJORADA PARA ESPERAR FIREBASE =====
function waitForFirebase() {
    return new Promise((resolve) => {
        // Si ya está listo, devolver inmediatamente
        if (window.firebaseDatabase) {
            firebaseDB = window.firebaseDatabase;
            firebaseReady = true;
            console.log("✅ Firebase Database disponible inmediatamente");
            resolve(true);
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 10; // 10 intentos = 5 segundos
        
        const checkFirebase = () => {
            attempts++;
            
            if (window.firebaseDatabase) {
                firebaseDB = window.firebaseDatabase;
                firebaseReady = true;
                console.log(`✅ Firebase Database listo después de ${attempts} intentos`);
                resolve(true);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.warn("⚠️ Firebase no se cargó después de 5 segundos");
                firebaseError = "Timeout";
                resolve(false);
                return;
            }
            
            // Intentar de nuevo en 500ms
            setTimeout(checkFirebase, 500);
        };
        
        // Empezar a chequear
        checkFirebase();
    });
}

// ===== 2. CARGAR DATOS DE FIREBASE (FORZADO) =====
async function loadDataFromFirebase() {
    console.log("🔥 CARGANDO DATOS DE FIREBASE...");
    
    try {
        const ready = await waitForFirebase();
        
        if (!ready || !firebaseDB) {
            throw new Error("Firebase Database no disponible");
        }
        
        const { get, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Cargar datos principales
        const appDataRef = ref(firebaseDB, 'appData');
        const appDataSnapshot = await get(appDataRef);
        
        // Cargar usuarios
        const usersRef = ref(firebaseDB, 'users');
        const usersSnapshot = await get(usersRef);
        
        // Cargar fotos
        const photosRef = ref(firebaseDB, 'photos');
        const photosSnapshot = await get(photosRef);
        
        console.log("📥 Resultados Firebase:");
        console.log("- appData:", appDataSnapshot.exists() ? "✅" : "❌ Vacío");
        console.log("- users:", usersSnapshot.exists() ? `✅ ${Object.keys(usersSnapshot.val() || {}).length} usuarios` : "❌ Vacío");
        console.log("- photos:", photosSnapshot.exists() ? `✅ ${Object.keys(photosSnapshot.val() || {}).length} fotos` : "❌ Vacío");
        
        // ACTUALIZAR appData CON DATOS DE FIREBASE
        if (appDataSnapshot.exists()) {
            const firebaseData = appDataSnapshot.val();
            
            // Importante: Mezclar datos, no reemplazar
            window.appData.categories = firebaseData.categories || window.appData.categories || [];
            window.appData.phase = firebaseData.phase || window.appData.phase || 'nominations';
            
            // Mezclar photoUrls (Firebase tiene prioridad)
            const firebasePhotos = firebaseData.photoUrls || {};
            window.appData.photoUrls = { ...window.appData.photoUrls, ...firebasePhotos };
            
            console.log("✅ appData actualizado desde Firebase");
            console.log(`   - Categorías: ${window.appData.categories.length}`);
            console.log(`   - Fotos: ${Object.keys(window.appData.photoUrls || {}).length}`);
        }
        
        if (usersSnapshot.exists()) {
            window.appData.users = usersSnapshot.val() || window.appData.users || [];
            console.log(`✅ Usuarios cargados: ${window.appData.users.length}`);
        }
        
        if (photosSnapshot.exists()) {
            const firebasePhotos = photosSnapshot.val() || {};
            // Mezclar fotos específicas de Firebase
            if (!window.appData.photoUrls) window.appData.photoUrls = {};
            window.appData.photoUrls = { ...window.appData.photoUrls, ...firebasePhotos };
            console.log(`✅ Fotos específicas cargadas: ${Object.keys(firebasePhotos).length}`);
        }
        
        // Guardar en localStorage como backup
        localStorage.setItem('premiosData', JSON.stringify({
            categories: window.appData.categories,
            phase: window.appData.phase,
            photoUrls: window.appData.photoUrls
        }));
        
        localStorage.setItem('premiosUsers', JSON.stringify(window.appData.users || []));
        
        console.log("💾 Datos guardados en localStorage como backup");
        
        return true;
        
    } catch (error) {
        console.error("❌ ERROR CARGANDO DE FIREBASE:", error);
        firebaseError = error.message;
        
        // Intentar cargar de localStorage como fallback
        console.log("🔄 Intentando cargar de localStorage...");
        const savedData = localStorage.getItem('premiosData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                window.appData.categories = parsed.categories || window.appData.categories || [];
                window.appData.phase = parsed.phase || window.appData.phase || 'nominations';
                window.appData.photoUrls = parsed.photoUrls || window.appData.photoUrls || {};
                console.log("📂 Datos cargados de localStorage");
            } catch (e) {
                console.error("Error parseando localStorage:", e);
            }
        }
        
        return false;
    }
}

// ===== 3. GUARDAR DATOS EN FIREBASE =====
async function saveDataToFirebase() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const dataToSave = {
            categories: window.appData.categories || [],
            phase: window.appData.phase || 'nominations',
            photoUrls: window.appData.photoUrls || {},
            lastUpdated: new Date().toISOString()
        };
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        await set(ref(firebaseDB, 'appData'), dataToSave);
        
        console.log("💾 Datos guardados en Firebase");
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        return false;
    }
}

// ===== 4. GUARDAR USUARIOS =====
async function saveUsersToFirebase() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            throw new Error("Firebase no disponible");
        }
        
        const { set, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        await set(ref(firebaseDB, 'users'), window.appData.users || []);
        
        console.log("👥 Usuarios guardados en Firebase");
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando usuarios:", error);
        return false;
    }
}

// ===== 5. SINCRONIZACIÓN EN TIEMPO REAL =====
async function setupRealtimeListeners() {
    try {
        const ready = await waitForFirebase();
        if (!ready || !firebaseDB) {
            console.log("🔕 Listeners de Firebase desactivados");
            return;
        }
        
        const { onValue, ref } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        
        // Escuchar cambios en appData
        onValue(ref(firebaseDB, 'appData'), (snapshot) => {
            const data = snapshot.val();
            if (data && window.appData) {
                console.log("🔄 Datos actualizados desde Firebase en tiempo real");
                
                // Solo actualizar si hay cambios reales
                if (JSON.stringify(window.appData.categories) !== JSON.stringify(data.categories)) {
                    window.appData.categories = data.categories || window.appData.categories;
                    if (window.renderCategories) window.renderCategories();
                }
                
                if (window.appData.phase !== data.phase) {
                    window.appData.phase = data.phase || window.appData.phase;
                    if (window.updatePhaseBanner) window.updatePhaseBanner();
                }
                
                // Actualizar fotos
                window.appData.photoUrls = data.photoUrls || window.appData.photoUrls;
                
                if (window.updateStats) window.updateStats();
            }
        });
        
        // Escuchar cambios en usuarios
        onValue(ref(firebaseDB, 'users'), (snapshot) => {
            const users = snapshot.val();
            if (users && window.appData) {
                window.appData.users = users;
                if (window.updateVotersList) window.updateVotersList();
                console.log("🔄 Usuarios actualizados desde Firebase");
            }
        });
        
        console.log("🔔 Listeners de Firebase activados");
        
    } catch (error) {
        console.error("❌ Error configurando listeners:", error);
    }
}

// ===== 6. FORZAR CARGA AL INICIAR =====
document.addEventListener('firebaseReady', function() {
    console.log("🚀 Firebase listo, configurando...");
    
    // Esperar un momento y configurar listeners
    setTimeout(() => {
        setupRealtimeListeners().catch(console.error);
    }, 1000);
});

// ===== 7. FUNCIÓN PARA VER ESTADO =====
window.verificarFirebase = async function() {
    console.log("=== 🔍 DIAGNÓSTICO FIREBASE ===");
    console.log("1. window.firebaseDatabase:", window.firebaseDatabase ? "✅ PRESENTE" : "❌ AUSENTE");
    console.log("2. firebaseDB:", firebaseDB ? "✅ ASIGNADO" : "❌ NO ASIGNADO");
    console.log("3. firebaseReady:", firebaseReady);
    console.log("4. firebaseError:", firebaseError || "Ninguno");
    
    if (window.firebaseDatabase) {
        await testFirebase();
    }
    
    console.log("=== 📊 DATOS ACTUALES ===");
    console.log("appData.categories:", window.appData?.categories?.length || 0);
    console.log("appData.users:", window.appData?.users?.length || 0);
    console.log("appData.photoUrls:", Object.keys(window.appData?.photoUrls || {}).length);
    console.log("=== 🔚 FIN DIAGNÓSTICO ===");
};

console.log("🔥 firebase-config.js cargado");