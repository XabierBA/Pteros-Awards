// Datos iniciales
let appData = {
    phase: 'nominations', // 'nominations', 'voting', 'results'
    categories: [
        {
            id: 1,
            name: "🏆 Mejor Meme Viviente",
            nominees: [
                { name: "Juan", votes: 0 },
                { name: "Ana", votes: 0 },
                { name: "Carlos", votes: 0 }
            ]
        },
        {
            id: 2,
            name: "🎮 Jugón/a del Año",
            nominees: [
                { name: "Luis", votes: 0 },
                { name: "María", votes: 0 },
                { name: "Pedro", votes: 0 }
            ]
        },
        {
            id: 3,
            name: "😂 Bromista Oficial",
            nominees: [
                { name: "Sofía", votes: 0 },
                { name: "Diego", votes: 0 },
                { name: "Laura", votes: 0 }
            ]
        },
        {
            id: 4,
            name: "🍕 Devorador/a de Pizzas",
            nominees: [
                { name: "Miguel", votes: 0 },
                { name: "Elena", votes: 0 },
                { name: "Jorge", votes: 0 }
            ]
        }
    ],
    userVotes: JSON.parse(localStorage.getItem('userVotes')) || {}
};

// Guardar en localStorage
function saveData() {
    localStorage.setItem('premiosData', JSON.stringify(appData));
}

// Cargar datos guardados
function loadData() {
    const saved = localStorage.getItem('premiosData');
    if (saved) {
        appData = JSON.parse(saved);
    }
    updatePhaseBanner();
    renderCategories();
}

// Renderizar categorías
function renderCategories() {
    const container = document.querySelector('.categories-container');
    container.innerHTML = '';
    
    appData.categories.forEach(category => {
        const totalVotes = category.nominees.reduce((sum, n) => sum + n.votes, 0);
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => openVoteModal(category.id);
        
        const top3 = category.nominees
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3);
        
        card.innerHTML = `
            <h3>${category.name}</h3>
            <div class="vote-count">${totalVotes} votos</div>
            <div class="nominees-preview">
                ${top3.map(n => `
                    <div class="nominee-tag">
                        ${n.name} (${n.votes})
                    </div>
                `).join('')}
            </div>
            <p class="category-hint">Haz clic para votar</p>
        `;
        
        container.appendChild(card);
    });
}

// Abrir modal de votación
let currentCategoryId = null;

function openVoteModal(categoryId) {
    currentCategoryId = categoryId;
    const category = appData.categories.find(c => c.id === categoryId);
    const modal = document.getElementById('voteModal');
    const modalCategory = document.getElementById('modalCategory');
    const nomineesList = document.getElementById('nomineesList');
    
    modalCategory.textContent = category.name;
    nomineesList.innerHTML = '';
    
    // Ordenar por votos
    const sortedNominees = [...category.nominees].sort((a, b) => b.votes - a.votes);
    
    sortedNominees.forEach((nominee, index) => {
        const isVoted = appData.userVotes[categoryId] === nominee.name;
        const nomineeItem = document.createElement('div');
        nomineeItem.className = `nominee-item ${isVoted ? 'voted' : ''}`;
        nomineeItem.innerHTML = `
            <h4>${nominee.name}</h4>
            <div class="vote-count-small">${nominee.votes} votos</div>
            ${isVoted ? '<div class="voted-check">✓ Votado</div>' : ''}
        `;
        nomineeItem.onclick = () => voteForNominee(nominee.name);
        nomineesList.appendChild(nomineeItem);
    });
    
    modal.style.display = 'block';
}

// Votar por un nominado
function voteForNominee(nomineeName) {
    const category = appData.categories.find(c => c.id === currentCategoryId);
    
    // En fase de votación final, solo se puede votar por los top 3
    if (appData.phase === 'voting') {
        const top3 = category.nominees
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3)
            .map(n => n.name);
        
        if (!top3.includes(nomineeName)) {
            alert('⚠️ En fase final solo puedes votar por los 3 más nominados');
            return;
        }
    }
    
    // Registrar voto del usuario
    appData.userVotes[currentCategoryId] = nomineeName;
    
    // Sumar voto al nominado
    const nominee = category.nominees.find(n => n.name === nomineeName);
    if (nominee) {
        nominee.votes++;
    }
    
    saveData();
    renderCategories();
    openVoteModal(currentCategoryId); // Recargar modal
}

// Añadir nuevo nominado
function addNominee() {
    const input = document.getElementById('newNominee');
    const name = input.value.trim();
    
    if (name && currentCategoryId) {
        const category = appData.categories.find(c => c.id === currentCategoryId);
        
        // Verificar si ya existe
        if (!category.nominees.some(n => n.name.toLowerCase() === name.toLowerCase())) {
            category.nominees.push({ name, votes: 0 });
            saveData();
            openVoteModal(currentCategoryId);
            input.value = '';
        } else {
            alert('Este nominado ya existe en la categoría');
        }
    }
}

// Cerrar modal
function closeModal() {
    document.getElementById('voteModal').style.display = 'none';
}

// Actualizar banner de fase
function updatePhaseBanner() {
    const banner = document.getElementById('phaseBanner');
    const text = document.getElementById('phaseText');
    
    switch(appData.phase) {
        case 'nominations':
            banner.style.background = 'linear-gradient(90deg, #FF416C, #FF4B2B)';
            text.textContent = '🎯 FASE DE NOMINACIONES - Vota por tus amigos';
            break;
        case 'voting':
            banner.style.background = 'linear-gradient(90deg, #2196F3, #21CBF3)';
            text.textContent = '⭐ FASE FINAL - Vota entre los 3 más nominados';
            break;
        case 'results':
            banner.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            text.textContent = '🏆 RESULTADOS FINALES - ¡Ganadores revelados!';
            break;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderCategories();
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        const modal = document.getElementById('voteModal');
        if (event.target == modal) {
            closeModal();
        }
    };
});