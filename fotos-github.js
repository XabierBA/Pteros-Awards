// =============================================
// fotos-github.js - Fotos almacenadas en GitHub
// =============================================
// Las fotos deben estar en la carpeta 'fotos/' del repositorio

// Configuración de URLs de GitHub
const GITHUB_USER = "XabiERBA"; // TU USUARIO DE GITHUB
const REPO_NAME = "Pteros-Awards"; // NOMBRE DEL REPOSITORIO
const BRANCH = "main"; // RAMA (main o master)
const FOTOS_FOLDER = "fotos"; // CARPETA DONDE ESTÁN LAS FOTOS

// Base URL para las fotos
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/${BRANCH}/${FOTOS_FOLDER}`;

// Nombres de archivo para cada persona
// Puedes usar .jpg, .png, .jpeg, .gif, etc.
const NOMBRES_ARCHIVOS = {
    "Brais": "brais.jpg",
    "Amalia": "amalia.jpg",
    "Carlita": "carlita.jpg",
    "Daniel": "daniel.jpg",
    "Guille": "guille.jpg",
    "Iker": "iker.jpg",
    "Joel": "joel.jpg",
    "Jose": "jose.jpg",
    "Nico": "nico.jpg",
    "Ruchiti": "ruchiti.jpg",
    "Sara": "sara.jpg",
    "Tiago": "tiago.jpg",
    "Xabi": "xabi.jpg"
};

// URLs completas de las fotos
const FOTOS_GITHUB = {};
Object.entries(NOMBRES_ARCHIVOS).forEach(([persona, archivo]) => {
    FOTOS_GITHUB[persona] = `${GITHUB_BASE_URL}/${archivo}`;
});

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

/**
 * Verifica si una URL de imagen existe
 * @param {string} url - URL de la imagen
 * @returns {Promise<boolean>} - True si la imagen existe
 */
async function verificarImagenExiste(url) {
    if (!url) return false;
    
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.log(`❌ Error verificando imagen ${url}:`, error.message);
        return false;
    }
}

/**
 * Carga una imagen y devuelve una promesa
 * @param {string} url - URL de la imagen
 * @returns {Promise<HTMLImageElement>} - Imagen cargada
 */
function cargarImagen(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error("URL no válida"));
            return;
        }
        
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Error cargando imagen: ${url}`));
        img.src = url;
    });
}

/**
 * Obtiene la URL de la foto de una persona
 * @param {string} persona - Nombre de la persona
 * @returns {string} - URL de la foto
 */
function obtenerFotoPersona(persona) {
    if (!persona || !FOTOS_GITHUB[persona]) {
        console.warn(`⚠️ No hay foto configurada para: ${persona}`);
        
        // Foto por defecto con inicial
        const inicial = persona ? persona.charAt(0).toUpperCase() : '?';
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23667eea"/><text x="50%" y="50%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" dy=".3em">${inicial}</text></svg>`;
    }
    
    return FOTOS_GITHUB[persona];
}

/**
 * Carga las fotos desde GitHub
 * @param {boolean} forzar - Forzar recarga incluso si ya hay fotos
 * @returns {Promise<boolean>} - True si se cargaron fotos
 */
async function cargarFotosGitHub(forzar = false) {
    console.log("📸 Cargando fotos desde GitHub...");
    
    // Verificar si appData está disponible
    if (!window.appData) {
        console.error("❌ appData no está disponible");
        return false;
    }
    
    // Inicializar photoUrls si no existe
    if (!appData.photoUrls) {
        appData.photoUrls = {};
    }
    
    // Verificar si ya hay fotos y no forzar
    const hayFotos = Object.keys(appData.photoUrls).length > 0;
    if (hayFotos && !forzar) {
        console.log("✅ Fotos ya están cargadas");
        return false;
    }
    
    let fotosCargadas = 0;
    const errores = [];
    
    // Cargar cada foto
    for (const [persona, url] of Object.entries(FOTOS_GITHUB)) {
        try {
            // Verificar si la imagen existe en GitHub
            const existe = await verificarImagenExiste(url);
            
            if (existe) {
                appData.photoUrls[persona] = url;
                fotosCargadas++;
                console.log(`✅ Foto cargada: ${persona}`);
            } else {
                // Usar foto por defecto si no existe
                const inicial = persona.charAt(0).toUpperCase();
                appData.photoUrls[persona] = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23667eea"/><text x="50%" y="50%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" dy=".3em">${inicial}</text></svg>`;
                errores.push(`${persona}: No encontrada en GitHub`);
                console.warn(`⚠️ Foto no encontrada para: ${persona}`);
            }
            
        } catch (error) {
            errores.push(`${persona}: ${error.message}`);
            console.error(`❌ Error cargando foto de ${persona}:`, error);
        }
    }
    
    // Mostrar resumen
    if (errores.length > 0) {
        console.warn(`⚠️ ${errores.length} fotos con problemas:`, errores);
    }
    
    console.log(`✅ ${fotosCargadas} fotos cargadas desde GitHub`);
    
    // Guardar las fotos si se cargaron nuevas
    if (fotosCargadas > 0 && typeof savePhotos === 'function') {
        savePhotos();
    }
    
    return fotosCargadas > 0;
}

/**
 * Actualiza la foto de una persona específica
 * @param {string} persona - Nombre de la persona
 * @param {string} nombreArchivo - Nombre del archivo en GitHub (ej: "brais-nueva.jpg")
 * @returns {Promise<boolean>} - True si se actualizó correctamente
 */
async function actualizarFotoGitHub(persona, nombreArchivo) {
    if (!persona || !nombreArchivo) {
        console.error("❌ Persona o nombre de archivo no válido");
        return false;
    }
    
    const nuevaUrl = `${GITHUB_BASE_URL}/${nombreArchivo}`;
    
    try {
        // Verificar que la imagen existe
        const existe = await verificarImagenExiste(nuevaUrl);
        
        if (!existe) {
            console.error(`❌ La imagen no existe en GitHub: ${nuevaUrl}`);
            return false;
        }
        
        // Actualizar en photoUrls
        if (!appData.photoUrls) {
            appData.photoUrls = {};
        }
        
        appData.photoUrls[persona] = nuevaUrl;
        
        // Actualizar en todas las categorías
        if (appData.categories) {
            appData.categories.forEach(categoria => {
                if (categoria.nominees) {
                    const nominado = categoria.nominees.find(n => n && n.name === persona);
                    if (nominado) {
                        nominado.photo = nuevaUrl;
                    }
                }
            });
        }
        
        console.log(`✅ Foto actualizada para ${persona}: ${nuevaUrl}`);
        
        // Actualizar también en NOMBRES_ARCHIVOS para futuras cargas
        if (NOMBRES_ARCHIVOS[persona]) {
            NOMBRES_ARCHIVOS[persona] = nombreArchivo;
        }
        
        // Guardar cambios
        if (typeof savePhotos === 'function') {
            savePhotos();
        }
        if (typeof saveData === 'function') {
            saveData();
        }
        if (typeof renderCategories === 'function') {
            setTimeout(() => renderCategories(), 100);
        }
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error actualizando foto de ${persona}:`, error);
        return false;
    }
}

/**
 * Crea una imagen de placeholder con inicial
 * @param {string} nombre - Nombre de la persona
 * @param {number} size - Tamaño en píxeles
 * @returns {string} - Data URL del SVG
 */
function crearPlaceholder(nombre, size = 200) {
    const inicial = nombre ? nombre.charAt(0).toUpperCase() : '?';
    const colores = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const color = colores[inicial.charCodeAt(0) % colores.length];
    
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${color}"/><text x="50%" y="50%" font-family="Arial" font-size="${size/2.5}" fill="white" text-anchor="middle" dy=".3em">${inicial}</text></svg>`;
}

/**
 * Función para precargar todas las imágenes
 * @returns {Promise<Array>} - Array de promesas de carga
 */
function precargarFotos() {
    const promesas = [];
    
    Object.values(FOTOS_GITHUB).forEach(url => {
        promesas.push(
            cargarImagen(url).catch(() => {
                // Si falla, usar placeholder
                return null;
            })
        );
    });
    
    return Promise.all(promesas);
}

/**
 * Inicializa el sistema de fotos
 */
async function inicializarFotosGitHub() {
    console.log("🚀 Inicializando sistema de fotos GitHub...");
    
    // Precargar imágenes en segundo plano
    setTimeout(() => {
        precargarFotos().then(() => {
            console.log("✅ Fotos precargadas en caché");
        }).catch(error => {
            console.warn("⚠️ Error precargando fotos:", error);
        });
    }, 1000);
    
    // Esperar a que la app esté lista, luego cargar fotos
    const esperarApp = setInterval(() => {
        if (window.appData && typeof savePhotos === 'function') {
            clearInterval(esperarApp);
            setTimeout(() => cargarFotosGitHub(), 500);
        }
    }, 100);
}

// =============================================
// EXPORTACIÓN DE FUNCIONES
// =============================================

// Exponer funciones globalmente
window.FOTOS_GITHUB = FOTOS_GITHUB;
window.cargarFotosGitHub = cargarFotosGitHub;
window.actualizarFotoGitHub = actualizarFotoGitHub;
window.obtenerFotoPersona = obtenerFotoPersona;
window.crearPlaceholder = crearPlaceholder;
window.GITHUB_BASE_URL = GITHUB_BASE_URL;
window.NOMBRES_ARCHIVOS = NOMBRES_ARCHIVOS;

// =============================================
// INICIALIZACIÓN AUTOMÁTICA
// =============================================

// Ejecutar cuando se cargue el script
(function() {
    console.log("📸 Módulo de fotos GitHub cargado");
    console.log(`📁 URL base: ${GITHUB_BASE_URL}`);
    
    // Inicializar después de un breve retraso
    setTimeout(inicializarFotosGitHub, 500);
})();

// =============================================
// EJEMPLOS DE USO:
// =============================================
/*
// 1. Para cargar todas las fotos:
cargarFotosGitHub().then(exito => {
    console.log(exito ? "✅ Fotos cargadas" : "⚠️ Ya había fotos");
});

// 2. Para actualizar una foto:
actualizarFotoGitHub("Brais", "brais-nueva.jpg").then(exito => {
    console.log(exito ? "✅ Foto actualizada" : "❌ Error");
});

// 3. Para obtener la URL de una foto:
const urlBrais = obtenerFotoPersona("Brais");

// 4. Para forzar recarga:
cargarFotosGitHub(true);
*/