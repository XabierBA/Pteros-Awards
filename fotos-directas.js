// fotos-directas.js - Fotos incrustadas directamente
console.log("🖼️ Sistema de fotos directas cargado");

// ============================================
// TODAS LAS FOTOS DIRECTAMENTE EN EL CÓDIGO
// ============================================

const FOTOS_DIRECTAS = {
    // BRAIS
    "Brais": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/brais.jpg?raw=true",
    
    // AMALIA  
    "Amalia": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/amalia.jpg?raw=true",
    
    // CARLITA
    "Carlita": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/carlita.jpg?raw=true",
    
    // DANIEL
    "Daniel": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/daniel.jpg?raw=true",
    
    // GUILLE
    "Guille": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/guille.jpg?raw=true",
    
    // IKER
    "Iker": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/iker.jpg?raw=true",
    
    // JOEL
    "Joel": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/joel.jpg?raw=true",
    
    // JOSE
    "Jose": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/jose.jpg?raw=true",
    
    // NICO
    "Nico": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/nico.jpg?raw=true",
    
    // RUCHITI
    "Ruchiti": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/ruchiti.jpg?raw=true",
    
    // SARA
    "Sara": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/sara.jpg?raw=true",
    
    // TIAGO
    "Tiago": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/tiago.jpg?raw=true",
    
    // XABI
    "Xabi": "https://github.com/XabierBA/Pteros-Awards/blob/Photo-gestion/fotos/xabi.jpg?raw=true"
};

// ============================================
// FUNCIÓN PRINCIPAL - SUPER SIMPLE
// ============================================

function obtenerFotoPersona(nombre) {
    if (!nombre) return generarAvatar("Usuario");
    
    const nombreLimpio = nombre.trim();
    
    console.log(`📸 Buscando foto de: ${nombreLimpio}`);
    
    // 1. FOTO DIRECTA (si existe en el objeto)
    if (FOTOS_DIRECTAS[nombreLimpio]) {
        console.log(`✅ Encontrada foto directa para ${nombreLimpio}`);
        return FOTOS_DIRECTAS[nombreLimpio];
    }
    
    // 2. FOTO PERSONALIZADA (si el admin subió una)
    if (window.appData && window.appData.photoUrls && window.appData.photoUrls[nombreLimpio]) {
        const fotoAdmin = window.appData.photoUrls[nombreLimpio];
        if (fotoAdmin && fotoAdmin !== '' && !fotoAdmin.includes('undefined')) {
            console.log(`✅ Usando foto de admin para ${nombreLimpio}`);
            return fotoAdmin;
        }
    }
    
    // 3. AVATAR AUTOMÁTICO (fallback)
    console.log(`⚠️ Usando avatar para ${nombreLimpio}`);
    return generarAvatar(nombreLimpio);
}

// ============================================
// FUNCIÓN PARA GENERAR AVATAR
// ============================================

function generarAvatar(nombre) {
    const colores = [
        '#FF6B6B', // Rojo
        '#4ECDC4', // Turquesa
        '#45B7D1', // Azul claro
        '#96CEB4', // Verde menta
        '#FFEAA7', // Amarillo
        '#DDA0DD', // Lavanda
        '#98D8C8', // Verde agua
        '#F7B267', // Naranja
        '#F25C54', // Rojo coral
        '#6A0572', // Púrpura
        '#118AB2', // Azul oscuro
        '#06D6A0', // Verde esmeralda
        '#FFD166'  // Amarillo dorado
    ];
    
    // Color consistente para cada persona
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    const colorIndex = hash % colores.length;
    const color = colores[colorIndex].replace('#', '');
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${color}&color=fff&size=200&bold=true&font-size=0.5`;
}

// ============================================
// FUNCIÓN PARA PANEL ADMIN
// ============================================

function actualizarFotoPersona(persona, nuevaUrl) {
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos");
        return false;
    }
    
    // Validar URL
    if (!nuevaUrl.startsWith('http://') && !nuevaUrl.startsWith('https://')) {
        alert("❌ La URL debe empezar con http:// o https://");
        return false;
    }
    
    console.log(`🔄 Actualizando foto de ${persona}: ${nuevaUrl.substring(0, 50)}...`);
    
    // Asegurar que appData existe
    if (!window.appData) window.appData = {};
    if (!window.appData.photoUrls) window.appData.photoUrls = {};
    
    // Guardar la nueva URL
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
    
    // Guardar los cambios
    if (typeof savePhotos === 'function') {
        savePhotos();
    }
    
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Actualizar la interfaz
    if (typeof renderCategories === 'function') {
        setTimeout(() => {
            renderCategories();
            console.log(`✅ UI actualizada para ${persona}`);
        }, 300);
    }
    
    alert(`✅ Foto de ${persona} actualizada correctamente`);
    return true;
}

// ============================================
// FUNCIÓN PARA LISTAR TODAS LAS FOTOS
// ============================================

function listarTodasLasFotos() {
    console.log("📋 LISTA DE FOTOS DISPONIBLES:");
    console.log("===============================");
    
    // Fotos directas (desde código)
    Object.keys(FOTOS_DIRECTAS).forEach(persona => {
        console.log(`🖼️ ${persona}: ${FOTOS_DIRECTAS[persona]}`);
    });
    
    // Fotos personalizadas (desde admin)
    if (window.appData && window.appData.photoUrls) {
        Object.keys(window.appData.photoUrls).forEach(persona => {
            if (!FOTOS_DIRECTAS[persona]) {
                console.log(`✨ ${persona} (personalizada): ${window.appData.photoUrls[persona].substring(0, 60)}...`);
            }
        });
    }
    
    console.log("===============================");
    console.log(`Total: ${Object.keys(FOTOS_DIRECTAS).length} fotos directas`);
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

// Crear avatares automáticamente para todos
function inicializarFotosAutomaticas() {
    console.log("🚀 Inicializando fotos automáticas...");
    
    // Lista completa de personas
    const todasLasPersonas = [
        "Brais", "Amalia", "Carlita", "Daniel", "Guille", 
        "Iker", "Joel", "Jose", "Nico", "Ruchiti", 
        "Sara", "Tiago", "Xabi"
    ];
    
    // Asegurar que appData tiene photoUrls
    if (!window.appData) window.appData = {};
    if (!window.appData.photoUrls) window.appData.photoUrls = {};
    
    // Para cada persona, asegurar que tiene una foto
    todasLasPersonas.forEach(persona => {
        if (!window.appData.photoUrls[persona]) {
            // Si no tiene foto personalizada, usar la directa
            if (FOTOS_DIRECTAS[persona]) {
                window.appData.photoUrls[persona] = FOTOS_DIRECTAS[persona];
            }
        }
    });
    
    console.log(`✅ ${todasLasPersonas.length} personas inicializadas con fotos`);
    listarTodasLasFotos();
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.obtenerFotoPersona = obtenerFotoPersona;
window.actualizarFotoPersona = actualizarFotoPersona;
window.generarAvatar = generarAvatar;
window.listarTodasLasFotos = listarTodasLasFotos;
window.FOTOS_DIRECTAS = FOTOS_DIRECTAS;

// Inicializar cuando la página esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFotosAutomaticas);
} else {
    inicializarFotosAutomaticas();
}

console.log("✅ Sistema de fotos directas LISTO");
console.log("🖼️ Fotos cargadas desde GitHub:");
Object.keys(FOTOS_DIRECTAS).forEach(persona => {
    console.log(`   • ${persona}`);
});