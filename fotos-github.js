// fotos-github.js
// Este archivo carga las fotos desde URLs de GitHub

// Variables globales para fotos
window.personPhotos = {};

// URLs base para las fotos
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/XabierBA/Pteros-Awards/Photo-gestion/fotos";

// Función para cargar fotos desde GitHub
async function cargarFotosGitHub() {
    console.log("📸 Cargando fotos desde GitHub...");
    
    // Lista de personas (debe coincidir con los nombres en tu app)
    const personas = [
        "Brais", "Amalia", "Carlita", "Daniel", "Guille", 
        "Iker", "Joel", "Jose", "Nico", "Ruchiti", 
        "Sara", "Tiago", "Xabi"
    ];
    
    try {
        // Primero intentar cargar de Firebase si está disponible
        if (window.firebaseDatabase && window.appData && window.appData.photos) {
            console.log("📸 Usando fotos de Firebase");
            window.personPhotos = window.appData.photos || {};
        }
        
        // Verificar qué fotos ya tenemos
        const fotosCargadas = {};
        const fotosFaltantes = [];
        
        for (const persona of personas) {
            // Si ya tenemos la foto de Firebase, usarla
            if (window.personPhotos && window.personPhotos[persona]) {
                fotosCargadas[persona] = window.personPhotos[persona];
                console.log(`✅ Foto de ${persona}: ${window.personPhotos[persona].substring(0, 50)}...`);
            } else {
                // Si no, construir URL de GitHub
                const nombreArchivo = persona.toLowerCase().replace(/\s/g, '') + '.jpg';
                const url = `${GITHUB_BASE_URL}/${nombreArchivo}`;
                fotosCargadas[persona] = url;
                fotosFaltantes.push(persona);
                console.log(`⚠️ Foto de ${persona}: usando GitHub (${url})`);
            }
        }
        
        window.personPhotos = fotosCargadas;
        
        if (fotosFaltantes.length > 0) {
            console.log(`📸 ${fotosFaltantes.length} fotos cargadas desde GitHub:`, fotosFaltantes);
        } else {
            console.log("✅ Todas las fotos cargadas desde Firebase");
        }
        
        return window.personPhotos;
        
    } catch (error) {
        console.error("❌ Error cargando fotos:", error);
        
        // En caso de error, crear URLs básicas
        const fotosPorDefecto = {};
        for (const persona of personas) {
            const nombreArchivo = persona.toLowerCase().replace(/\s/g, '') + '.jpg';
            fotosPorDefecto[persona] = `${GITHUB_BASE_URL}/${nombreArchivo}`;
        }
        
        window.personPhotos = fotosPorDefecto;
        console.log("⚠️ Usando fotos por defecto debido a error");
        
        return window.personPhotos;
    }
}

// Función para obtener la URL de la foto de una persona
function obtenerFotoPersona(nombre) {
    if (!nombre) return null;
    
    // Limpiar el nombre (por si hay espacios extras)
    const nombreLimpio = nombre.trim();
    
    // Buscar en las fotos cargadas
    if (window.personPhotos && window.personPhotos[nombreLimpio]) {
        return window.personPhotos[nombreLimpio];
    }
    
    // Si no está, construir URL basada en el nombre
    const nombreArchivo = nombreLimpio.toLowerCase().replace(/\s/g, '') + '.jpg';
    return `${GITHUB_BASE_URL}/${nombreArchivo}`;
}

// Función para actualizar la foto de una persona (para el panel admin)
function updatePersonPhoto(personName, photoUrl) {
    if (!personName || !photoUrl) {
        alert("Por favor, selecciona una persona y proporciona una URL de foto válida.");
        return;
    }
    
    // Validar URL
    if (!photoUrl.startsWith('http')) {
        alert("La URL debe comenzar con http:// o https://");
        return;
    }
    
    // Actualizar en el objeto local
    if (!window.personPhotos) window.personPhotos = {};
    window.personPhotos[personName] = photoUrl;
    
    // Guardar en Firebase si está disponible
    if (window.firebaseDatabase && window.appData) {
        const { ref, set } = require("https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js");
        const photosRef = ref(window.firebaseDatabase, 'photos');
        
        set(photosRef, window.personPhotos)
            .then(() => {
                console.log(`✅ Foto de ${personName} guardada en Firebase`);
                alert(`✅ Foto de ${personName} actualizada correctamente`);
            })
            .catch((error) => {
                console.error("❌ Error guardando foto en Firebase:", error);
                alert("⚠️ Foto actualizada localmente pero no en Firebase");
            });
    } else {
        alert(`✅ Foto de ${personName} actualizada localmente`);
    }
    
    // Actualizar la lista de fotos en el panel admin si está abierto
    updatePhotosList();
    
    // Limpiar campos
    if (document.getElementById('personSelect')) {
        document.getElementById('personSelect').value = '';
    }
    if (document.getElementById('photoUrl')) {
        document.getElementById('photoUrl').value = '';
    }
}

// Función para actualizar la lista de fotos en el panel admin
function updatePhotosList() {
    const photosList = document.getElementById('photosList');
    if (!photosList) return;
    
    photosList.innerHTML = '';
    
    if (!window.personPhotos) {
        photosList.innerHTML = '<p class="no-photos">No hay fotos cargadas</p>';
        return;
    }
    
    Object.entries(window.personPhotos).forEach(([name, url]) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        photoItem.innerHTML = `
            <div class="photo-info">
                <strong>${name}</strong>
                <div class="photo-url">${url.substring(0, 50)}...</div>
            </div>
            <div class="photo-actions">
                <button onclick="copyPhotoUrl('${name}')" class="btn-copy">
                    <i class="fas fa-copy"></i> Copiar URL
                </button>
                <button onclick="testPhoto('${name}')" class="btn-test">
                    <i class="fas fa-eye"></i> Ver Foto
                </button>
            </div>
        `;
        
        photosList.appendChild(photoItem);
    });
}

// Función para copiar URL al portapapeles
function copyPhotoUrl(personName) {
    if (!window.personPhotos || !window.personPhotos[personName]) {
        alert("No hay URL para esta persona");
        return;
    }
    
    const url = window.personPhotos[personName];
    
    navigator.clipboard.writeText(url)
        .then(() => {
            alert(`✅ URL de ${personName} copiada al portapapeles`);
        })
        .catch(err => {
            console.error('Error al copiar:', err);
            alert("❌ Error al copiar la URL");
        });
}

// Función para probar una foto
function testPhoto(personName) {
    if (!window.personPhotos || !window.personPhotos[personName]) {
        alert("No hay URL para esta persona");
        return;
    }
    
    const url = window.personPhotos[personName];
    
    // Abrir en una nueva pestaña
    window.open(url, '_blank');
}

// Función para inicializar el sistema de fotos
function inicializarSistemaFotos() {
    console.log("🚀 Inicializando sistema de fotos GitHub...");
    
    // Esperar un momento para que appData se cargue
    setTimeout(() => {
        cargarFotosGitHub().then(fotos => {
            console.log("✅ Sistema de fotos inicializado");
            console.log("📸 Fotos disponibles:", Object.keys(fotos).length);
            
            // Si el panel admin está visible, actualizar la lista
            if (document.getElementById('adminPanel') && 
                document.getElementById('adminPanel').style.display === 'block') {
                updatePhotosList();
            }
        });
    }, 1000);
}

// Inicializar cuando la página esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistemaFotos);
} else {
    inicializarSistemaFotos();
}

// También inicializar cuando Firebase esté listo
document.addEventListener('firebaseReady', inicializarSistemaFotos);

// Exportar funciones para uso global
window.obtenerFotoPersona = obtenerFotoPersona;
window.updatePersonPhoto = updatePersonPhoto;
window.updatePhotosList = updatePhotosList;
window.copyPhotoUrl = copyPhotoUrl;
window.testPhoto = testPhoto;
window.cargarFotosGitHub = cargarFotosGitHub;