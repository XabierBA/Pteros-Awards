// fotos-github.js
// Este archivo carga las fotos desde URLs de GitHub y las maneja en Firebase

// Variables globales para fotos
window.personPhotos = {};

// URLs de ejemplo para fotos por defecto (puedes cambiarlas)
const defaultPhotos = {
    "Brais": "https://raw.githubusercontent.com/username/repo/main/fotos/brais.jpg",
    "Amalia": "https://raw.githubusercontent.com/username/repo/main/fotos/amalia.jpg",
    "Carlita": "https://raw.githubusercontent.com/username/repo/main/fotos/carlita.jpg",
    "Daniel": "https://raw.githubusercontent.com/username/repo/main/fotos/daniel.jpg",
    "Guille": "https://raw.githubusercontent.com/username/repo/main/fotos/guille.jpg",
    "Iker": "https://raw.githubusercontent.com/username/repo/main/fotos/iker.jpg",
    "Joel": "https://raw.githubusercontent.com/username/repo/main/fotos/joel.jpg",
    "Jose": "https://raw.githubusercontent.com/username/repo/main/fotos/jose.jpg",
    "Nico": "https://raw.githubusercontent.com/username/repo/main/fotos/nico.jpg",
    "Ruchiti": "https://raw.githubusercontent.com/username/repo/main/fotos/ruchiti.jpg",
    "Sara": "https://raw.githubusercontent.com/username/repo/main/fotos/sara.jpg",
    "Tiago": "https://raw.githubusercontent.com/username/repo/main/fotos/tiago.jpg",
    "Xabi": "https://raw.githubusercontent.com/username/repo/main/fotos/xabi.jpg"
};

// Función para cargar fotos desde Firebase
function loadPhotosFromFirebase() {
    if (!window.firebaseDatabase) {
        console.error("Firebase no está inicializado");
        return;
    }
    
    const { ref, onValue } = require("https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js");
    const photosRef = ref(window.firebaseDatabase, 'photos');
    
    onValue(photosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            window.personPhotos = data;
            console.log("✅ Fotos cargadas desde Firebase:", window.personPhotos);
            
            // Actualizar la lista de fotos en el panel admin si está abierto
            if (document.getElementById('adminPanel').style.display === 'block') {
                updatePhotosList();
            }
        } else {
            // Si no hay fotos en Firebase, usar las predeterminadas
            console.log("ℹ️ No hay fotos en Firebase, usando predeterminadas");
            window.personPhotos = defaultPhotos;
            savePhotosToFirebase(defaultPhotos);
        }
    }, (error) => {
        console.error("❌ Error cargando fotos:", error);
        window.personPhotos = defaultPhotos;
    });
}

// Función para guardar fotos en Firebase
function savePhotosToFirebase(photos) {
    if (!window.firebaseDatabase) {
        console.error("Firebase no está inicializado");
        return;
    }
    
    const { ref, set } = require("https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js");
    const photosRef = ref(window.firebaseDatabase, 'photos');
    
    set(photosRef, photos)
        .then(() => {
            console.log("✅ Fotos guardadas en Firebase");
        })
        .catch((error) => {
            console.error("❌ Error guardando fotos:", error);
        });
}

// Función para actualizar la foto de una persona
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
    window.personPhotos[personName] = photoUrl;
    
    // Guardar en Firebase
    savePhotosToFirebase(window.personPhotos);
    
    // Actualizar la lista de fotos
    updatePhotosList();
    
    alert(`✅ Foto de ${personName} actualizada correctamente`);
    
    // Limpiar campos
    document.getElementById('personSelect').value = '';
    document.getElementById('photoUrl').value = '';
}

// Función para actualizar la lista de fotos en el panel admin
function updatePhotosList() {
    const photosList = document.getElementById('photosList');
    if (!photosList) return;
    
    photosList.innerHTML = '';
    
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
    const url = window.personPhotos[personName];
    if (!url) {
        alert("No hay URL para esta persona");
        return;
    }
    
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
    const url = window.personPhotos[personName];
    if (!url) {
        alert("No hay URL para esta persona");
        return;
    }
    
    // Abrir en una nueva pestaña o mostrar en un modal
    window.open(url, '_blank');
}

// Inicializar fotos cuando Firebase esté listo
document.addEventListener('firebaseReady', function() {
    console.log("🖼️ Inicializando sistema de fotos...");
    loadPhotosFromFirebase();
});

// Exportar funciones para uso global
window.updatePersonPhoto = updatePersonPhoto;
window.updatePhotosList = updatePhotosList;
window.copyPhotoUrl = copyPhotoUrl;
window.testPhoto = testPhoto;