// fotos-simple.js - Sistema mejorado con múltiples extensiones
console.log("📸 Sistema de fotos GitHub cargado");

// URL base de GitHub
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/XabierBA/Pteros-Awards/Photo-gestion/fotos";

// Lista de personas con POSIBLES extensiones
const PERSONAS_FOTOS = {
    "Brais": ["brais.jpg", "brais.jpeg", "brais.png"],
    "Amalia": ["amalia.jpg", "amalia.jpeg", "amalia.png"], 
    "Carlita": ["carlita.jpg", "carlita.jpeg", "carlita.png"],
    "Daniel": ["daniel.jpg", "daniel.jpeg", "daniel.png"],
    "Guille": ["guille.jpg", "guille.jpeg", "guille.png"],
    "Iker": ["iker.jpg", "iker.jpeg", "iker.png"],
    "Joel": ["joel.jpg", "joel.jpeg", "joel.png"],
    "Jose": ["jose.jpg", "jose.jpeg", "jose.png"],
    "Nico": ["nico.jpg", "nico.jpeg", "nico.png"],
    "Ruchiti": ["ruchiti.jpg", "ruchiti.jpeg", "ruchiti.png"],
    "Sara": ["sara.jpg", "sara.jpeg", "sara.png"],
    "Tiago": ["tiago.jpg", "tiago.jpeg", "tiago.png"],
    "Xabi": ["xabi.jpg", "xabi.jpeg", "xabi.png"]
};

// Función para probar si una URL existe
async function verificarImagen(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ existe: true, url });
        img.onerror = () => resolve({ existe: false, url });
        img.src = url;
    });
}

// Función principal MEJORADA
async function obtenerFotoPersona(nombre) {
    if (!nombre) return generarAvatar("Usuario");
    
    const nombreLimpio = nombre.trim();
    
    // 1. Primero, foto personalizada en appData
    if (window.appData && window.appData.photoUrls && window.appData.photoUrls[nombreLimpio]) {
        const fotoPersonalizada = window.appData.photoUrls[nombreLimpio];
        if (fotoPersonalizada && !fotoPersonalizada.includes('undefined') && fotoPersonalizada !== '') {
            return fotoPersonalizada;
        }
    }
    
    // 2. Si es persona conocida, buscar en GitHub
    if (PERSONAS_FOTOS[nombreLimpio]) {
        const posiblesArchivos = PERSONAS_FOTOS[nombreLimpio];
        
        // Probar cada extensión
        for (const archivo of posiblesArchivos) {
            const urlGitHub = `${GITHUB_BASE_URL}/${archivo}`;
            const resultado = await verificarImagen(urlGitHub);
            
            if (resultado.existe) {
                console.log(`✅ Encontrada: ${nombreLimpio} -> ${archivo}`);
                return urlGitHub;
            }
        }
        
        console.log(`⚠️ No se encontró foto de ${nombreLimpio} en GitHub`);
    }
    
    // 3. Avatar como última opción
    return generarAvatar(nombreLimpio);
}

function obtenerFotoPersonaSimple(nombre) {
    if (!nombre) return generarAvatar("Usuario");
    
    const nombreLimpio = nombre.trim();
    const nombreArchivo = nombreLimpio.toLowerCase();
    
    // 1. Foto personalizada primero
    if (window.appData && window.appData.photoUrls && window.appData.photoUrls[nombreLimpio]) {
        const foto = window.appData.photoUrls[nombreLimpio];
        if (foto && !foto.includes('undefined') && foto !== '') {
            return foto;
        }
    }
    
    // 2. Probar .jpeg primero, luego .jpg
    const baseURL = "https://raw.githubusercontent.com/XabierBA/Pteros-Awards/Photo-gestion/fotos";
    
    // Primero .jpeg (como amalia.jpeg)
    const urlJpeg = `${baseURL}/${nombreArchivo}.jpeg`;
    
    // Luego .jpg como fallback
    const urlJpg = `${baseURL}/${nombreArchivo}.jpg`;
    
    // Devolver .jpeg por ahora (cámbialo según lo que tengas)
    return urlJpeg; // O urlJpg si tus fotos son .jpg
}

// Generar avatar
function generarAvatar(nombre) {
    const colores = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8'];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colores.length;
    const color = colores[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=${color}&color=fff&size=200&bold=true`;
}

// Función para panel admin
function actualizarFotoPersona(persona, nuevaUrl) {
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos");
        return false;
    }
    
    if (!nuevaUrl.startsWith('http')) {
        alert("❌ La URL debe empezar con http:// o https://");
        return false;
    }
    
    if (!window.appData) window.appData = {};
    if (!window.appData.photoUrls) window.appData.photoUrls = {};
    
    // Guardar
    window.appData.photoUrls[persona] = nuevaUrl;
    
    // Actualizar categorías
    if (window.appData.categories) {
        window.appData.categories.forEach(categoria => {
            if (categoria.nominees) {
                categoria.nominees.forEach(nominado => {
                    if (nominado && nominado.name === persona) {
                        nominado.photo = nuevaUrl;
                    }
                });
            }
        });
    }
    
    // Guardar datos
    if (typeof savePhotos === 'function') savePhotos();
    if (typeof saveData === 'function') saveData();
    
    alert(`✅ Foto de ${persona} actualizada`);
    return true;
}

// Exportar funciones
window.obtenerFotoPersona = obtenerFotoPersonaSimple; // Usar la versión simple
window.actualizarFotoPersona = actualizarFotoPersona;
window.generarAvatar = generarAvatar;

console.log("✅ Sistema de fotos listo (con soporte .jpeg)");