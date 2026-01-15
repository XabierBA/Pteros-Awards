// En la función actualizarFotoPersona, reemplaza todo por:
function actualizarFotoPersona(persona, nuevaUrl) {
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos: necesita persona y URL");
        return false;
    }
    
    console.log(`📸 Actualizando foto de ${persona} en Firebase...`);
    
    // Validar URL básica
    if (!nuevaUrl.startsWith('http')) {
        alert("❌ La URL debe empezar con http:// o https://");
        return false;
    }
    
    // Asegurar que appData existe
    if (!window.appData) window.appData = {};
    if (!window.appData.photoUrls) window.appData.photoUrls = {};
    
    // 1. ACTUALIZAR LOCALMENTE
    window.appData.photoUrls[persona] = nuevaUrl;
    
    // 2. ACTUALIZAR EN CATEGORÍAS
    if (window.appData.categories && Array.isArray(window.appData.categories)) {
        window.appData.categories.forEach(categoria => {
            if (categoria.nominees && Array.isArray(categoria.nominees)) {
                categoria.nominees.forEach(nominado => {
                    if (nominado && nominado.name === persona) {
                        nominado.photo = nuevaUrl;
                    }
                });
            }
        });
    }
    
    console.log(`✅ Foto de ${persona} actualizada localmente`);
    
    // 3. GUARDAR EN FIREBASE (¡IMPORTANTE!)
    guardarFotoEnFirebase(persona, nuevaUrl);
    
    // 4. GUARDAR EN LOCALSTORAGE (backup)
    if (typeof savePhotos === 'function') {
        savePhotos();
    }
    
    // 5. ACTUALIZAR UI
    if (typeof renderCategories === 'function') {
        setTimeout(() => renderCategories(), 300);
    }
    
    alert(`✅ Foto de ${persona} actualizada y guardada en la nube`);
    return true;
}

// NUEVA FUNCIÓN: Guardar foto en Firebase
async function guardarFotoEnFirebase(persona, url) {
    try {
        // Verificar que Firebase está disponible
        if (!window.firebaseDatabase) {
            console.log("⚠️ Firebase no disponible, guardando solo localmente");
            return false;
        }
        
        console.log(`💾 Guardando foto de ${persona} en Firebase...`);
        
        const { getDatabase, ref, set } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const db = getDatabase();
        
        // Guardar en la ruta: photos/[persona]
        const photoRef = ref(db, `photos/${persona}`);
        await set(photoRef, url);
        
        console.log(`✅ Foto de ${persona} guardada en Firebase`);
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        return false;
    }
}

// NUEVA FUNCIÓN: Cargar todas las fotos desde Firebase
async function cargarFotosDeFirebase() {
    try {
        if (!window.firebaseDatabase) {
            console.log("⚠️ Firebase no disponible para cargar fotos");
            return false;
        }
        
        console.log("📥 Cargando fotos desde Firebase...");
        
        const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const db = getDatabase();
        
        const photosRef = ref(db, 'photos');
        const snapshot = await get(photosRef);
        
        if (snapshot.exists()) {
            const fotosFirebase = snapshot.val();
            
            // Asegurar que appData existe
            if (!window.appData) window.appData = {};
            if (!window.appData.photoUrls) window.appData.photoUrls = {};
            
            // Combinar fotos (Firebase tiene prioridad)
            window.appData.photoUrls = { ...window.appData.photoUrls, ...fotosFirebase };
            
            console.log(`✅ ${Object.keys(fotosFirebase).length} fotos cargadas desde Firebase`);
            return true;
        } else {
            console.log("ℹ️ No hay fotos en Firebase aún");
            return false;
        }
        
    } catch (error) {
        console.error("❌ Error cargando fotos de Firebase:", error);
        return false;
    }
}

// Modificar la función inicializarFotos para cargar de Firebase
async function inicializarFotos() {
    console.log("🔄 Inicializando sistema de fotos...");
    
    // Asegurar que appData existe
    if (!window.appData) {
        console.error("❌ appData no está disponible");
        return false;
    }
    
    // Crear photoUrls si no existe
    if (!window.appData.photoUrls) {
        window.appData.photoUrls = {};
        console.log("📁 Creada estructura photoUrls");
    }
    
    // 1. INTENTAR CARGAR DE FIREBASE PRIMERO
    const cargadoDeFirebase = await cargarFotosDeFirebase();
    
    // 2. CREAR AVATARES PARA LOS QUE NO TENGAN FOTO
    let avataresCreados = 0;
    PTEROS_PERSONAS.forEach(persona => {
        if (!window.appData.photoUrls[persona] || 
            window.appData.photoUrls[persona] === '' ||
            window.appData.photoUrls[persona].includes('undefined')) {
            
            window.appData.photoUrls[persona] = generarAvatar(persona);
            avataresCreados++;
        }
    });
    
    console.log(`✅ Sistema de fotos inicializado`);
    console.log(`   - Fotos de Firebase: ${cargadoDeFirebase ? 'Sí' : 'No'}`);
    console.log(`   - Avatares creados: ${avataresCreados}`);
    
    return true;
}