// fotos-simple.js - Sistema de fotos SUPER SIMPLE

console.log("📸 Sistema de fotos cargado");

// FUNCIÓN ÚNICA Y PRINCIPAL - obtener foto de cualquier persona
window.obtenerFotoPersona = function(nombre) {
    if (!nombre) return "https://ui-avatars.com/api/?name=Usuario&background=667eea&color=fff&size=200";
    
    const nombreLimpio = nombre.trim();
    
    // Colores para avatares
    const colores = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8'];
    
    // Generar color basado en el nombre
    let hash = 0;
    for (let i = 0; i < nombreLimpio.length; i++) {
        hash = nombreLimpio.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colores.length;
    const color = colores[colorIndex];
    
    // URL del avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreLimpio)}&background=${color}&color=fff&size=200&bold=true`;
};

// Función para panel admin - actualizar foto
window.actualizarFotoPersona = function(persona, nuevaUrl) {
    console.log("📸 Actualizando foto de:", persona);
    
    if (!persona || !nuevaUrl) {
        alert("❌ Faltan datos");
        return false;
    }
    
    if (!nuevaUrl.startsWith('http')) {
        alert("❌ La URL debe empezar con http:// o https://");
        return false;
    }
    
    // Guardar en appData si existe
    if (window.appData) {
        if (!window.appData.photoUrls) window.appData.photoUrls = {};
        window.appData.photoUrls[persona] = nuevaUrl;
        
        // Actualizar en categorías
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
        
        // Guardar datos si existe la función
        if (typeof savePhotos === 'function') {
            savePhotos();
        }
        
        if (typeof saveData === 'function') {
            saveData();
        }
    }
    
    alert(`✅ Foto de ${persona} actualizada`);
    return true;
};

console.log("✅ Sistema de fotos listo (solo avatares automáticos)");