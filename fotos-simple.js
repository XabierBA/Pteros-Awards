// fotos-simple.js - Sistema de fotos CORREGIDO

console.log("📸 Módulo de fotos cargado...");

// 1. LISTA DE PERSONAS (DEBE SER GLOBAL EN ESTE ARCHIVO)
const PTEROS_PERSONAS = [
    "Brais", "Amalia", "Carlita", "Daniel", "Guille", 
    "Iker", "Joel", "Jose", "Nico", "Ruchiti", 
    "Sara", "Tiago", "Xabi"
];

// 2. GENERAR AVATAR
function generarAvatar(nombre) {
    if (!nombre) nombre = "Usuario";
    
    const colores = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8'];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colores.length;
    const color = colores[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${color}&color=fff&size=200&bold=true`;
}

// 3. OBTENER FOTO DE PERSONA
function obtenerFotoPersona(nombre) {
    if (!nombre) return generarAvatar("Usuario");
    
    const nombreLimpio = nombre.trim();
    
    if (window.appData && window.appData.photoUrls && window.appData.photoUrls[nombreLimpio]) {
        const foto = window.appData.photoUrls[nombreLimpio];
        if (foto && foto !== '' && !foto.includes('undefined')) {
            return foto;
        }
    }
    
    return generarAvatar(nombreLimpio);
}

// 4. CARGAR FOTOS DE FIREBASE
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
            
            if (!window.appData) window.appData = {};
            if (!window.appData.photoUrls) window.appData.photoUrls = {};
            
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

// 5. GUARDAR FOTO EN FIREBASE
async function guardarFotoEnFirebase(persona, url) {
    try {
        if (!window.firebaseDatabase) {
            console.log("⚠️ Firebase no disponible");
            return false;
        }
        
        console.log(`💾 Guardando foto de ${persona} en Firebase...`);
        
        const { getDatabase, ref, set } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');
        const db = getDatabase();
        
        const photoRef = ref(db, `photos/${persona}`);
        await set(photoRef, url);
        
        console.log(`✅ Foto de ${persona} guardada en Firebase`);
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        return false;
    }
}

// 6. INICIALIZAR SISTEMA DE FOTOS
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
    
    // 1. Intentar cargar de Firebase
    const cargadoDeFirebase = await cargarFotosDeFirebase();
    
    // 2. Crear avatares para los que no tengan foto
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

// 7. ACTUALIZAR FOTO (PANEL ADMIN)
async function actualizarFotoPersona(persona, nuevaUrl) {
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos: necesita persona y URL");
        return false;
    }
    
    console.log(`📸 Actualizando foto de ${persona}...`);
    
    if (!nuevaUrl.startsWith('http')) {
        alert("❌ La URL debe empezar con http:// o https://");
        return false;
    }
    
    if (!window.appData) window.appData = {};
    if (!window.appData.photoUrls) window.appData.photoUrls = {};
    
    // Actualizar localmente
    window.appData.photoUrls[persona] = nuevaUrl;
    
    // Actualizar en categorías
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
    
    // Guardar en Firebase
    const guardadoFirebase = await guardarFotoEnFirebase(persona, nuevaUrl);
    
    // Guardar en localStorage (backup)
    if (typeof savePhotos === 'function') {
        savePhotos();
    }
    
    // Actualizar UI
    if (typeof renderCategories === 'function') {
        setTimeout(() => renderCategories(), 300);
    }
    
    if (guardadoFirebase) {
        alert(`✅ Foto de ${persona} guardada en la nube`);
    } else {
        alert(`✅ Foto de ${persona} guardada localmente`);
    }
    
    return true;
}

// 8. EXPORTAR FUNCIONES
window.obtenerFotoPersona = obtenerFotoPersona;
window.actualizarFotoPersona = actualizarFotoPersona;
window.inicializarFotos = inicializarFotos;
window.generarAvatar = generarAvatar;
window.PTEROS_PERSONAS = PTEROS_PERSONAS; // Exportar la constante también

console.log("✅ Funciones de fotos exportadas correctamente");