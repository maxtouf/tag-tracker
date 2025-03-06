// Modèle de données pour les tags
let allTags = [];
let filteredTags = [];

// Constantes
const TAG_TYPES = {
    'QAE KO': 'Qualité appel entrant KO',
    'QAS KO': 'Qualité appel sortant KO',
    'INJ': 'Client qui n\'arrive pas à nous joindre'
};

// Initialisation après chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation de l'application");
    
    // Récupération des éléments du formulaire
    const tagForm = document.querySelector('form') || document.createElement('form');
    const tagTypeSelect = document.getElementById('tag-type') || document.querySelector('select');
    const tagNotesInput = document.getElementById('tag-notes') || document.querySelector('input[type="text"]');
    const addButton = document.querySelector('button');
    const dateFilterSelect = document.getElementById('date-filter') || document.querySelectorAll('select')[1];
    
    // Récupération des éléments d'affichage
    const qaeCountElement = document.querySelector('#qae-count') || document.querySelectorAll('.stat-value')[0] || document.querySelectorAll('h3 + p + p')[0];
    const qasCountElement = document.querySelector('#qas-count') || document.querySelectorAll('.stat-value')[1] || document.querySelectorAll('h3 + p + p')[1];
    const injCountElement = document.querySelector('#inj-count') || document.querySelectorAll('.stat-value')[2] || document.querySelectorAll('h3 + p + p')[2];
    
    console.log("Éléments récupérés:", {
        tagTypeSelect, tagNotesInput, addButton, dateFilterSelect,
        qaeCountElement, qasCountElement, injCountElement
    });
    
    // Charger les tags existants
    loadTags();
    
    // Ajouter un événement au formulaire ou au bouton
    if (addButton) {
        addButton.addEventListener('click', function(e) {
            e.preventDefault();
            addTag();
        });
    }
    
    // Filtrage par date (si le sélecteur existe)
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', filterTags);
    }
    
    // Charger les tags du stockage local
    function loadTags() {
        const savedTags = localStorage.getItem('callTags');
        console.log("Chargement des tags depuis le stockage local");
        
        if (savedTags) {
            try {
                allTags = JSON.parse(savedTags);
                console.log("Tags chargés:", allTags.length);
            } catch (e) {
                console.error("Erreur lors du chargement des tags:", e);
                allTags = [];
            }
        } else {
            console.log("Aucun tag trouvé dans le stockage local");
            allTags = [];
        }
        
        filterTags();
    }
    
    // Fonction pour ajouter un tag
    function addTag() {
        const type = tagTypeSelect.value;
        const notes = tagNotesInput.value;
        
        console.log("Tentative d'ajout d'un tag", { type, notes });
        
        if (!type) {
            alert("Veuillez sélectionner un type de tag");
            return;
        }
        
        const newTag = {
            id: Date.now(),
            type,
            date: new Date().toISOString(),
            notes
        };
        
        console.log("Nouveau tag créé", newTag);
        
        allTags.push(newTag);
        saveTags();
        filterTags();
        
        // Réinitialiser le formulaire
        tagTypeSelect.value = '';
        tagNotesInput.value = '';
        
        console.log("Tag ajouté, nombre total:", allTags.length);
    }
    
    // Sauvegarder les tags dans le stockage local
    function saveTags() {
        localStorage.setItem('callTags', JSON.stringify(allTags));
        console.log("Tags sauvegardés dans le stockage local", allTags.length);
    }
    
    // Filtrer les tags selon la période sélectionnée
    function filterTags() {
        if (!dateFilterSelect) {
            filteredTags = [...allTags];
            updateUI();
            return;
        }
        
        const filter = dateFilterSelect.value;
        console.log("Filtrage des tags avec le filtre:", filter);
        
        if (filter === 'all' || filter === 'Toutes les périodes') {
            filteredTags = [...allTags];
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (filter === 'today' || filter === 'Aujourd\'hui') {
                filteredTags = allTags.filter(tag => new Date(tag.date) >= today);
            } else if (filter === 'week' || filter === 'Cette semaine') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                filteredTags = allTags.filter(tag => new Date(tag.date) >= startOfWeek);
            } else if (filter === 'month' || filter === 'Ce mois') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                filteredTags = allTags.filter(tag => new Date(tag.date) >= startOfMonth);
            } else {
                filteredTags = [...allTags];
            }
        }
        
        console.log("Tags filtrés:", filteredTags.length);
        updateUI();
    }
    
    // Mettre à jour l'interface utilisateur
    function updateUI() {
        // Mettre à jour les compteurs
        const qaeCount = countTagsByType('QAE KO');
        const qasCount = countTagsByType('QAS KO');
        const injCount = countTagsByType('INJ');
        
        console.log("Mise à jour des compteurs", { qaeCount, qasCount, injCount });
        
        if (qaeCountElement) qaeCountElement.textContent = qaeCount;
        if (qasCountElement) qasCountElement.textContent = qasCount;
        if (injCountElement) injCountElement.textContent = injCount;
    }
    
    // Compter les tags par type
    function countTagsByType(type) {
        return filteredTags.filter(tag => tag.type === type).length;
    }
});
