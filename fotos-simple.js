// fotos-simple.js - Sistema de fotos SIMPLE Y FUNCIONAL

console.log("📸 Módulo de fotos cargado (esperando inicialización)...");

// LISTA DE PERSONAS DEL GRUPO PTEROS
const PTEROS_PERSONAS = [
    "Brais", "Amalia", "Carlita", "Daniel", "Guille", 
    "Iker", "Joel", "Jose", "Nico", "Ruchiti", 
    "Sara", "Tiago", "Xabi"
];

// FUNCIÓN PARA GENERAR AVATAR AUTOMÁTICO
function generarAvatar(nombre) {
    if (!nombre) nombre = "Usuario";
    
    // Colores bonitos para avatares
    const colores = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8'];
    
    // Generar color basado en el nombre (siempre el mismo para cada persona)
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colores.length;
    const color = colores[colorIndex];
    
    // Usar UI Avatars (servicio gratuito y confiable)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${color}&color=fff&size=200&bold=true`;
}

// FUNCIÓN PRINCIPAL PARA OBTENER FOTO DE UNA PERSONA
function obtenerFotoPersona(nombre) {
    if (!nombre) return generarAvatar("Usuario");
    
    const nombreLimpio = nombre.trim();
    
    // Buscar foto en appData si existe
    if (window.appData && window.appData.photoUrls && window.appData.photoUrls[nombreLimpio]) {
        const foto = window.appData.photoUrls[nombreLimpio];
        // Verificar que la foto no sea un placeholder vacío
        if (foto && foto !== '' && !foto.includes('undefined')) {
            return foto;
        }
    }
    
    // Si no hay foto, generar avatar
    return generarAvatar(nombreLimpio);
}

// FUNCIÓN PARA INICIALIZAR FOTOS (llamar desde script.js)
function inicializarFotos() {
    console.log("🔄 Inicializando sistema de fotos...");
    
    // Verificar que appData existe
    if (!window.appData) {
        console.error("❌ appData no está disponible");
        return false;
    }
    
    // Crear photoUrls si no existe
    if (!window.appData.photoUrls) {
        window.appData.photoUrls = {};
        console.log("📁 Creada estructura photoUrls");
    }
    
    // Crear avatares para todas las personas si no tienen foto
    let avataresCreados = 0;
    PTEROS_PERSONAS.forEach(persona => {
        if (!window.appData.photoUrls[persona] || 
            window.appData.photoUrls[persona] === '' ||
            window.appData.photoUrls[persona].includes('undefined')) {
            
            window.appData.photoUrls[persona] = generarAvatar(persona);
            avataresCreados++;
        }
    });
    
    console.log(`✅ Sistema de fotos inicializado (${avataresCreados} avatares creados)`);
    return true;
}

// FUNCIÓN PARA ACTUALIZAR FOTO (usar desde panel admin)
function actualizarFotoPersona(persona, nuevaUrl) {
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos: necesita persona y URL");
        return false;
    }
    
    console.log(`📸 Actualizando foto de ${persona}...`);
    
    // Validar URL básica
    if (!nuevaUrl.startsWith('http')) {
        alert("❌ La URL debe empezar con http:// o https://");
        return false;
    }
    
    // Asegurar que appData existe
    if (!window.appData) window.appData = {};
    if (!window.appData.photoUrls) window.appData.photoUrls = {};
    
    // Actualizar la foto
    window.appData.photoUrls[persona] = nuevaUrl;
    
    // Actualizar en todas las categorías
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
    
    console.log(`✅ Foto de ${persona} actualizada`);
    
    // Guardar datos si las funciones existen
    if (typeof saveData === 'function') {
        saveData();
    }
    if (typeof savePhotos === 'function') {
        savePhotos();
    }
    
    // Actualizar UI
    if (typeof renderCategories === 'function') {
        setTimeout(() => renderCategories(), 300);
    }
    
    alert(`✅ Foto de ${persona} actualizada correctamente`);
    return true;
}

// EXPORTAR FUNCIONES AL ÁMBITO GLOBAL
window.obtenerFotoPersona = obtenerFotoPersona;
window.actualizarFotoPersona = actualizarFotoPersona;
window.inicializarFotos = inicializarFotos;
window.generarAvatar = generarAvatar;

console.log("✅ Funciones de fotos exportadas correctamente");