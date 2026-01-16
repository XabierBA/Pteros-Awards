// ===== FUNCIÓN DE DIAGNÓSTICO FIREBASE =====
function diagnosticarFirebase() {
    console.clear();
    console.log("%c=== 🔍 DIAGNÓSTICO FIREBASE PTEROS AWARDS ===", 
                "color: #FF6B6B; font-size: 16px; font-weight: bold;");
    
    // 1. VERIFICAR FIREBASE BÁSICO
    console.log("%c1. 🔥 CONEXIÓN FIREBASE:", "color: #4ECDC4; font-weight: bold;");
    console.log("   • window.firebaseDatabase:", 
                window.firebaseDatabase ? "✅ PRESENTE" : "❌ AUSENTE");
    console.log("   • window.firebaseApp:", 
                window.firebaseApp ? "✅ PRESENTE" : "❌ AUSENTE");
    console.log("   • window.firebaseInitialized:", 
                window.firebaseInitialized ? "✅ INICIALIZADO" : "❌ NO INICIALIZADO");
    
    // 2. VERIFICAR DATOS LOCALES
    console.log("%c2. 📊 DATOS LOCALES (appData):", "color: #4ECDC4; font-weight: bold;");
    console.log("   • appData:", window.appData ? "✅ DEFINIDO" : "❌ INDEFINIDO");
    console.log("   • Categorías:", window.appData?.categories?.length || 0);
    console.log("   • Usuarios:", window.appData?.users?.length || 0);
    console.log("   • Fotos:", Object.keys(window.appData?.photoUrls || {}).length);
    
    // 3. VERIFICAR LOCALSTORAGE
    console.log("%c3. 💾 LOCALSTORAGE:", "color: #4ECDC4; font-weight: bold;");
    const premiosData = localStorage.getItem('premiosData');
    const premiosUsers = localStorage.getItem('premiosUsers');
    const premiosPhotos = localStorage.getItem('premiosPhotos');
    
    console.log("   • premiosData:", premiosData ? `✅ ${Math.round(premiosData.length/1024)}KB` : "❌ VACÍO");
    console.log("   • premiosUsers:", premiosUsers ? `✅ ${Math.round(premiosUsers.length/1024)}KB` : "❌ VACÍO");
    console.log("   • premiosPhotos:", premiosPhotos ? `✅ ${Math.round(premiosPhotos.length/1024)}KB` : "❌ VACÍO");
    
    // 4. VERIFICAR FUNCIONES FIREBASE
    console.log("%c4. 🔧 FUNCIONES DISPONIBLES:", "color: #4ECDC4; font-weight: bold;");
    console.log("   • loadDataFromFirebase:", typeof loadDataFromFirebase === 'function' ? "✅" : "❌");
    console.log("   • saveDataToFirebase:", typeof saveDataToFirebase === 'function' ? "✅" : "❌");
    console.log("   • saveUsersToFirebase:", typeof saveUsersToFirebase === 'function' ? "✅" : "❌");
    
    // 5. PROBAR FIREBASE MANUALMENTE
    if (window.firebaseDatabase) {
        console.log("%c5. 📡 TEST CONEXIÓN FIREBASE:", "color: #4ECDC4; font-weight: bold;");
        
        // Usar función async para test
        (async () => {
            try {
                const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
                const db = getDatabase();
                
                // Test 1: Leer appData
                const appDataRef = ref(db, 'appData');
                const appDataSnapshot = await get(appDataRef);
                console.log("   • appData en Firebase:", appDataSnapshot.exists() ? "✅ CON DATOS" : "⚠️ VACÍO");
                
                if (appDataSnapshot.exists()) {
                    const data = appDataSnapshot.val();
                    console.log("     - Categorías:", data.categories?.length || 0);
                    console.log("     - Fase:", data.phase || 'N/A');
                    console.log("     - Fotos:", Object.keys(data.photoUrls || {}).length);
                }
                
                // Test 2: Leer users
                const usersRef = ref(db, 'users');
                const usersSnapshot = await get(usersRef);
                console.log("   • users en Firebase:", usersSnapshot.exists() ? `✅ ${Object.keys(usersSnapshot.val() || {}).length} usuarios` : "⚠️ VACÍO");
                
                // Test 3: Leer photos
                const photosRef = ref(db, 'photos');
                const photosSnapshot = await get(photosRef);
                console.log("   • photos en Firebase:", photosSnapshot.exists() ? `✅ ${Object.keys(photosSnapshot.val() || {}).length} fotos` : "⚠️ VACÍO");
                
            } catch (error) {
                console.error("   • ❌ ERROR CONEXIÓN:", error.message);
            }
        })();
    }
    
    // 6. RESUMEN
    console.log("%c6. 📋 RESUMEN:", "color: #FF6B6B; font-weight: bold;");
    
    const problemas = [];
    const correctos = [];
    
    if (!window.firebaseDatabase) problemas.push("Firebase no conectado");
    else correctos.push("Firebase conectado");
    
    if (!window.appData?.categories?.length) problemas.push("Sin categorías en appData");
    else correctos.push(`${window.appData.categories.length} categorías`);
    
    if (!premiosData) problemas.push("LocalStorage vacío");
    else correctos.push("LocalStorage con datos");
    
    if (typeof loadDataFromFirebase !== 'function') problemas.push("Funciones Firebase no cargadas");
    else correctos.push("Funciones Firebase disponibles");
    
    console.log("   • ✅ CORRECTO:", correctos.length > 0 ? correctos.join(", ") : "Nada");
    console.log("   • ❌ PROBLEMAS:", problemas.length > 0 ? problemas.join(", ") : "Ninguno");
    
    console.log("%c=== 🔚 FIN DIAGNÓSTICO ===", "color: #FF6B6B; font-size: 16px; font-weight: bold;");
    
    // Mostrar alerta con resumen
    let mensajeAlerta = "🔍 DIAGNÓSTICO FIREBASE:\n\n";
    
    if (problemas.length > 0) {
        mensajeAlerta += "❌ PROBLEMAS ENCONTRADOS:\n";
        problemas.forEach(p => mensajeAlerta += `• ${p}\n`);
        mensajeAlerta += "\n";
    }
    
    if (correctos.length > 0) {
        mensajeAlerta += "✅ CORRECTO:\n";
        correctos.forEach(c => mensajeAlerta += `• ${c}\n`);
    }
    
    mensajeAlerta += "\nRevisa la consola (F12 → Console) para detalles completos.";
    
    alert(mensajeAlerta);
    
    // Si hay problemas graves, sugerir soluciones
    if (!window.firebaseDatabase) {
        console.log("%c🛠️ SUGERENCIAS:", "color: #FFD166; font-weight: bold;");
        console.log("1. Verifica que index.html carga Firebase v12 correctamente");
        console.log("2. Comprueba la consola Network por errores 404");
        console.log("3. Verifica las reglas de Firebase en la consola");
        console.log("4. Prueba en modo incógnito para descartar extensiones");
    }
}

// ===== AÑADIR ESTILOS PARA EL BOTÓN =====
// Añade esto en tu style.css o inline
const estiloDiagnostico = `
.btn-diagnostic {
    background: linear-gradient(90deg, #FF6B6B, #FF8E53) !important;
    color: white !important;
    border: none !important;
    padding: 12px 20px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    font-weight: bold !important;
    transition: all 0.3s !important;
    margin: 5px !important;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4) !important;
}

.btn-diagnostic:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6) !important;
    background: linear-gradient(90deg, #FF5252, #FF7B3D) !important;
}

.btn-diagnostic:active {
    transform: translateY(0) !important;
}
`;

// Añadir estilos al documento
if (!document.querySelector('#estilos-diagnostico')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'estilos-diagnostico';
    styleElement.textContent = estiloDiagnostico;
    document.head.appendChild(styleElement);
}