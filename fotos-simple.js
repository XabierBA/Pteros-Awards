// fotos-simple.js - Sistema de fotos SIMPLE y FUNCIONAL

console.log("📸 Iniciando sistema de fotos...");

// 1. LISTA DE PERSONAS
const PTEROS_PERSONAS = [
    "Brais", "Amalia", "Carlita", "Daniel", "Guille", 
    "Iker", "Joel", "Jose", "Nico", "Ruchiti", 
    "Sara", "Tiago", "Xabi"
];

// 2. FUNCIÓN PRINCIPAL - OBTENER FOTO (SIEMPRE FUNCIONA)
function obtenerFotoPersona(nombre) {
    if (!nombre) return generarAvatar("Usuario");
    
    const nombreLimpio = nombre.trim();
    
    // 2.1 Primero verificar si hay foto en appData.photoUrls
    if (window.appData && window.appData.photoUrls && window.appData.photoUrls[nombreLimpio]) {
        return window.appData.photoUrls[nombreLimpio];
    }
    
    // 2.2 Si no, generar avatar automático
    return generarAvatar(nombreLimpio);
}

// 3. GENERAR AVATAR (SIEMPRE FUNCIONA)
function generarAvatar(nombre) {
    // Colores bonitos para avatares
    const colores = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8'];
    
    // Generar índice de color basado en el nombre
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colores.length;
    const color = colores[colorIndex];
    
    // Usar UI Avatars (servicio gratuito y confiable)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${color}&color=fff&size=200&bold=true&format=png`;
}

// 4. FUNCIÓN PARA ACTUALIZAR FOTO DESDE ADMIN
function updatePersonPhoto(persona, nuevaUrl) {
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos");
        return false;
    }
    
    console.log(`📸 Actualizando foto de ${persona}`);
    
    // Guardar en appData
    if (!window.appData.photoUrls) {
        window.appData.photoUrls = {};
    }
    window.appData.photoUrls[persona] = nuevaUrl;
    
    // Actualizar en todas las categorías
    if (window.appData.categories) {
        window.appData.categories.forEach(categoria => {
            if (categoria.nominees) {
                categoria.nominees.forEach(nominado => {
                    if (nominado.name === persona) {
                        nominado.photo = nuevaUrl;
                    }
                });
            }
        });
    }
    
    // Guardar datos
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Guardar fotos específicamente
    if (typeof savePhotos === 'function') {
        savePhotos();
    }
    
    // Actualizar UI si es necesario
    if (typeof renderCategories === 'function') {
        setTimeout(() => renderCategories(), 300);
    }
    
    console.log(`✅ Foto de ${persona} actualizada`);
    return true;
}

// 5. INICIALIZACIÓN AUTOMÁTICA
function inicializarFotosSistema() {
    console.log("🔄 Inicializando sistema de fotos...");
    
    // Crear avatares por defecto si no existen
    if (!window.appData.photoUrls) {
        window.appData.photoUrls = {};
    }
    
    PTEROS_PERSONAS.forEach(persona => {
        if (!window.appData.photoUrls[persona]) {
            window.appData.photoUrls[persona] = generarAvatar(persona);
        }
    });
    
    console.log("✅ Sistema de fotos listo");
}

// 6. EJECUTAR CUANDO LA PÁGINA ESTÉ LISTA
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFotosSistema);
} else {
    inicializarFotosSistema();
}

// 7. EXPORTAR FUNCIONES AL GLOBAL
window.obtenerFotoPersona = obtenerFotoPersona;
window.updatePersonPhoto = updatePersonPhoto;
window.generarAvatar = generarAvatar;
window.inicializarFotosSistema = inicializarFotosSistema;